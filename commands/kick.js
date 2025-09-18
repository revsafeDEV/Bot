const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('kick')
        .setDescription('Wyrzuca użytkownika z serwera')
        .addUserOption(option =>
            option.setName('użytkownik')
                .setDescription('Użytkownik do wyrzucenia')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('powód')
                .setDescription('Powód wyrzucenia')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.KickMembers),
    
    cooldown: 5,
    
    async execute(interaction) {
        const target = interaction.options.getUser('użytkownik');
        const reason = interaction.options.getString('powód') || 'Nie podano powodu';
        const member = interaction.guild.members.cache.get(target.id);

        // Sprawdzenie czy użytkownik istnieje na serwerze
        if (!member) {
            return interaction.reply({
                content: '❌ Użytkownik nie został znaleziony na tym serwerze!',
                ephemeral: true
            });
        }

        // Sprawdzenie czy bot może wyrzucić tego użytkownika
        if (!member.kickable) {
            return interaction.reply({
                content: '❌ Nie mogę wyrzucić tego użytkownika! (Sprawdź hierarchię ról)',
                ephemeral: true
            });
        }

        // Sprawdzenie czy użytkownik próbuje wyrzucić samego siebie
        if (target.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ Nie możesz wyrzucić samego siebie!',
                ephemeral: true
            });
        }

        // Sprawdzenie hierarchii ról
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                content: '❌ Nie możesz wyrzucić użytkownika o równej lub wyższej roli!',
                ephemeral: true
            });
        }

        try {
            // Próba wysłania prywatnej wiadomości do użytkownika
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FF6B6B')
                    .setTitle('🦶 Zostałeś wyrzucony!')
                    .addFields(
                        { name: 'Serwer', value: interaction.guild.name, inline: true },
                        { name: 'Wyrzucony przez', value: interaction.user.tag, inline: true },
                        { name: 'Powód', value: reason }
                    )
                    .setTimestamp();

                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log(`Nie można wysłać DM do ${target.tag}`);
            }

            // Wyrzucenie użytkownika
            await member.kick(reason);

            // Embed z potwierdzeniem
            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('✅ Użytkownik został wyrzucony')
                .addFields(
                    { name: 'Użytkownik', value: `${target.tag} (${target.id})`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Powód', value: reason }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            console.log(`${interaction.user.tag} wyrzucił ${target.tag} z powodu: ${reason}`);

        } catch (error) {
            console.error('Błąd podczas wyrzucania:', error);
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas wyrzucania użytkownika!',
                ephemeral: true
            });
        }
    },
};
