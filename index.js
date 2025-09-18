const { Client, GatewayIntentBits, Collection, Events, ActivityType } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Import keep alive server for Replit hosting
const keepAlive = require('./keep_alive');

// Start the keep alive server (only for Replit hosting)
if (process.env.REPLIT_DB_URL || process.env.REPL_ID) {
    keepAlive();
}

// Tworzenie klienta Discord
const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
        GatewayIntentBits.GuildModeration,
        GatewayIntentBits.GuildVoiceStates,
        GatewayIntentBits.DirectMessages
    ]
});

// Kolekcje dla komend i cooldownów
client.commands = new Collection();
client.cooldowns = new Collection();

// Ładowanie komend
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
    } else {
        console.log(`[OSTRZEŻENIE] Komenda w ${filePath} nie ma właściwości "data" lub "execute".`);
    }
}

// Ładowanie eventów
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
    const filePath = path.join(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    } else {
        client.on(event.name, (...args) => event.execute(...args));
    }
}

// Event gotowości bota
client.once(Events.ClientReady, () => {
    console.log(`✅ Bot zalogowany jako ${client.user.tag}`);
    console.log(`🔧 Działam na ${client.guilds.cache.size} serwerach`);
    
    // Ustawienie statusu bota
    client.user.setActivity('Community Server', { type: ActivityType.Watching });
});

// Obsługa błędów
process.on('unhandledRejection', error => {
    console.error('Nieobsłużone odrzucenie promise:', error);
});

process.on('uncaughtException', error => {
    console.error('Nieobsłużony wyjątek:', error);
    process.exit(1);
});

// Logowanie bota
client.login(process.env.DISCORD_TOKEN);
