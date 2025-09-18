const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('8ball')
        .setDescription('Zadaj pytanie magicznej kuli 8!')
        .addStringOption(option =>
            option.setName('pytanie')
                .setDescription('Twoje pytanie dla magicznej kuli')
                .setRequired(true)
                .setMinLength(5)
                .setMaxLength(200)),
    
    cooldown: 3,
    
    async execute(interaction) {
        const question = interaction.options.getString('pytanie');

        // Różnorodne odpowiedzi 8ball
        const responses = {
            positive: [
                'Zdecydowanie tak!',
                'Tak, bez wątpienia.',
                'Tak, definitywnie.',
                'Możesz na tym polegać.',
                'Jak widzę, tak.',
                'Najprawdopodobniej.',
                'Perspektywy dobre.',
                'Tak.',
                'Znaki wskazują na tak.',
                'Odpowiedź brzmi tak.',
                'Wszystko wskazuje na to, że tak.',
                'Oczywiście!',
                'Bez wątpienia tak!'
            ],
            neutral: [
                'Odpowiedź jest niejasna, spróbuj ponownie.',
                'Zapytaj ponownie później.',
                'Lepiej ci teraz nie mówić.',
                'Nie mogę teraz przewidzieć.',
                'Skoncentruj się i zapytaj ponownie.',
                'Trudno powiedzieć.',
                'Może być...',
                'To zależy od wielu czynników.',
                'Czas pokaże.',
                'Niech los zdecyduje.'
            ],
            negative: [
                'Nie licz na to.',
                'Moja odpowiedź to nie.',
                'Moje źródła mówią nie.',
                'Perspektywy nie są zbyt dobre.',
                'Bardzo wątpliwe.',
                'Nie.',
                'Zdecydowanie nie.',
                'Nie ma mowy.',
                'Nie sądzę.',
                'Absolutnie nie.',
                'To niemożliwe.',
                'Definitywnie nie!'
            ]
        };

        // Losowy wybór kategorii i odpowiedzi
        const categories = ['positive', 'neutral', 'negative'];
        const randomCategory = categories[Math.floor(Math.random() * categories.length)];
        const categoryResponses = responses[randomCategory];
        const response = categoryResponses[Math.floor(Math.random() * categoryResponses.length)];

        // Kolory dla różnych kategorii
        const colors = {
            positive: '#00FF00',
            neutral: '#FFFF00',
            negative: '#FF0000'
        };

        // Emotikony dla kategorii
        const emojis = {
            positive: '✅',
            neutral: '🤔',
            negative: '❌'
        };

        // Embed z odpowiedzią
        const embed = new EmbedBuilder()
            .setColor(colors[randomCategory])
            .setTitle('🎱 Magiczna Kula 8')
            .addFields(
                { 
                    name: '❓ Pytanie:', 
                    value: `*"${question}"*`, 
                    inline: false 
                },
                { 
                    name: `${emojis[randomCategory]} Odpowiedź:`, 
                    value: `**${response}**`, 
                    inline: false 
                }
            )
            .setFooter({ 
                text: `Zapytanie od ${interaction.user.tag} • Wynik: ${randomCategory}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        // Dodaj specjalny efekt dla bardzo pozytywnych/negatywnych odpowiedzi
        if (response.includes('Zdecydowanie') || response.includes('Bez wątpienia')) {
            embed.setDescription('*Kula świeci jasno!*');
        } else if (response.includes('Absolutnie nie') || response.includes('Definitywnie nie')) {
            embed.setDescription('*Kula mruga groźnie...*');
        } else if (randomCategory === 'neutral') {
            embed.setDescription('*Kula jest zamglona...*');
        }

        await interaction.reply({ embeds: [embed] });

        // Losowa szansa na dodatkowy komentarz (5%)
        if (Math.random() < 0.05) {
            setTimeout(async () => {
                const bonusMessages = [
                    'Pssst... kula mówi też, że powinieneś/aś więcej się uśmiechać! 😊',
                    'Magiczna kula przypomina: życie to nie tylko tak lub nie! 🌈',
                    'Kula szepnuje: czasami najlepszą odpowiedzią jest zadanie lepszego pytania... 🤫',
                    'Bonus od kuli: pamiętaj, że sam/a tworzysz swoją przyszłość! ✨'
                ];
                
                const bonusMessage = bonusMessages[Math.floor(Math.random() * bonusMessages.length)];
                
                try {
                    await interaction.followUp({ 
                        content: bonusMessage,
                        ephemeral: true 
                    });
                } catch (error) {
                    console.log('Nie można wysłać bonus message dla 8ball');
                }
            }, 2000);
        }
    },
};
