const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, PermissionFlagsBits, ChannelType, StringSelectMenuBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

class TicketHandler {
    constructor() {
        this.ticketsPath = path.join(__dirname, '..', 'data', 'tickets.json');
        this.ensureTicketsFile();
    }

    ensureTicketsFile() {
        if (!fs.existsSync(this.ticketsPath)) {
            fs.writeFileSync(this.ticketsPath, JSON.stringify({ tickets: {}, config: {} }, null, 2));
        }
    }

    getTicketsData() {
        const data = fs.readFileSync(this.ticketsPath, 'utf8');
        return JSON.parse(data);
    }

    saveTicketsData(data) {
        fs.writeFileSync(this.ticketsPath, JSON.stringify(data, null, 2));
    }

    async createTicket(interaction) {
        const data = this.getTicketsData();
        const userId = interaction.user.id;
        const guildId = interaction.guild.id;

        // Sprawdź czy użytkownik nie ma już otwartego ticketu
        const userTickets = Object.values(data.tickets).filter(ticket => 
            ticket.userId === userId && ticket.guildId === guildId && ticket.status === 'open'
        );

        if (userTickets.length > 0) {
            return interaction.reply({
                content: '❌ Masz już otwarty ticket! Zamknij go przed utworzeniem nowego.',
                ephemeral: true
            });
        }

        await interaction.deferReply({ ephemeral: true });

        try {
            // Pobierz kategorię ticketów z konfiguracji
            const ticketCategory = process.env.TICKET_CATEGORY_ID;
            const supportRoleId = process.env.SUPPORT_ROLE_ID;

            // Utworz kanał ticketu
            const ticketChannel = await interaction.guild.channels.create({
                name: `ticket-${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: ticketCategory || null,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id, // @everyone
                        deny: [PermissionFlagsBits.ViewChannel],
                    },
                    {
                        id: interaction.user.id, // Użytkownik
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory,
                            PermissionFlagsBits.AttachFiles
                        ],
                    },
                    {
                        id: interaction.client.user.id, // Bot
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ManageChannels,
                            PermissionFlagsBits.ManageMessages
                        ],
                    }
                ]
            });

            // Dodaj role support do uprawnień kanału
            if (supportRoleId) {
                await ticketChannel.permissionOverwrites.create(supportRoleId, {
                    ViewChannel: true,
                    SendMessages: true,
                    ReadMessageHistory: true,
                    ManageMessages: true
                });
            }

            // Zapisz ticket do bazy danych
            const ticketId = `ticket_${Date.now()}_${userId}`;
            data.tickets[ticketId] = {
                id: ticketId,
                channelId: ticketChannel.id,
                userId: userId,
                guildId: guildId,
                status: 'open',
                createdAt: new Date().toISOString(),
                category: 'general'
            };
            this.saveTicketsData(data);

            // Embed powitania w tickecie
            const welcomeEmbed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('🎫 Nowy Ticket')
                .setDescription(`Witaj ${interaction.user}! Dziękujemy za kontakt z naszym zespołem wsparcia.`)
                .addFields(
                    { name: '📋 Instrukcje', value: 'Opisz swój problem jak najdokładniej. Nasz zespół wkrótce się z Tobą skontaktuje.' },
                    { name: '⏰ Utworzony', value: `<t:${Math.floor(Date.now() / 1000)}:R>` }
                )
                .setTimestamp();

            // Przyciski zarządzania ticketem
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_ticket')
                        .setLabel('Zamknij Ticket')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🔒')
                );

            await ticketChannel.send({
                content: supportRoleId ? `<@&${supportRoleId}> - Nowy ticket od ${interaction.user}` : `Nowy ticket od ${interaction.user}`,
                embeds: [welcomeEmbed],
                components: [row]
            });

            // Powiadomienie użytkownika
            await interaction.editReply({
                content: `✅ Twój ticket został utworzony! ${ticketChannel}`
            });

            // Log do kanału logów
            this.logTicketAction('create', interaction.user, ticketChannel, 'Ticket został utworzony');

        } catch (error) {
            console.error('Błąd podczas tworzenia ticketu:', error);
            await interaction.editReply({
                content: '❌ Wystąpił błąd podczas tworzenia ticketu!'
            });
        }
    }

    async closeTicket(interaction) {
        const data = this.getTicketsData();
        
        // Znajdź ticket na podstawie kanału
        const ticket = Object.values(data.tickets).find(t => 
            t.channelId === interaction.channel.id && t.status === 'open'
        );

        if (!ticket) {
            return interaction.reply({
                content: '❌ To nie jest kanał ticketu lub ticket jest już zamknięty!',
                ephemeral: true
            });
        }

        // Sprawdź uprawnienia
        const member = interaction.member;
        const isTicketOwner = ticket.userId === interaction.user.id;
        const hasManageChannels = member.permissions.has(PermissionFlagsBits.ManageChannels);
        const supportRoleId = process.env.SUPPORT_ROLE_ID;
        const hasSupportRole = supportRoleId ? member.roles.cache.has(supportRoleId) : false;

        if (!isTicketOwner && !hasManageChannels && !hasSupportRole) {
            return interaction.reply({
                content: '❌ Nie masz uprawnień do zamknięcia tego ticketu!',
                ephemeral: true
            });
        }

        await interaction.deferReply();

        try {
            // Zaktualizuj status ticketu
            data.tickets[ticket.id].status = 'closed';
            data.tickets[ticket.id].closedAt = new Date().toISOString();
            data.tickets[ticket.id].closedBy = interaction.user.id;
            this.saveTicketsData(data);

            // Embed zamknięcia
            const closeEmbed = new EmbedBuilder()
                .setColor('#FF0000')
                .setTitle('🔒 Ticket Zamknięty')
                .setDescription('Ten ticket został zamknięty.')
                .addFields(
                    { name: 'Zamknięty przez', value: `${interaction.user}`, inline: true },
                    { name: 'Zamknięty o', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
                )
                .setTimestamp();

            // Przycisk usunięcia kanału
            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('delete_ticket')
                        .setLabel('Usuń Kanał')
                        .setStyle(ButtonStyle.Danger)
                        .setEmoji('🗑️')
                );

            await interaction.editReply({
                embeds: [closeEmbed],
                components: [row]
            });

            // Usuń uprawnienia użytkownika
            const ticketOwner = await interaction.guild.members.fetch(ticket.userId).catch(() => null);
            if (ticketOwner) {
                await interaction.channel.permissionOverwrites.edit(ticketOwner, {
                    SendMessages: false,
                    AddReactions: false
                });
            }

            // Log akcji
            this.logTicketAction('close', interaction.user, interaction.channel, `Ticket zamknięty przez ${interaction.user.tag}`);

        } catch (error) {
            console.error('Błąd podczas zamykania ticketu:', error);
            await interaction.editReply({
                content: '❌ Wystąpił błąd podczas zamykania ticketu!'
            });
        }
    }

    async deleteTicket(interaction) {
        const data = this.getTicketsData();
        
        // Znajdź ticket
        const ticket = Object.values(data.tickets).find(t => t.channelId === interaction.channel.id);

        if (!ticket) {
            return interaction.reply({
                content: '❌ To nie jest kanał ticketu!',
                ephemeral: true
            });
        }

        // Sprawdź uprawnienia
        const member = interaction.member;
        const hasManageChannels = member.permissions.has(PermissionFlagsBits.ManageChannels);
        const supportRoleId = process.env.SUPPORT_ROLE_ID;
        const hasSupportRole = supportRoleId ? member.roles.cache.has(supportRoleId) : false;

        if (!hasManageChannels && !hasSupportRole) {
            return interaction.reply({
                content: '❌ Nie masz uprawnień do usunięcia tego ticketu!',
                ephemeral: true
            });
        }

        await interaction.reply({
            content: '🗑️ Usuwam kanał ticketu za 5 sekund...',
            ephemeral: true
        });

        // Log akcji przed usunięciem
        this.logTicketAction('delete', interaction.user, interaction.channel, `Kanał ticketu usunięty przez ${interaction.user.tag}`);

        // Zaktualizuj status w bazie danych
        data.tickets[ticket.id].status = 'deleted';
        data.tickets[ticket.id].deletedAt = new Date().toISOString();
        data.tickets[ticket.id].deletedBy = interaction.user.id;
        this.saveTicketsData(data);

        // Usuń kanał po 5 sekundach
        setTimeout(async () => {
            try {
                await interaction.channel.delete();
            } catch (error) {
                console.error('Błąd podczas usuwania kanału ticketu:', error);
            }
        }, 5000);
    }

    async handleCategorySelect(interaction) {
        const selectedCategory = interaction.values[0];
        
        // Tu możesz dodać logikę różnych kategorii ticketów
        // Na razie po prostu tworzymy standardowy ticket
        
        await this.createTicket(interaction);
    }

    async logTicketAction(action, user, channel, description) {
        const logChannelId = process.env.TICKET_LOG_CHANNEL_ID;
        if (!logChannelId) return;

        try {
            const logChannel = await channel.guild.channels.fetch(logChannelId);
            if (!logChannel) return;

            const embed = new EmbedBuilder()
                .setColor(action === 'create' ? '#00FF00' : action === 'close' ? '#FF9900' : '#FF0000')
                .setTitle(`📋 Ticket ${action.charAt(0).toUpperCase() + action.slice(1)}`)
                .addFields(
                    { name: 'Kanał', value: `${channel}`, inline: true },
                    { name: 'Użytkownik', value: `${user}`, inline: true },
                    { name: 'Opis', value: description, inline: false }
                )
                .setTimestamp();

            await logChannel.send({ embeds: [embed] });
        } catch (error) {
            console.error('Błąd podczas logowania akcji ticketu:', error);
        }
    }

    // Komenda do tworzenia panelu ticketów
    async createTicketPanel(interaction) {
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('🎫 System Wsparcia')
            .setDescription('Potrzebujesz pomocy? Kliknij przycisk poniżej, aby utworzyć ticket.')
            .addFields(
                { name: '📋 Jak to działa?', value: '1. Kliknij przycisk "Utwórz Ticket"\n2. Zostanie utworzony prywatny kanał\n3. Opisz swój problem\n4. Poczekaj na odpowiedź zespołu' },
                { name: '⚡ Szybka pomoc', value: 'Przed utworzeniem ticketu sprawdź #faq - może znajdziesz tam odpowiedź!' }
            )
            .setFooter({ text: 'Średni czas odpowiedzi: 2-24 godziny' })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('create_ticket')
                    .setLabel('Utwórz Ticket')
                    .setStyle(ButtonStyle.Primary)
                    .setEmoji('🎫')
            );

        return { embeds: [embed], components: [row] };
    }

    // Statystyki ticketów
    async getTicketStats(guildId) {
        const data = this.getTicketsData();
        const guildTickets = Object.values(data.tickets).filter(t => t.guildId === guildId);
        
        return {
            total: guildTickets.length,
            open: guildTickets.filter(t => t.status === 'open').length,
            closed: guildTickets.filter(t => t.status === 'closed').length,
            deleted: guildTickets.filter(t => t.status === 'deleted').length
        };
    }
}

module.exports = new TicketHandler();
