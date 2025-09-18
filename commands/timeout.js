const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('timeout')
        .setDescription('Wycisza użytkownika na określony czas')
        .addUserOption(option =>
            option.setName('użytkownik')
                .setDescription('Użytkownik do wyciszenia')
                .setRequired(true))
        .addIntegerOption(option =>
            option.setName('czas')
                .setDescription('Czas wyciszenia w minutach (1-10080)')
                .setMinValue(1)
                .setMaxValue(10080) // 7 dni
                .setRequired(true))
        .addStringOption(option =>
            option.setName('powód')
                .setDescription('Powód wyciszenia')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ModerateMembers),
    
    cooldown: 3,
    
    async execute(interaction) {
        const target = interaction.options.getUser('użytkownik');
        const duration = interaction.options.getInteger('czas');
        const reason = interaction.options.getString('powód') || 'Nie podano powodu';
        const member = interaction.guild.members.cache.get(target.id);

        // Sprawdzenie czy użytkownik istnieje na serwerze
        if (!member) {
            return interaction.reply({
                content: '❌ Użytkownik nie został znaleziony na tym serwerze!',
                ephemeral: true
            });
        }

        // Sprawdzenie czy użytkownik próbuje wyciszyć samego siebie
        if (target.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ Nie możesz wyciszyć samego siebie!',
                ephemeral: true
            });
        }

        // Sprawdzenie hierarchii ról
        if (member.roles.highest.position >= interaction.member.roles.highest.position) {
            return interaction.reply({
                content: '❌ Nie możesz wyciszyć użytkownika o równej lub wyższej roli!',
                ephemeral: true
            });
        }

        // Sprawdzenie czy bot może wyciszyć tego użytkownika
        if (!member.moderatable) {
            return interaction.reply({
                content: '❌ Nie mogę wyciszyć tego użytkownika! (Sprawdź hierarchię ról)',
                ephemeral: true
            });
        }

        try {
            const timeoutDuration = duration * 60 * 1000; // Konwersja minut na milisekundy
            
            // Próba wysłania prywatnej wiadomości do użytkownika
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor('#FF9900')
                    .setTitle('⏰ Zostałeś wyciszony!')
                    .addFields(
                        { name: 'Serwer', value: interaction.guild.name, inline: true },
                        { name: 'Wyciszony przez', value: interaction.user.tag, inline: true },
                        { name: 'Czas', value: `${duration} minut`, inline: true },
                        { name: 'Powód', value: reason }
                    )
                    .setTimestamp();

                await target.send({ embeds: [dmEmbed] });
            } catch (error) {
                console.log(`Nie można wysłać DM do ${target.tag}`);
            }

            // Wyciszenie użytkownika
            await member.timeout(timeoutDuration, reason);

            // Oblicz czas zakończenia timeout
            const endTime = new Date(Date.now() + timeoutDuration);
            const endTimestamp = Math.floor(endTime.getTime() / 1000);

            // Embed z potwierdzeniem
            const embed = new EmbedBuilder()
                .setColor('#FF9900')
                .setTitle('✅ Użytkownik został wyciszony')
                .addFields(
                    { name: 'Użytkownik', value: `${target.tag} (${target.id})`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Czas trwania', value: `${duration} minut`, inline: true },
                    { name: 'Koniec wyciszenia', value: `<t:${endTimestamp}:F>`, inline: false },
                    { name: 'Powód', value: reason, inline: false }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            console.log(`${interaction.user.tag} wyciszył ${target.tag} na ${duration} minut z powodu: ${reason}`);

        } catch (error) {
            console.error('Błąd podczas wyciszania:', error);
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas wyciszania użytkownika!',
                ephemeral: true
            });
        }
    },
};
