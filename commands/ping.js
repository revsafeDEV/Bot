const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ping')
        .setDescription('Sprawdza latencję bota i API Discord'),
    
    cooldown: 5,
    
    async execute(interaction) {
        // Pomiar czasu odpowiedzi
        const sent = await interaction.reply({ 
            content: '🏓 Pinguję...', 
            fetchReply: true 
        });

        // Obliczenie latencji
        const roundtrip = sent.createdTimestamp - interaction.createdTimestamp;
        const apiLatency = Math.round(interaction.client.ws.ping);

        // Określenie jakości połączenia
        const getRoundtripStatus = (ms) => {
            if (ms < 100) return { emoji: '🟢', status: 'Doskonała' };
            if (ms < 200) return { emoji: '🟡', status: 'Dobra' };
            if (ms < 500) return { emoji: '🟠', status: 'Średnia' };
            return { emoji: '🔴', status: 'Słaba' };
        };

        const getAPIStatus = (ms) => {
            if (ms < 100) return { emoji: '🟢', status: 'Doskonała' };
            if (ms < 200) return { emoji: '🟡', status: 'Dobra' };
            if (ms < 300) return { emoji: '🟠', status: 'Średnia' };
            return { emoji: '🔴', status: 'Słaba' };
        };

        const roundtripInfo = getRoundtripStatus(roundtrip);
        const apiInfo = getAPIStatus(apiLatency);

        // Status bota
        const uptime = process.uptime();
        const uptimeString = formatUptime(uptime);

        // Embed z informacjami
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🏓 Pong!')
            .setDescription('Informacje o latencji i statusie bota')
            .addFields(
                {
                    name: '📡 Latencja wiadomości',
                    value: `${roundtripInfo.emoji} **${roundtrip}ms** (${roundtripInfo.status})`,
                    inline: true
                },
                {
                    name: '🌐 Latencja API',
                    value: `${apiInfo.emoji} **${apiLatency}ms** (${apiInfo.status})`,
                    inline: true
                },
                {
                    name: '⏱️ Czas działania',
                    value: `🟢 **${uptimeString}**`,
                    inline: true
                },
                {
                    name: '💾 Użycie pamięci',
                    value: `**${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)} MB**`,
                    inline: true
                },
                {
                    name: '🏠 Serwery',
                    value: `**${interaction.client.guilds.cache.size}**`,
                    inline: true
                },
                {
                    name: '👥 Użytkownicy',
                    value: `**${interaction.client.users.cache.size}**`,
                    inline: true
                }
            )
            .setFooter({ 
                text: `Zapytanie od ${interaction.user.tag}`,
                iconURL: interaction.user.displayAvatarURL()
            })
            .setTimestamp();

        // Dodaj informacje o shardach jeśli bot używa sharding
        if (interaction.client.shard) {
            embed.addFields({
                name: '🔀 Shard',
                value: `**${interaction.client.shard.ids[0] + 1}/${interaction.client.shard.count}**`,
                inline: true
            });
        }

        await interaction.editReply({ 
            content: '', 
            embeds: [embed] 
        });
    },
};

function formatUptime(seconds) {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    const parts = [];
    if (days > 0) parts.push(`${days}d`);
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0 || parts.length === 0) parts.push(`${secs}s`);

    return parts.join(' ');
}
