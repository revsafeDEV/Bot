const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('serverinfo')
        .setDescription('Wyświetla informacje o serwerze'),
    
    cooldown: 5,
    
    async execute(interaction) {
        const guild = interaction.guild;

        // Pobieranie informacji o serwerze
        const owner = await guild.fetchOwner();
        const createdTimestamp = Math.floor(guild.createdAt.getTime() / 1000);

        // Statystyki członków
        const memberCount = guild.memberCount;
        const members = await guild.members.fetch();
        const bots = members.filter(member => member.user.bot).size;
        const humans = memberCount - bots;

        // Statystyki kanałów
        const channels = guild.channels.cache;
        const textChannels = channels.filter(channel => channel.type === 0).size;
        const voiceChannels = channels.filter(channel => channel.type === 2).size;
        const categories = channels.filter(channel => channel.type === 4).size;

        // Statystyki ról
        const roleCount = guild.roles.cache.size - 1; // Bez @everyone

        // Statystyki emote
        const emojiCount = guild.emojis.cache.size;
        const animatedEmojis = guild.emojis.cache.filter(emoji => emoji.animated).size;
        const staticEmojis = emojiCount - animatedEmojis;

        // Level weryfikacji
        const verificationLevels = {
            0: 'Brak',
            1: 'Niski',
            2: 'Średni',
            3: 'Wysoki',
            4: 'Bardzo wysoki'
        };

        // Poziom boostowania
        const boostLevel = guild.premiumTier;
        const boostCount = guild.premiumSubscriptionCount;

        // Funkcje serwera
        const features = [];
        if (guild.features.includes('VERIFIED')) features.push('✅ Zweryfikowany');
        if (guild.features.includes('PARTNERED')) features.push('🤝 Partner Discord');
        if (guild.features.includes('COMMUNITY')) features.push('🏘️ Serwer społecznościowy');
        if (guild.features.includes('DISCOVERABLE')) features.push('🔍 Wykrywalny');
        if (guild.features.includes('WELCOME_SCREEN_ENABLED')) features.push('👋 Ekran powitalny');
        if (guild.features.includes('NEWS')) features.push('📰 Kanały ogłoszeń');
        if (guild.features.includes('THREADS_ENABLED')) features.push('🧵 Wątki');
        if (guild.features.includes('MEMBER_VERIFICATION_GATE_ENABLED')) features.push('🚪 Brama weryfikacji');

        // Tworzenie embed
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle(`📊 Informacje o serwerze`)
            .setThumbnail(guild.iconURL({ dynamic: true, size: 256 }))
            .addFields(
                {
                    name: '🏷️ Podstawowe informacje',
                    value: [
                        `**Nazwa:** ${guild.name}`,
                        `**ID:** ${guild.id}`,
                        `**Właściciel:** ${owner.user.tag}`,
                        `**Utworzony:** <t:${createdTimestamp}:F>`,
                        `**Utworzony:** <t:${createdTimestamp}:R>`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '👥 Członkowie',
                    value: [
                        `**Wszyscy:** ${memberCount}`,
                        `**Ludzie:** ${humans}`,
                        `**Boty:** ${bots}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '📝 Kanały',
                    value: [
                        `**Tekstowe:** ${textChannels}`,
                        `**Głosowe:** ${voiceChannels}`,
                        `**Kategorie:** ${categories}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🎭 Pozostałe',
                    value: [
                        `**Role:** ${roleCount}`,
                        `**Emotki:** ${emojiCount}`,
                        `**Statyczne:** ${staticEmojis}`,
                        `**Animowane:** ${animatedEmojis}`
                    ].join('\n'),
                    inline: true
                },
                {
                    name: '🔒 Bezpieczeństwo',
                    value: [
                        `**Poziom weryfikacji:** ${verificationLevels[guild.verificationLevel]}`,
                        `**Filtr treści:** ${guild.explicitContentFilter === 0 ? 'Wyłączony' : guild.explicitContentFilter === 1 ? 'Tylko członkowie bez ról' : 'Wszyscy członkowie'}`
                    ].join('\n'),
                    inline: false
                }
            );

        // Dodanie informacji o boostach
        if (boostLevel > 0) {
            embed.addFields({
                name: '💎 Nitro Boost',
                value: [
                    `**Poziom:** ${boostLevel}`,
                    `**Boosty:** ${boostCount}`
                ].join('\n'),
                inline: true
            });
        }

        // Dodanie funkcji serwera
        if (features.length > 0) {
            embed.addFields({
                name: '✨ Funkcje serwera',
                value: features.join('\n'),
                inline: false
            });
        }

        // Dodanie banera jeśli istnieje
        if (guild.bannerURL()) {
            embed.setImage(guild.bannerURL({ dynamic: true, size: 1024 }));
        }

        embed.setFooter({
            text: `Zapytanie od ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
