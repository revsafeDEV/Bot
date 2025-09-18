const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ChannelType } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('slowmode')
        .setDescription('Ustawia tryb wolny na kanale')
        .addIntegerOption(option =>
            option.setName('czas')
                .setDescription('Czas w sekundach między wiadomościami (0-21600)')
                .setMinValue(0)
                .setMaxValue(21600) // 6 godzin
                .setRequired(true))
        .addChannelOption(option =>
            option.setName('kanał')
                .setDescription('Kanał do ustawienia slowmode (domyślnie aktualny)')
                .addChannelTypes(ChannelType.GuildText)
                .setRequired(false))
        .addStringOption(option =>
            option.setName('powód')
                .setDescription('Powód ustawienia slowmode')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    cooldown: 3,
    
    async execute(interaction) {
        const seconds = interaction.options.getInteger('czas');
        const channel = interaction.options.getChannel('kanał') || interaction.channel;
        const reason = interaction.options.getString('powód') || 'Nie podano powodu';

        // Sprawdzenie czy kanał jest tekstowy
        if (channel.type !== ChannelType.GuildText) {
            return interaction.reply({
                content: '❌ Slowmode można ustawić tylko na kanałach tekstowych!',
                ephemeral: true
            });
        }

        try {
            // Ustawienie slowmode
            await channel.setRateLimitPerUser(seconds, reason);

            // Formatowanie czasu
            let timeString;
            if (seconds === 0) {
                timeString = 'Wyłączony';
            } else if (seconds < 60) {
                timeString = `${seconds} sekund`;
            } else if (seconds < 3600) {
                const minutes = Math.floor(seconds / 60);
                const remainingSeconds = seconds % 60;
                timeString = remainingSeconds > 0 ? `${minutes} minut ${remainingSeconds} sekund` : `${minutes} minut`;
            } else {
                const hours = Math.floor(seconds / 3600);
                const minutes = Math.floor((seconds % 3600) / 60);
                timeString = minutes > 0 ? `${hours} godzin ${minutes} minut` : `${hours} godzin`;
            }

            // Embed z potwierdzeniem
            const embed = new EmbedBuilder()
                .setColor(seconds === 0 ? '#00FF00' : '#FF9900')
                .setTitle(seconds === 0 ? '✅ Slowmode wyłączony' : '🐌 Slowmode ustawiony')
                .addFields(
                    { name: 'Kanał', value: `${channel}`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Czas', value: timeString, inline: true },
                    { name: 'Powód', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            console.log(`${interaction.user.tag} ustawił slowmode na ${timeString} w kanale ${channel.name}`);

        } catch (error) {
            console.error('Błąd podczas ustawiania slowmode:', error);
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas ustawiania slowmode!',
                ephemeral: true
            });
        }
    },
};
