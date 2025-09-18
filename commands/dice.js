const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('dice')
        .setDescription('Rzuca kostkami!')
        .addIntegerOption(option =>
            option.setName('ilość')
                .setDescription('Ile kostek rzucić (1-10)')
                .setMinValue(1)
                .setMaxValue(10)
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('strony')
                .setDescription('Ile stron ma kostka (4, 6, 8, 10, 12, 20, 100)')
                .addChoices(
                    { name: 'D4 (4 strony)', value: 4 },
                    { name: 'D6 (6 stron) - standardowa', value: 6 },
                    { name: 'D8 (8 stron)', value: 8 },
                    { name: 'D10 (10 stron)', value: 10 },
                    { name: 'D12 (12 stron)', value: 12 },
                    { name: 'D20 (20 stron)', value: 20 },
                    { name: 'D100 (100 stron)', value: 100 }
                )
                .setRequired(false)),
    
    cooldown: 2,
    
    async execute(interaction) {
        const diceCount = interaction.options.getInteger('ilość') || 1;
        const diceSides = interaction.options.getInteger('strony') || 6;

        // Rzucanie kostkami
        const results = [];
        let total = 0;

        for (let i = 0; i < diceCount; i++) {
            const roll = Math.floor(Math.random() * diceSides) + 1;
            results.push(roll);
            total += roll;
        }

        // Określenie emoji kostki
        const getDiceEmoji = (sides, value) => {
            if (sides === 6) {
                const diceEmojis = ['⚀', '⚁', '⚂', '⚃', '⚄', '⚅'];
                return diceEmojis[value - 1] || '🎲';
            }
            return '🎲';
        };

        // Sprawdzenie specjalnych wyników
        const getSpecialMessage = (results, sides) => {
            const maxPossible = results.length * sides;
            const minPossible = results.length * 1;
            
            if (total === maxPossible) {
                return '🔥 **MAKSYMALNE WYNIKI!** 🔥';
            } else if (total === minPossible) {
                return '💥 **KRYTYCZNA PORAŻKA!** 💥';
            } else if (results.every(r => r === sides)) {
                return '✨ **WSZYSTKIE MAKSYMALNE!** ✨';
            } else if (results.every(r => r === 1)) {
                return '😱 **WSZYSTKIE JEDYNKI!** 😱';
            } else if (sides === 20 && results.includes(20)) {
                return '🎯 **NATURAL 20!** 🎯';
            } else if (sides === 20 && results.includes(1)) {
                return '💀 **NATURAL 1!** 💀';
            }
            return null;
        };

        const specialMessage = getSpecialMessage(results, diceSides);

        // Formatowanie wyników
        let resultsDisplay;
        if (diceSides === 6 && diceCount <= 5) {
            resultsDisplay = results.map(r => getDiceEmoji(6, r)).join(' ');
        } else {
            resultsDisplay = results.map(r => `**${r}**`).join(', ');
        }

        // Średnia i statystyki
        const average = (total / diceCount).toFixed(1);
        const maxResult = Math.max(...results);
        const minResult = Math.min(...results);

        // Kolor embed na podstawie wyników
        let color = '#5865F2';
        if (specialMessage) {
            if (specialMessage.includes('MAKSYMALNE') || specialMessage.includes('NATURAL 20')) {
                color = '#00FF00';
            } else if (specialMessage.includes('PORAŻKA') || specialMessage.includes('NATURAL 1')) {
                color = '#FF0000';
            } else {
                color = '#FFD700';
            }
        }

        // Embed z wynikami
        const embed = new EmbedBuilder()
            .setColor(color)
            .setTitle(`🎲 Rzut ${diceCount}D${diceSides}`)
            .setDescription(specialMessage || `Wyniki rzutu ${diceCount} kostką D${diceSides}`)
            .addFields(
                {
                    name: '🎯 Wyniki:',
                    value: resultsDisplay,
                    inline: false
                },
                {
                    name: '📊 Suma:',
                    value: `**${total}**`,
                    inline: true
                }
            )
            .setFooter({ 
                text: `Rzucił/a: ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        // Dodatkowe statystyki dla więcej niż jednej kostki
        if (diceCount > 1) {
            embed.addFields(
                {
                    name: '📈 Średnia:',
                    value: `**${average}**`,
                    inline: true
                },
                {
                    name: '⬆️ Najwyższa:',
                    value: `**${maxResult}**`,
                    inline: true
                },
                {
                    name: '⬇️ Najniższa:',
                    value: `**${minResult}**`,
                    inline: true
                }
            );
        }

        // Dodatkowe info o prawdopodobieństwie (dla ciekawych wyników)
        if (diceCount === 1 && diceSides === 20) {
            const probability = ((1 / diceSides) * 100).toFixed(1);
            embed.addFields({
                name: '🎯 Prawdopodobieństwo tego wyniku:',
                value: `**${probability}%** (1/${diceSides})`,
                inline: true
            });
        }

        await interaction.reply({ embeds: [embed] });
    },
};
