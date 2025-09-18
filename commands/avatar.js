const { SlashCommandBuilder, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('avatar')
        .setDescription('Wyświetla awatar użytkownika')
        .addUserOption(option =>
            option.setName('użytkownik')
                .setDescription('Użytkownik, którego awatar chcesz zobaczyć')
                .setRequired(false)),
    
    cooldown: 3,
    
    async execute(interaction) {
        const user = interaction.options.getUser('użytkownik') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        // Różne formaty awatara
        const avatarFormats = ['png', 'jpg', 'jpeg', 'webp'];
        if (user.avatar && user.avatar.startsWith('a_')) {
            avatarFormats.push('gif');
        }

        // URL awatara globalnego i serwerowego
        const globalAvatar = user.displayAvatarURL({ dynamic: true, size: 4096 });
        const serverAvatar = member && member.avatar ? 
            member.displayAvatarURL({ dynamic: true, size: 4096 }) : null;

        // Embed główny
        const embed = new EmbedBuilder()
            .setColor(member?.displayHexColor || '#5865F2')
            .setTitle(`🖼️ Awatar: ${user.tag}`)
            .setDescription(serverAvatar ? 
                '**Awatar globalny** (kliknij przycisk poniżej aby zobaczyć awatar serwerowy)' : 
                '**Awatar globalny**')
            .setImage(globalAvatar)
            .setFooter({ 
                text: `Zapytanie od ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        // Dodanie informacji o użytkowniku
        embed.addFields(
            { name: 'Użytkownik', value: `${user.tag}\n\`${user.id}\``, inline: true },
            { name: 'Typ awatara', value: user.avatar ? 'Niestandardowy' : 'Domyślny', inline: true }
        );

        if (member && member.joinedAt) {
            embed.addFields(
                { name: 'Dołączył na serwer', value: `<t:${Math.floor(member.joinedAt.getTime() / 1000)}:R>`, inline: true }
            );
        }

        // Tworzenie przycisków
        const row = new ActionRowBuilder();
        
        // Przycisk linku do pełnego rozmiaru
        row.addComponents(
            new ButtonBuilder()
                .setStyle(ButtonStyle.Link)
                .setURL(globalAvatar)
                .setLabel('Pełny rozmiar')
                .setEmoji('🔗')
        );

        // Przycisk awatara serwerowego (jeśli istnieje)
        if (serverAvatar) {
            row.addComponents(
                new ButtonBuilder()
                    .setCustomId(`server_avatar_${user.id}`)
                    .setLabel('Awatar serwerowy')
                    .setStyle(ButtonStyle.Secondary)
                    .setEmoji('🏠')
            );
        }

        await interaction.reply({ 
            embeds: [embed], 
            components: [row] 
        });

        // Collector dla przycisków
        if (serverAvatar) {
            const filter = (i) => i.customId === `server_avatar_${user.id}` && i.user.id === interaction.user.id;
            const collector = interaction.channel.createMessageComponentCollector({ filter, time: 60000 });

            collector.on('collect', async (i) => {
                // Toggle między awatarem globalnym a serwerowym
                const currentIsGlobal = i.message.embeds[0].image.url === globalAvatar;
                
                const newEmbed = EmbedBuilder.from(i.message.embeds[0])
                    .setDescription(currentIsGlobal ? 
                        '**Awatar serwerowy** (kliknij przycisk poniżej aby zobaczyć awatar globalny)' : 
                        '**Awatar globalny** (kliknij przycisk poniżej aby zobaczyć awatar serwerowy)')
                    .setImage(currentIsGlobal ? serverAvatar : globalAvatar);

                const newRow = ActionRowBuilder.from(i.message.components[0]);
                newRow.components[0].setURL(currentIsGlobal ? serverAvatar : globalAvatar);
                newRow.components[1].setLabel(currentIsGlobal ? 'Awatar globalny' : 'Awatar serwerowy')
                                   .setEmoji(currentIsGlobal ? '🌐' : '🏠');

                await i.update({ 
                    embeds: [newEmbed], 
                    components: [newRow] 
                });
            });

            collector.on('end', async () => {
                try {
                    const disabledRow = ActionRowBuilder.from(row);
                    disabledRow.components.forEach(button => {
                        if (button.data.style !== ButtonStyle.Link) {
                            button.setDisabled(true);
                        }
                    });
                    await interaction.editReply({ components: [disabledRow] });
                } catch (error) {
                    console.log('Nie można wyłączyć przycisków awatara');
                }
            });
        }
    },
};
