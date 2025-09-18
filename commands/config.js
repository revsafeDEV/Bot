const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder, ModalBuilder, TextInputBuilder, TextInputStyle } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Zarządzanie konfiguracją bota')
        .addSubcommand(subcommand =>
            subcommand
                .setName('menu')
                .setDescription('Wyświetla interaktywne menu konfiguracji'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('show')
                .setDescription('Wyświetla aktualną konfigurację'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('set')
                .setDescription('Ustawia wartość konfiguracji')
                .addStringOption(option =>
                    option.setName('klucz')
                        .setDescription('Klucz konfiguracji')
                        .setRequired(true)
                        .addChoices(
                            { name: 'Rola Support', value: 'support_role' },
                            { name: 'Rola Moderator', value: 'moderator_role' },
                            { name: 'Rola Admin', value: 'admin_role' },
                            { name: 'Kategoria Ticketów', value: 'ticket_category' },
                            { name: 'Kanał Logów', value: 'log_channel' },
                            { name: 'Kanał Powitalny', value: 'welcome_channel' },
                            { name: 'Prefix Bota', value: 'prefix' }
                        ))
                .addStringOption(option =>
                    option.setName('wartość')
                        .setDescription('Nowa wartość (ID dla ról/kanałów)')
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('reset')
                .setDescription('Resetuje konfigurację do domyślnych wartości'))
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
    
    cooldown: 5,
    
    configPath: path.join(__dirname, '..', 'data', 'config.json'),
    
    execute: async function(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'menu':
                await this.handleMenu(interaction);
                break;
            case 'show':
                await this.handleShow(interaction);
                break;
            case 'set':
                await this.handleSet(interaction);
                break;
            case 'reset':
                await this.handleReset(interaction);
                break;
        }
    },

    ensureConfigFile: function() {
        if (!fs.existsSync(this.configPath)) {
            const defaultConfig = {
                support_role: null,
                moderator_role: null,
                admin_role: null,
                ticket_category: null,
                log_channel: null,
                welcome_channel: null,
                prefix: '!',
                embed_color: '#5865F2',
                created_at: new Date().toISOString()
            };
            fs.writeFileSync(this.configPath, JSON.stringify(defaultConfig, null, 2));
        }
    },

    handleMenu: async function(interaction) {
        try {
            const config = this.getConfig();
            const guild = interaction.guild;

            // Główny embed z menu
            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('⚙️ Panel Konfiguracji Bota')
                .setDescription(`Witaj w panelu konfiguracji dla **${guild.name}**!\n\nWybierz jedną z poniższych opcji:`)
                .addFields(
                    {
                        name: '📋 Dostępne opcje',
                        value: [
                            '• **Pokaż konfigurację** - Wyświetla aktualne ustawienia',
                            '• **Konfiguruj role** - Ustaw role Support, Moderator, Admin',
                            '• **Konfiguruj kanały** - Ustaw kanały ticketów, logów, powitalny',
                            '• **Resetuj ustawienia** - Przywróć domyślną konfigurację'
                        ].join('\n'),
                        inline: false
                    }
                )
                .setFooter({ text: 'Wybierz opcję używając przycisków poniżej' })
                .setTimestamp();

            // Przyciski głównego menu
            const row1 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('config_show')
                        .setLabel('📋 Pokaż konfigurację')
                        .setStyle(ButtonStyle.Primary),
                    new ButtonBuilder()
                        .setCustomId('config_roles')
                        .setLabel('👥 Konfiguruj role')
                        .setStyle(ButtonStyle.Secondary)
                );

            const row2 = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('config_channels')
                        .setLabel('📝 Konfiguruj kanały')
                        .setStyle(ButtonStyle.Secondary),
                    new ButtonBuilder()
                        .setCustomId('config_reset')
                        .setLabel('🔄 Resetuj ustawienia')
                        .setStyle(ButtonStyle.Danger)
                );

            await interaction.reply({ 
                embeds: [embed], 
                components: [row1, row2],
                ephemeral: false
            });

            // Nasłuchiwanie na interakcje z przyciskami
            const collector = interaction.channel.createMessageComponentCollector({
                time: 300000 // 5 minut
            });

            collector.on('collect', async (buttonInteraction) => {
                if (buttonInteraction.user.id !== interaction.user.id) {
                    return buttonInteraction.reply({
                        content: '❌ Tylko osoba, która użyła komendy może używać tego menu!',
                        ephemeral: true
                    });
                }

                await buttonInteraction.deferUpdate();

                switch (buttonInteraction.customId) {
                    case 'config_show':
                        await this.handleShowFromMenu(buttonInteraction, interaction);
                        break;
                    case 'config_roles':
                        await this.handleRolesMenu(buttonInteraction, interaction);
                        break;
                    case 'config_channels':
                        await this.handleChannelsMenu(buttonInteraction, interaction);
                        break;
                    case 'config_reset':
                        await this.handleResetFromMenu(buttonInteraction, interaction);
                        break;
                }
            });

            collector.on('end', () => {
                // Wyłącz przyciski po upływie czasu
                const disabledRow1 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('config_show')
                            .setLabel('📋 Pokaż konfigurację')
                            .setStyle(ButtonStyle.Primary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('config_roles')
                            .setLabel('👥 Konfiguruj role')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true)
                    );

                const disabledRow2 = new ActionRowBuilder()
                    .addComponents(
                        new ButtonBuilder()
                            .setCustomId('config_channels')
                            .setLabel('📝 Konfiguruj kanały')
                            .setStyle(ButtonStyle.Secondary)
                            .setDisabled(true),
                        new ButtonBuilder()
                            .setCustomId('config_reset')
                            .setLabel('🔄 Resetuj ustawienia')
                            .setStyle(ButtonStyle.Danger)
                            .setDisabled(true)
                    );

                interaction.editReply({ components: [disabledRow1, disabledRow2] }).catch(() => {});
            });

        } catch (error) {
            console.error('Błąd podczas wyświetlania menu konfiguracji:', error);
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas wyświetlania menu konfiguracji!',
                ephemeral: true
            });
        }
    },

    getConfig: function() {
        this.ensureConfigFile();
        const data = fs.readFileSync(this.configPath, 'utf8');
        return JSON.parse(data);
    },

    saveConfig: function(config) {
        fs.writeFileSync(this.configPath, JSON.stringify(config, null, 2));
    },

    handleShow: async function(interaction) {
        try {
            const config = this.getConfig();
            const guild = interaction.guild;

            // Pobierz nazwy ról i kanałów
            const supportRole = config.support_role ? guild.roles.cache.get(config.support_role) : null;
            const modRole = config.moderator_role ? guild.roles.cache.get(config.moderator_role) : null;
            const adminRole = config.admin_role ? guild.roles.cache.get(config.admin_role) : null;
            const ticketCategory = config.ticket_category ? guild.channels.cache.get(config.ticket_category) : null;
            const logChannel = config.log_channel ? guild.channels.cache.get(config.log_channel) : null;
            const welcomeChannel = config.welcome_channel ? guild.channels.cache.get(config.welcome_channel) : null;

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('⚙️ Konfiguracja Bota')
                .setDescription(`Aktualna konfiguracja dla **${guild.name}**`)
                .addFields(
                    {
                        name: '👥 Role',
                        value: [
                            `**Support:** ${supportRole ? `<@&${supportRole.id}>` : 'Nie ustawiono'}`,
                            `**Moderator:** ${modRole ? `<@&${modRole.id}>` : 'Nie ustawiono'}`,
                            `**Admin:** ${adminRole ? `<@&${adminRole.id}>` : 'Nie ustawiono'}`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '📝 Kanały',
                        value: [
                            `**Kategoria ticketów:** ${ticketCategory ? `<#${ticketCategory.id}>` : 'Nie ustawiono'}`,
                            `**Kanał logów:** ${logChannel ? `<#${logChannel.id}>` : 'Nie ustawiono'}`,
                            `**Kanał powitalny:** ${welcomeChannel ? `<#${welcomeChannel.id}>` : 'Nie ustawiono'}`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '🔧 Inne ustawienia',
                        value: [
                            `**Prefix:** ${config.prefix}`,
                            `**Kolor embeda:** ${config.embed_color}`
                        ].join('\n'),
                        inline: false
                    }
                )
                .setFooter({ text: `Ostatnia aktualizacja: ${new Date().toLocaleDateString()}` })
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Błąd podczas wyświetlania konfiguracji:', error);
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas wyświetlania konfiguracji!',
                ephemeral: true
            });
        }
    },

    handleSet: async function(interaction) {
        const key = interaction.options.getString('klucz');
        const value = interaction.options.getString('wartość');

        try {
            const config = this.getConfig();
            const guild = interaction.guild;

            // Walidacja wartości w zależności od klucza
            if (key.includes('role')) {
                const role = guild.roles.cache.get(value) || guild.roles.cache.find(r => r.name === value);
                if (!role) {
                    return interaction.reply({
                        content: '❌ Nie znaleziono roli! Podaj poprawne ID roli lub nazwę.',
                        ephemeral: true
                    });
                }
                config[key] = role.id;
            } else if (key.includes('channel') || key === 'ticket_category') {
                const channel = guild.channels.cache.get(value) || guild.channels.cache.find(c => c.name === value);
                if (!channel) {
                    return interaction.reply({
                        content: '❌ Nie znaleziono kanału! Podaj poprawne ID kanału lub nazwę.',
                        ephemeral: true
                    });
                }
                config[key] = channel.id;
            } else {
                config[key] = value;
            }

            config.updated_at = new Date().toISOString();
            this.saveConfig(config);

            // Aktualizuj zmienne środowiskowe w runtime (jeśli potrzebne)
            this.updateEnvironmentVariables(config);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Konfiguracja zaktualizowana')
                .setDescription(`**${this.getKeyDisplayName(key)}** została ustawiona na: ${this.formatValue(key, value, guild)}`)
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Błąd podczas aktualizacji konfiguracji:', error);
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas aktualizacji konfiguracji!',
                ephemeral: true
            });
        }
    },

    handleReset: async function(interaction) {
        try {
            const defaultConfig = {
                support_role: null,
                moderator_role: null,
                admin_role: null,
                ticket_category: null,
                log_channel: null,
                welcome_channel: null,
                prefix: '!',
                embed_color: '#5865F2',
                reset_at: new Date().toISOString()
            };

            this.saveConfig(defaultConfig);

            const embed = new EmbedBuilder()
                .setColor('#FF9900')
                .setTitle('🔄 Konfiguracja zresetowana')
                .setDescription('Wszystkie ustawienia zostały przywrócone do wartości domyślnych.')
                .setTimestamp();

            await interaction.reply({ embeds: [embed] });

        } catch (error) {
            console.error('Błąd podczas resetowania konfiguracji:', error);
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas resetowania konfiguracji!',
                ephemeral: true
            });
        }
    },

    updateEnvironmentVariables: function(config) {
        // Aktualizuj zmienne środowiskowe na podstawie konfiguracji
        if (config.support_role) process.env.SUPPORT_ROLE_ID = config.support_role;
        if (config.moderator_role) process.env.MODERATOR_ROLE_ID = config.moderator_role;
        if (config.admin_role) process.env.ADMIN_ROLE_ID = config.admin_role;
        if (config.ticket_category) process.env.TICKET_CATEGORY_ID = config.ticket_category;
        if (config.log_channel) process.env.TICKET_LOG_CHANNEL_ID = config.log_channel;
        if (config.prefix) process.env.PREFIX = config.prefix;
        if (config.embed_color) process.env.EMBED_COLOR = config.embed_color;
    },

    getKeyDisplayName: function(key) {
        const displayNames = {
            support_role: 'Rola Support',
            moderator_role: 'Rola Moderator',
            admin_role: 'Rola Admin',
            ticket_category: 'Kategoria Ticketów',
            log_channel: 'Kanał Logów',
            welcome_channel: 'Kanał Powitalny',
            prefix: 'Prefix Bota'
        };
        return displayNames[key] || key;
    },

    handleShowFromMenu: async function(buttonInteraction, originalInteraction) {
        try {
            const config = this.getConfig();
            const guild = originalInteraction.guild;

            const supportRole = config.support_role ? guild.roles.cache.get(config.support_role) : null;
            const modRole = config.moderator_role ? guild.roles.cache.get(config.moderator_role) : null;
            const adminRole = config.admin_role ? guild.roles.cache.get(config.admin_role) : null;
            const ticketCategory = config.ticket_category ? guild.channels.cache.get(config.ticket_category) : null;
            const logChannel = config.log_channel ? guild.channels.cache.get(config.log_channel) : null;
            const welcomeChannel = config.welcome_channel ? guild.channels.cache.get(config.welcome_channel) : null;

            const embed = new EmbedBuilder()
                .setColor('#5865F2')
                .setTitle('⚙️ Aktualna Konfiguracja')
                .setDescription(`Konfiguracja dla **${guild.name}**`)
                .addFields(
                    {
                        name: '👥 Role',
                        value: [
                            `**Support:** ${supportRole ? `<@&${supportRole.id}>` : 'Nie ustawiono'}`,
                            `**Moderator:** ${modRole ? `<@&${modRole.id}>` : 'Nie ustawiono'}`,
                            `**Admin:** ${adminRole ? `<@&${adminRole.id}>` : 'Nie ustawiono'}`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '📝 Kanały',
                        value: [
                            `**Kategoria ticketów:** ${ticketCategory ? `<#${ticketCategory.id}>` : 'Nie ustawiono'}`,
                            `**Kanał logów:** ${logChannel ? `<#${logChannel.id}>` : 'Nie ustawiono'}`,
                            `**Kanał powitalny:** ${welcomeChannel ? `<#${welcomeChannel.id}>` : 'Nie ustawiono'}`
                        ].join('\n'),
                        inline: false
                    },
                    {
                        name: '🔧 Inne ustawienia',
                        value: [
                            `**Prefix:** ${config.prefix}`,
                            `**Kolor embeda:** ${config.embed_color}`
                        ].join('\n'),
                        inline: false
                    }
                )
                .setTimestamp();

            const backButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('back_to_main')
                        .setLabel('◀️ Powrót do menu głównego')
                        .setStyle(ButtonStyle.Secondary)
                );

            await originalInteraction.editReply({ 
                embeds: [embed], 
                components: [backButton]
            });

        } catch (error) {
            console.error('Błąd podczas wyświetlania konfiguracji:', error);
        }
    },

    handleRolesMenu: async function(buttonInteraction, originalInteraction) {
        const embed = new EmbedBuilder()
            .setColor('#FF9900')
            .setTitle('👥 Konfiguracja Ról')
            .setDescription('Wybierz rolę, którą chcesz skonfigurować:')
            .addFields({
                name: 'ℹ️ Instrukcja',
                value: 'Wybierz rolę z menu poniżej, a następnie podaj ID lub nazwę roli.',
                inline: false
            })
            .setTimestamp();

        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('role_select')
                    .setPlaceholder('Wybierz rolę do konfiguracji...')
                    .addOptions([
                        {
                            label: 'Rola Support',
                            value: 'support_role',
                            description: 'Rola dla zespołu wsparcia',
                            emoji: '🛠️'
                        },
                        {
                            label: 'Rola Moderator',
                            value: 'moderator_role', 
                            description: 'Rola dla moderatorów',
                            emoji: '⚖️'
                        },
                        {
                            label: 'Rola Admin',
                            value: 'admin_role',
                            description: 'Rola dla administratorów',
                            emoji: '👑'
                        }
                    ])
            );

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('back_to_main')
                    .setLabel('◀️ Powrót do menu głównego')
                    .setStyle(ButtonStyle.Secondary)
            );

        await originalInteraction.editReply({ 
            embeds: [embed], 
            components: [selectMenu, backButton]
        });
    },

    handleChannelsMenu: async function(buttonInteraction, originalInteraction) {
        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('📝 Konfiguracja Kanałów')
            .setDescription('Wybierz kanał, który chcesz skonfigurować:')
            .addFields({
                name: 'ℹ️ Instrukcja',
                value: 'Wybierz kanał z menu poniżej, a następnie podaj ID lub nazwę kanału.',
                inline: false
            })
            .setTimestamp();

        const selectMenu = new ActionRowBuilder()
            .addComponents(
                new StringSelectMenuBuilder()
                    .setCustomId('channel_select')
                    .setPlaceholder('Wybierz kanał do konfiguracji...')
                    .addOptions([
                        {
                            label: 'Kategoria Ticketów',
                            value: 'ticket_category',
                            description: 'Kategoria dla kanałów ticketów',
                            emoji: '🎫'
                        },
                        {
                            label: 'Kanał Logów',
                            value: 'log_channel',
                            description: 'Kanał dla logów moderacji',
                            emoji: '📜'
                        },
                        {
                            label: 'Kanał Powitalny',
                            value: 'welcome_channel',
                            description: 'Kanał powitalny dla nowych użytkowników',
                            emoji: '👋'
                        }
                    ])
            );

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('back_to_main')
                    .setLabel('◀️ Powrót do menu głównego')
                    .setStyle(ButtonStyle.Secondary)
            );

        await originalInteraction.editReply({ 
            embeds: [embed], 
            components: [selectMenu, backButton]
        });
    },

    handleResetFromMenu: async function(buttonInteraction, originalInteraction) {
        const embed = new EmbedBuilder()
            .setColor('#FF0000')
            .setTitle('🔄 Resetowanie Konfiguracji')
            .setDescription('⚠️ **UWAGA!** ⚠️\n\nCzy na pewno chcesz zresetować całą konfigurację?\n\n**Ta akcja:**\n• Usunie wszystkie ustawione role\n• Usunie wszystkie ustawione kanały\n• Przywróci domyślne wartości\n\n**Tej akcji nie można cofnąć!**')
            .setTimestamp();

        const confirmRow = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('confirm_reset')
                    .setLabel('✅ Tak, resetuj')
                    .setStyle(ButtonStyle.Danger),
                new ButtonBuilder()
                    .setCustomId('cancel_reset')
                    .setLabel('❌ Nie, anuluj')
                    .setStyle(ButtonStyle.Secondary)
            );

        const backButton = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('back_to_main')
                    .setLabel('◀️ Powrót do menu głównego')
                    .setStyle(ButtonStyle.Secondary)
            );

        await originalInteraction.editReply({ 
            embeds: [embed], 
            components: [confirmRow, backButton]
        });
    },

    formatValue: function(key, value, guild) {
        if (key.includes('role')) {
            const role = guild.roles.cache.get(value);
            return role ? `<@&${role.id}>` : value;
        } else if (key.includes('channel') || key === 'ticket_category') {
            const channel = guild.channels.cache.get(value);
            return channel ? `<#${channel.id}>` : value;
        }
        return value;
    },

    handleButtonInteraction: async function(interaction) {
        const buttonId = interaction.customId;
        
        // Znajdź oryginalna interakcję
        const originalInteraction = {
            guild: interaction.guild,
            editReply: interaction.update.bind(interaction)
        };

        try {
            switch (buttonId) {
                case 'config_show':
                    await this.handleShowFromMenu(interaction, originalInteraction);
                    break;
                case 'config_roles':
                    await this.handleRolesMenu(interaction, originalInteraction);
                    break;
                case 'config_channels':
                    await this.handleChannelsMenu(interaction, originalInteraction);
                    break;
                case 'config_reset':
                    await this.handleResetFromMenu(interaction, originalInteraction);
                    break;
                case 'back_to_main':
                    await this.showMainMenu(interaction);
                    break;
                case 'confirm_reset':
                    await this.confirmReset(interaction);
                    break;
                case 'cancel_reset':
                    await this.showMainMenu(interaction);
                    break;
            }
        } catch (error) {
            console.error('Błąd podczas obsługi interakcji przycisku:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Wystąpił błąd podczas przetwarzania Twojego żądania!',
                    ephemeral: true
                });
            }
        }
    },

    handleSelectMenuInteraction: async function(interaction) {
        const selectedValue = interaction.values[0];
        const menuId = interaction.customId;

        try {
            if (menuId === 'role_select' || menuId === 'channel_select') {
                // Wyświetl modal do wprowadzenia wartości
                await this.showConfigModal(interaction, selectedValue);
            }
        } catch (error) {
            console.error('Błąd podczas obsługi select menu:', error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({
                    content: '❌ Wystąpił błąd podczas przetwarzania Twojego żądania!',
                    ephemeral: true
                });
            }
        }
    },

    showMainMenu: async function(interaction) {
        const guild = interaction.guild;
        
        const embed = new EmbedBuilder()
            .setColor('#5865F2')
            .setTitle('⚙️ Panel Konfiguracji Bota')
            .setDescription(`Witaj w panelu konfiguracji dla **${guild.name}**!\n\nWybierz jedną z poniższych opcji:`)
            .addFields(
                {
                    name: '📋 Dostępne opcje',
                    value: [
                        '• **Pokaż konfigurację** - Wyświetla aktualne ustawienia',
                        '• **Konfiguruj role** - Ustaw role Support, Moderator, Admin',
                        '• **Konfiguruj kanały** - Ustaw kanały ticketów, logów, powitalny',
                        '• **Resetuj ustawienia** - Przywróć domyślną konfigurację'
                    ].join('\n'),
                    inline: false
                }
            )
            .setFooter({ text: 'Wybierz opcję używając przycisków poniżej' })
            .setTimestamp();

        const row1 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_show')
                    .setLabel('📋 Pokaż konfigurację')
                    .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                    .setCustomId('config_roles')
                    .setLabel('👥 Konfiguruj role')
                    .setStyle(ButtonStyle.Secondary)
            );

        const row2 = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('config_channels')
                    .setLabel('📝 Konfiguruj kanały')
                    .setStyle(ButtonStyle.Secondary),
                new ButtonBuilder()
                    .setCustomId('config_reset')
                    .setLabel('🔄 Resetuj ustawienia')
                    .setStyle(ButtonStyle.Danger)
            );

        await interaction.update({ 
            embeds: [embed], 
            components: [row1, row2]
        });
    },

    confirmReset: async function(interaction) {
        try {
            const defaultConfig = {
                support_role: null,
                moderator_role: null,
                admin_role: null,
                ticket_category: null,
                log_channel: null,
                welcome_channel: null,
                prefix: '!',
                embed_color: '#5865F2',
                reset_at: new Date().toISOString()
            };

            this.saveConfig(defaultConfig);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Konfiguracja zresetowana')
                .setDescription('Wszystkie ustawienia zostały pomyślnie zresetowane do wartości domyślnych!')
                .setTimestamp();

            const backButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('back_to_main')
                        .setLabel('◀️ Powrót do menu głównego')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.update({ 
                embeds: [embed], 
                components: [backButton]
            });

        } catch (error) {
            console.error('Błąd podczas resetowania konfiguracji:', error);
            await interaction.update({
                content: '❌ Wystąpił błąd podczas resetowania konfiguracji!',
                embeds: [],
                components: []
            });
        }
    },

    showConfigModal: async function(interaction, configKey) {
        
        const displayNames = {
            support_role: 'Rola Support',
            moderator_role: 'Rola Moderator',
            admin_role: 'Rola Admin',
            ticket_category: 'Kategoria Ticketów',
            log_channel: 'Kanał Logów',
            welcome_channel: 'Kanał Powitalny'
        };

        const placeholders = {
            support_role: 'ID roli lub nazwa roli',
            moderator_role: 'ID roli lub nazwa roli',
            admin_role: 'ID roli lub nazwa roli',
            ticket_category: 'ID kategorii lub nazwa kategorii',
            log_channel: 'ID kanału lub nazwa kanału',
            welcome_channel: 'ID kanału lub nazwa kanału'
        };

        const modal = new ModalBuilder()
            .setCustomId(`config_modal_${configKey}`)
            .setTitle(`Konfiguracja: ${displayNames[configKey]}`);

        const valueInput = new TextInputBuilder()
            .setCustomId('config_value')
            .setLabel(`Wartość dla ${displayNames[configKey]}`)
            .setStyle(TextInputStyle.Short)
            .setPlaceholder(placeholders[configKey])
            .setRequired(true)
            .setMaxLength(100);

        const actionRow = new ActionRowBuilder().addComponents(valueInput);
        modal.addComponents(actionRow);

        await interaction.showModal(modal);
    },

    handleModalSubmit: async function(interaction) {
        const configKey = interaction.customId.replace('config_modal_', '');
        const value = interaction.fields.getTextInputValue('config_value');
        
        try {
            const config = this.getConfig();
            const guild = interaction.guild;

            // Walidacja wartości w zależności od klucza
            if (configKey.includes('role')) {
                const role = guild.roles.cache.get(value) || guild.roles.cache.find(r => r.name === value);
                if (!role) {
                    return interaction.reply({
                        content: '❌ Nie znaleziono roli! Podaj poprawne ID roli lub nazwę.',
                        ephemeral: true
                    });
                }
                config[configKey] = role.id;
            } else if (configKey.includes('channel') || configKey === 'ticket_category') {
                const channel = guild.channels.cache.get(value) || guild.channels.cache.find(c => c.name === value);
                if (!channel) {
                    return interaction.reply({
                        content: '❌ Nie znaleziono kanału! Podaj poprawne ID kanału lub nazwę.',
                        ephemeral: true
                    });
                }
                config[configKey] = channel.id;
            } else {
                config[configKey] = value;
            }

            config.updated_at = new Date().toISOString();
            this.saveConfig(config);

            // Aktualizuj zmienne środowiskowe
            this.updateEnvironmentVariables(config);

            const embed = new EmbedBuilder()
                .setColor('#00FF00')
                .setTitle('✅ Konfiguracja zaktualizowana')
                .setDescription(`**${this.getKeyDisplayName(configKey)}** została ustawiona na: ${this.formatValue(configKey, config[configKey], guild)}`)
                .setTimestamp();

            const backButton = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('back_to_main')
                        .setLabel('◀️ Powrót do menu głównego')
                        .setStyle(ButtonStyle.Secondary)
                );

            await interaction.reply({ 
                embeds: [embed], 
                components: [backButton],
                ephemeral: false
            });

        } catch (error) {
            console.error('Błąd podczas aktualizacji konfiguracji:', error);
            await interaction.reply({
                content: '❌ Wystąpił błąd podczas aktualizacji konfiguracji!',
                ephemeral: true
            });
        }
    }
};
