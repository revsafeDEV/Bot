const { SlashCommandBuilder, EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('config')
        .setDescription('Zarządzanie konfiguracją bota')
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

    formatValue: function(key, value, guild) {
        if (key.includes('role')) {
            const role = guild.roles.cache.get(value);
            return role ? `<@&${role.id}>` : value;
        } else if (key.includes('channel') || key === 'ticket_category') {
            const channel = guild.channels.cache.get(value);
            return channel ? `<#${channel.id}>` : value;
        }
        return value;
    }
};
