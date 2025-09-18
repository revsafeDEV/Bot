const { REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const commands = [];

// Ładowanie wszystkich plików komend
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
    const filePath = path.join(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        commands.push(command.data.toJSON());
        console.log(`✅ Załadowano komendę: ${command.data.name}`);
    } else {
        console.log(`⚠️ Komenda w ${filePath} nie ma właściwości "data" lub "execute".`);
    }
}

// Konstruktor REST i deploy komend
const rest = new REST().setToken(process.env.DISCORD_TOKEN);

(async () => {
    try {
        console.log(`🔄 Rozpoczynam rejestrację ${commands.length} komend aplikacji.`);

        // Metoda put służy do pełnego odświeżenia wszystkich komend w gildii ze slash commands
        const data = await rest.put(
            Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID),
            { body: commands },
        );

        console.log(`✅ Pomyślnie przeładowano ${data.length} komend aplikacji.`);

        // Wyświetl zarejestrowane komendy
        console.log('\n📋 Zarejestrowane komendy:');
        data.forEach(command => {
            console.log(`   • /${command.name} - ${command.description}`);
        });

    } catch (error) {
        console.error('❌ Błąd podczas rejestracji komend:', error);
    }
})();

// Jeśli chcesz zarejestrować komendy globalnie (na wszystkich serwerach), użyj tej linii:
// Routes.applicationCommands(process.env.CLIENT_ID)
