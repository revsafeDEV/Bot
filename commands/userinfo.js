const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('userinfo')
        .setDescription('Wyświetla informacje o użytkowniku')
        .addUserOption(option =>
            option.setName('użytkownik')
                .setDescription('Użytkownik do sprawdzenia')
                .setRequired(false)),
    
    cooldown: 3,
    
    async execute(interaction) {
        const user = interaction.options.getUser('użytkownik') || interaction.user;
        const member = interaction.guild.members.cache.get(user.id);

        if (!member) {
            return interaction.reply({
                content: '❌ Użytkownik nie został znaleziony na tym serwerze!',
                ephemeral: true
            });
        }

        // Obliczanie czasu na serwerze
        const joinedTimestamp = Math.floor(member.joinedAt.getTime() / 1000);
        const createdTimestamp = Math.floor(user.createdAt.getTime() / 1000);

        // Role użytkownika (bez @everyone)
        const roles = member.roles.cache
            .filter(role => role.name !== '@everyone')
            .sort((a, b) => b.position - a.position)
            .map(role => `<@&${role.id}>`)
            .slice(0, 20); // Maksymalnie 20 ról

        // Status użytkownika
        let status = 'Offline';
        if (member.presence) {
            switch (member.presence.status) {
                case 'online':
                    status = '🟢 Online';
                    break;
                case 'idle':
                    status = '🟡 Nieaktywny';
                    break;
                case 'dnd':
                    status = '🔴 Nie przeszkadzać';
                    break;
                case 'offline':
                    status = '⚫ Offline';
                    break;
            }
        }

        // Aktywności użytkownika
        let activities = 'Brak';
        if (member.presence && member.presence.activities.length > 0) {
            activities = member.presence.activities
                .map(activity => {
                    switch (activity.type) {
                        case 0:
                            return `🎮 Gra w ${activity.name}`;
                        case 1:
                            return `📺 Streamuje ${activity.name}`;
                        case 2:
                            return `🎵 Słucha ${activity.name}`;
                        case 3:
                            return `📺 Ogląda ${activity.name}`;
                        case 4:
                            return `📝 ${activity.state}`;
                        case 5:
                            return `🏆 Współzawodniczy w ${activity.name}`;
                        default:
                            return activity.name;
                    }
                })
                .join('\n');
        }

        // Tworzenie embed
        const embed = new EmbedBuilder()
            .setColor(member.displayHexColor || '#5865F2')
            .setTitle(`Informacje o ${user.tag}`)
            .setThumbnail(user.displayAvatarURL({ dynamic: true, size: 256 }))
            .addFields(
                {
                    name: '👤 Podstawowe informacje',
                    value: [
                        `**Nazwa użytkownika:** ${user.tag}`,
                        `**ID:** ${user.id}`,
                        `**Pseudonim:** ${member.nickname || 'Brak'}`,
                        `**Status:** ${status}`,
                        `**Bot:** ${user.bot ? 'Tak' : 'Nie'}`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: '📅 Daty',
                    value: [
                        `**Konto utworzone:** <t:${createdTimestamp}:F>`,
                        `**Dołączył na serwer:** <t:${joinedTimestamp}:F>`,
                        `**Dołączył:** <t:${joinedTimestamp}:R>`
                    ].join('\n'),
                    inline: false
                },
                {
                    name: `🎭 Role (${roles.length})`,
                    value: roles.length > 0 ? roles.join(' ') : 'Brak ról',
                    inline: false
                }
            );

        // Dodanie aktywności jeśli istnieją
        if (activities !== 'Brak') {
            embed.addFields({
                name: '🎮 Aktywności',
                value: activities,
                inline: false
            });
        }

        // Dodanie permisji (tylko kluczowe)
        const keyPermissions = [];
        if (member.permissions.has('Administrator')) keyPermissions.push('Administrator');
        if (member.permissions.has('ManageGuild')) keyPermissions.push('Zarządzanie serwerem');
        if (member.permissions.has('ManageRoles')) keyPermissions.push('Zarządzanie rolami');
        if (member.permissions.has('ManageChannels')) keyPermissions.push('Zarządzanie kanałami');
        if (member.permissions.has('KickMembers')) keyPermissions.push('Wyrzucanie członków');
        if (member.permissions.has('BanMembers')) keyPermissions.push('Banowanie członków');
        if (member.permissions.has('ManageMessages')) keyPermissions.push('Zarządzanie wiadomościami');

        if (keyPermissions.length > 0) {
            embed.addFields({
                name: '🔑 Kluczowe uprawnienia',
                value: keyPermissions.join(', '),
                inline: false
            });
        }

        embed.setFooter({
            text: `Zapytanie od ${interaction.user.tag}`,
            iconURL: interaction.user.displayAvatarURL()
        })
        .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },
};
