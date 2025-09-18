const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('clear')
        .setDescription('Usuwa określoną liczbę wiadomości z kanału')
        .addIntegerOption(option =>
            option.setName('liczba')
                .setDescription('Liczba wiadomości do usunięcia (1-100)')
                .setMinValue(1)
                .setMaxValue(100)
                .setRequired(true))
        .addUserOption(option =>
            option.setName('użytkownik')
                .setDescription('Usuń tylko wiadomości od tego użytkownika')
                .setRequired(false))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageMessages),
    
    cooldown: 3,
    
    async execute(interaction) {
        const amount = interaction.options.getInteger('liczba');
        const targetUser = interaction.options.getUser('użytkownik');

        await interaction.deferReply({ ephemeral: true });

        try {
            // Pobierz wiadomości
            let messages = await interaction.channel.messages.fetch({ limit: amount });

            // Jeśli określono użytkownika, filtruj wiadomości
            if (targetUser) {
                messages = messages.filter(msg => msg.author.id === targetUser.id);
                
                if (messages.size === 0) {
                    return interaction.editReply({
                        content: `❌ Nie znaleziono wiadomości od ${targetUser.tag} w ostatnich ${amount} wiadomościach!`
                    });
                }
            }

            // Discord nie pozwala na usuwanie wiadomości starszych niż 14 dni
            const twoWeeksAgo = Date.now() - (14 * 24 * 60 * 60 * 1000);
            const recentMessages = messages.filter(msg => msg.createdTimestamp > twoWeeksAgo);
            const oldMessages = messages.size - recentMessages.size;

            if (recentMessages.size === 0) {
                return interaction.editReply({
                    content: '❌ Wszystkie wiadomości są starsze niż 14 dni i nie mogą być usunięte!'
                });
            }

            // Usuń wiadomości
            const deletedMessages = await interaction.channel.bulkDelete(recentMessages, true);

            // Embed z potwierdzeniem
            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Wiadomości zostały usunięte')
                .addFields(
                    { name: 'Usunięto', value: `${deletedMessages.size} wiadomości`, inline: true },
                    { name: 'Moderator', value: interaction.user.tag, inline: true },
                    { name: 'Kanał', value: interaction.channel.name, inline: true }
                );

            if (targetUser) {
                embed.addFields({ name: 'Użytkownik', value: targetUser.tag, inline: true });
            }

            if (oldMessages > 0) {
                embed.addFields({
                    name: '⚠️ Uwaga',
                    value: `${oldMessages} wiadomości było starszych niż 14 dni i nie zostało usuniętych`,
                    inline: false
                });
            }

            embed.setTimestamp();

            await interaction.editReply({ embeds: [embed] });

            console.log(`${interaction.user.tag} usunął ${deletedMessages.size} wiadomości z kanału ${interaction.channel.name}`);

            // Automatyczne usunięcie potwierdzenia po 10 sekundach
            setTimeout(async () => {
                try {
                    await interaction.deleteReply();
                } catch (error) {
                    console.log('Nie można usunąć wiadomości potwierdzającej');
                }
            }, 10000);

        } catch (error) {
            console.error('Błąd podczas usuwania wiadomości:', error);
            await interaction.editReply({
                content: '❌ Wystąpił błąd podczas usuwania wiadomości!'
            });
        }
    },
};
