const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const ticketHandler = require('../utils/ticketHandler');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('ticket')
        .setDescription('Zarządzanie systemem ticketów')
        .addSubcommand(subcommand =>
            subcommand
                .setName('panel')
                .setDescription('Tworzy panel do tworzenia ticketów'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('close')
                .setDescription('Zamyka aktualny ticket'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('add')
                .setDescription('Dodaje użytkownika do ticketu')
                .addUserOption(option =>
                    option.setName('użytkownik')
                        .setDescription('Użytkownik do dodania')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('remove')
                .setDescription('Usuwa użytkownika z ticketu')
                .addUserOption(option =>
                    option.setName('użytkownik')
                        .setDescription('Użytkownik do usunięcia')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('stats')
                .setDescription('Wyświetla statystyki ticketów'))
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageChannels),
    
    cooldown: 3,
    
    async execute(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'panel':
                await this.handlePanel(interaction);
                break;
            case 'close':
                await this.handleClose(interaction);
                break;
            case 'add':
                await this.handleAdd(interaction);
                break;
            case 'remove':
                await this.handleRemove(interaction);
                break;
            case 'stats':
                await this.handleStats(interaction);
                break;
        }
    },

    async handlePanel(interaction) {
        try {
            const panelMessage = await ticketHandler.createTicketPanel(interaction);
            
            await interaction.reply({
                content: '✅ Panel ticketów został utworzony!',
                ephemeral: true
            });

            await interaction.followUp(panelMessage);
        } catch (error) {
            console.error('Błąd podczas tworzenia panelu:', error);
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas tworzenia panelu ticketów!',
                ephemeral: true
            });
        }
    },

    async handleClose(interaction) {
        await ticketHandler.closeTicket(interaction);
    },

    async handleAdd(interaction) {
        const user = interaction.options.getUser('użytkownik');
        
        // Sprawdź czy to kanał ticketu
        const data = ticketHandler.getTicketsData();
        const ticket = Object.values(data.tickets).find(t => t.channelId === interaction.channel.id);

        if (!ticket) {
            return interaction.reply({
                content: '❌ Ta komenda może być używana tylko w kanałach ticketów!',
                ephemeral: true
            });
        }

        try {
            await interaction.channel.permissionOverwrites.create(user.id, {
                ViewChannel: true,
                SendMessages: true,
                ReadMessageHistory: true,
                AttachFiles: true
            });

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Użytkownik dodany')
                .setDescription(`${user} został dodany do ticketu przez ${interaction.user}`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Błąd podczas dodawania użytkownika:', error);
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas dodawania użytkownika!',
                ephemeral: true
            });
        }
    },

    async handleRemove(interaction) {
        const user = interaction.options.getUser('użytkownik');
        
        // Sprawdź czy to kanał ticketu
        const data = ticketHandler.getTicketsData();
        const ticket = Object.values(data.tickets).find(t => t.channelId === interaction.channel.id);

        if (!ticket) {
            return interaction.reply({
                content: '❌ Ta komenda może być używana tylko w kanałach ticketów!',
                ephemeral: true
            });
        }

        // Nie pozwalaj usunąć właściciela ticketu
        if (user.id === ticket.userId) {
            return interaction.reply({
                content: '❌ Nie możesz usunąć właściciela ticketu!',
                ephemeral: true
            });
        }

        try {
            await interaction.channel.permissionOverwrites.delete(user.id);

            const embed = new EmbedBuilder()
                .setColor('#FF6B6B')
                .setTitle('❌ Użytkownik usunięty')
                .setDescription(`${user} został usunięty z ticketu przez ${interaction.user}`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Błąd podczas usuwania użytkownika:', error);
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas usuwania użytkownika!',
                ephemeral: true
            });
        }
    },

    async handleStats(interaction) {
        try {
            const stats = await ticketHandler.getTicketStats(interaction.guild.id);

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('📊 Statystyki Ticketów')
                .setDescription(`Statystyki systemu ticketów dla **${interaction.guild.name}**`)
                .addFields(
                    { name: '📈 Wszystkie tickety', value: `${stats.total}`, inline: true },
                    { name: '🟢 Otwarte', value: `${stats.open}`, inline: true },
                    { name: '🔒 Zamknięte', value: `${stats.closed}`, inline: true },
                    { name: '🗑️ Usunięte', value: `${stats.deleted}`, inline: true },
                    { name: '📋 Status', value: stats.open > 0 ? `${stats.open} ticketów oczekuje na odpowiedź` : 'Brak oczekujących ticketów', inline: false }
                )
                .setThumbnail(interaction.guild.iconURL())
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });
        } catch (error) {
            console.error('Błąd podczas pobierania statystyk:', error);
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas pobierania statystyk!',
                ephemeral: true
            });
        }
    }
};
