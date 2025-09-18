const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ban')
        .setDescription('Banuje użytkownika na serwerze')
        .addUserOption(option =>
            option.setName('użytkownik')
                .setDescription('Użytkownik do zbanowania')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('powód')
                .setDescription('Powód banowania')
                .setRequired(false))
        .addIntegerOption(option =>
            option.setName('dni_wiadomości')
                .setDescription('Ile dni wiadomości usunąć (0-7)')
                .setMinValue(0)
                .setMaxValue(7)
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    cooldown: 5,
    
    async execute(interaction) {
        const target = interaction.options.getUser('użytkownik');
        const reason = interaction.options.getString('powód') || 'Nie podano powodu';
        const deleteMessageDays = interaction.options.getInteger('dni_wiadomości') || 0;
        const member = interaction.guild.members.cache.get(target.id);

        // Sprawdzenie czy użytkownik próbuje zbanować samego siebie
        if (target.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ Nie możesz zbanować samego siebie!',
                ephemeral: true
            });
        }

        // Sprawdzenie czy użytkownik jest już zbanowany
        try {
            const bannedUser = await interaction.guild.bans.fetch(target.id);
            if (bannedUser) {
                return interaction.reply({
                    content: '❌ Ten użytkownik jest już zbanowany!',
                    ephemeral: true
                });
            }
        } catch (error) {
            // Użytkownik nie jest zbanowany, kontynuuj
        }

        // Jeśli użytkownik jest na serwerze, sprawdź hierarchię
        if (member) {
            if (!member.bannable) {
                return interaction.reply({
                    content: '❌ Nie mogę zbanować tego użytkownika! (Sprawdź hierarchię ról)',
                    ephemeral: true
                });
            }

            if (member.roles.highest.position >= interaction.member.roles.highest.position) {
                return interaction.reply({
                    content: '❌ Nie możesz zbanować użytkownika o równej lub wyższej roli!',
                    ephemeral: true
                });
            }
        }

        try {
            // Próba wysłania prywatnej wiadomości do użytkownika (jeśli jest na serwerze)
            if (member) {
                try {
                    const dmEmbed = new EmbedBuilder()
                        .setColor('#8B0000')
                        .setTitle('🔨 Zostałeś zbanowany!')
                        .addFields(
                            { name: 'Serwer', value: interaction.guild.name, inline: true },
                            { name: 'Zbanowany przez', value: interaction.user.tag, inline: true },
                            { name: 'Powód', value: reason }
                        )
                        .setTimestamp();

                    await target.send({ embeds: [dmEmbed] });
                } catch (error) {
                    console.log(`Nie można wysłać DM do ${target.tag}`);
                }
            }

            // Banowanie użytkownika
            await interaction.guild.members.ban(target, {
                reason: reason,
                deleteMessageDays: deleteMessageDays
            });

            // Embed z potwierdzeniem
            const embed = new EmbedBuilder()
                .setColor('#8B0000')
                .setTitle('✅ Użytkownik został zbanowany')
                .addFields(
                    { name: 'Użytkownik', value: `${target.tag} (${target.id})`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Powód', value: reason },
                    { name: 'Usunięto wiadomości', value: `${deleteMessageDays} dni`, inline: true }
                )
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

            console.log(`${interaction.user.tag} zbanował ${target.tag} z powodu: ${reason}`);

        } catch (error) {
            console.error('Błąd podczas banowania:', error);
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas banowania użytkownika!',
                ephemeral: true
            });
        }
    },
};
