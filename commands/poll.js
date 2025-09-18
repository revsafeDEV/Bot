const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('poll')
        .setDescription('Tworzy głosowanie')
        .addStringOption(option =>
            option.setName('pytanie')
                .setDescription('Pytanie do głosowania')
                .setRequired(true)
                .setMaxLength(200))
        .addStringOption(option =>
            option.setName('opcja1')
                .setDescription('Pierwsza opcja')
                .setRequired(true)
                .setMaxLength(100))
        .addStringOption(option =>
            option.setName('opcja2')
                .setDescription('Druga opcja')
                .setRequired(true)
                .setMaxLength(100))
        .addStringOption(option =>
            option.setName('opcja3')
                .setDescription('Trzecia opcja (opcjonalna)')
                .setRequired(false)
                .setMaxLength(100))
        .addStringOption(option =>
            option.setName('opcja4')
                .setDescription('Czwarta opcja (opcjonalna)')
                .setRequired(false)
                .setMaxLength(100))
        .addStringOption(option =>
            option.setName('opcja5')
                .setDescription('Piąta opcja (opcjonalna)')
                .setRequired(false)
                .setMaxLength(100))
        .addIntegerOption(option =>
            option.setName('czas')
                .setDescription('Czas trwania głosowania w minutach (1-1440)')
                .setMinValue(1)
                .setMaxValue(1440)
                .setRequired(false))
        .addBooleanOption(option =>
            option.setName('anonimowe')
                .setDescription('Czy głosowanie ma być anonimowe (domyślnie: nie)')
                .setRequired(false)),
    
    cooldown: 10,
    
    async execute(interaction) {
        const question = interaction.options.getString('pytanie');
        const duration = interaction.options.getInteger('czas') || 60; // Domyślnie 60 minut
        const anonymous = interaction.options.getBoolean('anonimowe') || false;

        // Zbieranie opcji
        const options = [];
        for (let i = 1; i <= 5; i++) {
            const option = interaction.options.getString(`opcja${i}`);
            if (option) options.push(option);
        }

        // Emoji dla opcji (maksymalnie 5)
        const emojis = ['1️⃣', '2️⃣', '3️⃣', '4️⃣', '5️⃣'];

        // Mapa głosów - przechowuje ID użytkowników i ich wybory
        const votes = new Map(); // userId -> optionIndex

        // Tworzenie embed
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('📊 Głosowanie')
            .setDescription(`**${question}**`)
            .addFields(
                {
                    name: '📋 Opcje:',
                    value: options.map((opt, idx) => `${emojis[idx]} ${opt}`).join('\\n'),
                    inline: false
                },
                {
                    name: '⏱️ Czas trwania:',
                    value: `${duration} minut`,
                    inline: true
                },
                {
                    name: '🔒 Typ:',
                    value: anonymous ? 'Anonimowe' : 'Publiczne',
                    inline: true
                },
                {
                    name: '👥 Głosów oddano:',
                    value: '0',
                    inline: true
                }
            )
            .setFooter({ 
                text: `Utworzył/a: ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        // Dodanie pola z wynikami
        embed.addFields({
            name: '📈 Aktualne wyniki:',
            value: options.map((opt, idx) => `${emojis[idx]} **${opt}**: 0 głosów (0%)`).join('\\n'),
            inline: false
        });

        // Tworzenie przycisków
        const row = new ActionRowBuilder();
        options.forEach((option, index) => {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`poll_vote_${index}`)
                    .setLabel(`${option}`)
                    .setEmoji(emojis[index])
                    .setStyle(ButtonStyle.Primary)
            );
        });

        // Przycisk zakończenia głosowania (tylko dla twórcy)
        if (options.length <= 4) { // Maksymalnie 5 przycisków w rzędzie
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId('poll_end')
                    .setLabel('Zakończ')
                    .setStyle(ButtonStyle.Danger)
                    .setEmoji('🛑')
            );
        }

        const message = await interaction.reply({ 
            embeds: [embed], 
            components: [row],
            fetchReply: true
        });

        // Funkcja aktualizacji wyników
        const updateResults = () => {
            const totalVotes = votes.size;
            const results = new Array(options.length).fill(0);
            
            // Policz głosy
            for (const optionIndex of votes.values()) {
                results[optionIndex]++;
            }

            // Aktualizuj embed
            const updatedEmbed = EmbedBuilder.from(embed);
            
            // Aktualizuj liczbę głosów
            updatedEmbed.data.fields[3].value = totalVotes.toString();
            
            // Aktualizuj wyniki
            const resultsText = options.map((opt, idx) => {
                const count = results[idx];
                const percentage = totalVotes > 0 ? Math.round((count / totalVotes) * 100) : 0;
                const bar = '█'.repeat(Math.floor(percentage / 5)) + '░'.repeat(20 - Math.floor(percentage / 5));
                return `${emojis[idx]} **${opt}**: ${count} głosów (${percentage}%)\\n${bar}`;
            }).join('\\n\\n');
            
            updatedEmbed.data.fields[4].value = resultsText;
            
            return updatedEmbed;
        };

        // Collector dla przycisków
        const collector = message.createMessageComponentCollector({ 
            time: duration * 60 * 1000 
        });

        collector.on('collect', async (i) => {
            if (i.customId === 'poll_end') {
                // Tylko twórca może zakończyć głosowanie
                if (i.user.id !== interaction.user.id) {
                    return i.reply({
                        content: '❌ Tylko twórca głosowania może je zakończyć!',
                        ephemeral: true
                    });
                }
                collector.stop('ended_by_creator');
                return;
            }

            // Obsługa głosowania
            if (i.customId.startsWith('poll_vote_')) {
                const optionIndex = parseInt(i.customId.split('_')[2]);
                const previousVote = votes.get(i.user.id);

                if (previousVote === optionIndex) {
                    return i.reply({
                        content: '❌ Już zagłosowałeś/aś na tę opcję!',
                        ephemeral: true
                    });
                }

                votes.set(i.user.id, optionIndex);
                
                const updatedEmbed = updateResults();
                await i.update({ embeds: [updatedEmbed] });

                // Potwierdzenie głosu (jeśli nie anonimowe)
                if (!anonymous) {
                    await i.followUp({
                        content: `✅ Zagłosowałeś/aś na: **${options[optionIndex]}**${previousVote !== undefined ? ' (zmieniono głos)' : ''}`,
                        ephemeral: true
                    });
                } else {
                    await i.followUp({
                        content: '✅ Twój głos został zapisany anonimowo!',
                        ephemeral: true
                    });
                }
            }
        });

        collector.on('end', async (collected, reason) => {
            // Wyłącz przyciski
            const disabledRow = ActionRowBuilder.from(row);
            disabledRow.components.forEach(button => button.setDisabled(true));

            const finalEmbed = updateResults();
            
            if (reason === 'time') {
                finalEmbed.setColor('#FF6B6B')
                         .setDescription(`**${question}**\\n\\n⏰ **Głosowanie zakończone - upłynął czas!**`);
            } else if (reason === 'ended_by_creator') {
                finalEmbed.setColor('#FF9900')
                         .setDescription(`**${question}**\\n\\n🛑 **Głosowanie zakończone przez twórcy!**`);
            }

            try {
                await interaction.editReply({ 
                    embeds: [finalEmbed], 
                    components: [disabledRow] 
                });
            } catch (error) {
                console.error('Błąd podczas kończenia głosowania:', error);
            }
        });
    },
};
