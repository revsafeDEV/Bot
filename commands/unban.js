const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('unban')
        .setDescription('Usuwa ban użytkownika')
        .addStringOption(option =>
            option.setName('user_id')
                .setDescription('ID użytkownika do odbanowania')
                .setRequired(true))
        .addStringOption(option =>
            option.setName('powód')
                .setDescription('Powód odbanowania')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.BanMembers),
    
    cooldown: 5,
    
    async execute(interaction) {
        const userId = interaction.options.getString('user_id');
        const reason = interaction.options.getString('powód') || 'Nie podano powodu';

        // Sprawdzenie czy ID jest poprawne (tylko cyfry i odpowiednia długość)
        if (!/^\d{17,19}$/.test(userId)) {
            return interaction.reply({
                content: '❌ Podaj poprawne ID użytkownika! (17-19 cyfr)',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            // Sprawdź czy użytkownik jest zbanowany
            const bannedUser = await interaction.guild.bans.fetch(userId).catch(() => null);
            
            if (!bannedUser) {
                return interaction.editReply({
                    content: '❌ Użytkownik o tym ID nie jest zbanowany lub nie istnieje!'
                });
            }

            // Odbanuj użytkownika
            await interaction.guild.members.unban(userId, reason);

            // Pobierz informacje o użytkowniku
            const user = bannedUser.user;

            // Embed z potwierdzeniem
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Użytkownik został odbanowany')
                .addFields(
                    { name: 'Użytkownik', value: `${user.tag} (${user.id})`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Powód odbanowania', value: reason, inline: false }
                )
                .setThumbnail(user.displayAvatarURL())
                .setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            console.log(`${interaction.user.tag} odbanował ${user.tag} z powodu: ${reason}`);

        } catch (error) {
            console.error('Błąd podczas odbanowywania:', error);
            
            let errorMessage = '❌ Wystąpił błąd podczas odbanowywania użytkownika!';
            
            if (error.code === 10026) {
                errorMessage = '❌ Nie znaleziono użytkownika o podanym ID!';
            } else if (error.code === 10013) {
                errorMessage = '❌ Użytkownik nie jest zbanowany!';
            }

            await interaction.editReply({ content: errorMessage });
        }
    },
};
