# 🤖 Community Bot

**Bot Discord community z zaawansowanym systemem komend i ticketów**

![Discord.js](https://img.shields.io/badge/discord.js-v14-blue.svg)
![Node.js](https://img.shields.io/badge/node.js-v16+-green.svg)
![License](https://img.shields.io/badge/license-MIT-brightgreen.svg)

## 📋 Spis treści

- [Funkcjonalności](#-funkcjonalności)
- [Wymagania](#-wymagania)
- [Instalacja](#-instalacja)
- [Konfiguracja](#-konfiguracja)
- [Komendy](#-komendy)
- [System ticketów](#-system-ticketów)
- [Struktura projektu](#-struktura-projektu)
- [Rozwój](#-rozwój)
- [Licencja](#-licencja)

## ✨ Funkcjonalności

### 🛡️ System moderacji
- **Kick** - Wyrzucanie użytkowników z serwera
- **Ban** - Banowanie użytkowników (z opcją usuwania wiadomości)
- **Clear** - Czyszczenie wiadomości z kanałów
- **Timeout** - Wyciszanie użytkowników

### 🎫 System ticketów
- **Automatyczne tworzenie** kanałów ticketów
- **Panel ticketów** z przyciskami
- **Zarządzanie uprawnieniami** w kanałach ticketów
- **System logowania** wszystkich akcji
- **Statystyki ticketów** dla administratorów

### 📊 Narzędzia informacyjne
- **UserInfo** - Szczegółowe informacje o użytkownikach
- **ServerInfo** - Statystyki i informacje o serwerze
- **Statystyki ticketów** - Monitoring systemu wsparcia

### ⚙️ System konfiguracji
- **Zarządzanie rolami** (Support, Moderator, Admin)
- **Konfiguracja kanałów** (Logi, Kategoria ticketów)
- **Ustawienia bota** (Prefix, kolory)
- **Reset konfiguracji** do wartości domyślnych

## 🔧 Wymagania

- **Node.js** v16.9.0 lub nowszy
- **NPM** lub **Yarn**
- **Bot Discord** z odpowiednimi uprawnieniami
- **Serwer Discord** z uprawnieniami administratora

## 📦 Instalacja

### 1. Klonowanie repozytorium
```bash
git clone https://github.com/revsafeDEV/Bot.git
cd Bot
```

### 2. Instalacja zależności
```bash
npm install
# lub
yarn install
```

### 3. Konfiguracja środowiska
Skopiuj `.env.example` do `.env` i uzupełnij danymi:
```bash
cp .env.example .env
```

Edytuj plik `.env`:
```env
# Discord Bot Configuration
DISCORD_TOKEN=your_bot_token_here
CLIENT_ID=your_client_id_here
GUILD_ID=your_guild_id_here

# Bot Configuration
PREFIX=!
EMBED_COLOR=#5865F2

# Ticket System Configuration
TICKET_CATEGORY_ID=your_ticket_category_id
TICKET_LOG_CHANNEL_ID=your_log_channel_id
SUPPORT_ROLE_ID=your_support_role_id

# Moderation Configuration
MODERATOR_ROLE_ID=your_moderator_role_id
ADMIN_ROLE_ID=your_admin_role_id
```

### 4. Rejestracja komend
```bash
node deploy-commands.js
```

### 5. Uruchomienie bota
```bash
npm start
# lub dla developmentu
npm run dev
```

## ⚙️ Konfiguracja

### Tworzenie bota Discord

1. Idź na [Discord Developer Portal](https://discord.com/developers/applications)
2. Kliknij "New Application"
3. Nadaj nazwę swojemu botowi
4. Przejdź do sekcji "Bot"
5. Kliknij "Add Bot"
6. Skopiuj token i wklej do pliku `.env`
7. W sekcji "OAuth2" > "URL Generator":
   - **Scopes**: `bot`, `applications.commands`
   - **Bot Permissions**: `Administrator` (lub wybierz konkretne)
8. Użyj wygenerowanego URL do dodania bota na serwer

### Uzyskiwanie ID

**Włącz Developer Mode w Discord:**
1. Ustawienia Discord > Zaawansowane > Tryb developera
2. Kliknij prawym przyciskiem na serwer/kanał/rolę → "Kopiuj ID"

### Konfiguracja bota za pomocą komend

Po uruchomieniu użyj komendy `/config` do ustawienia:
```
/config set klucz:Rola Support wartość:ID_ROLI_SUPPORT
/config set klucz:Kategoria Ticketów wartość:ID_KATEGORII
/config set klucz:Kanał Logów wartość:ID_KANALU_LOGOW
```

## 🎮 Komendy

### 🛡️ Moderacja

| Komenda | Opis | Uprawnienia wymagane |
|---------|------|---------------------|
| `/kick <użytkownik> [powód]` | Wyrzuca użytkownika z serwera | Wyrzucanie członków |
| `/ban <użytkownik> [powód] [dni_wiadomości]` | Banuje użytkownika | Banowanie członków |
| `/clear <liczba> [użytkownik]` | Usuwa wiadomości z kanału | Zarządzanie wiadomościami |

### 📊 Informacje

| Komenda | Opis | Uprawnienia wymagane |
|---------|------|---------------------|
| `/userinfo [użytkownik]` | Informacje o użytkowniku | Brak |
| `/serverinfo` | Informacje o serwerze | Brak |

### 🎫 System ticketów

| Komenda | Opis | Uprawnienia wymagane |
|---------|------|---------------------|
| `/ticket panel` | Tworzy panel ticketów | Zarządzanie kanałami |
| `/ticket close` | Zamyka aktualny ticket | Właściciel ticketu lub Support |
| `/ticket add <użytkownik>` | Dodaje użytkownika do ticketu | Zarządzanie kanałami |
| `/ticket remove <użytkownik>` | Usuwa użytkownika z ticketu | Zarządzanie kanałami |
| `/ticket stats` | Statystyki ticketów | Zarządzanie kanałami |

### ⚙️ Konfiguracja

| Komenda | Opis | Uprawnienia wymagane |
|---------|------|---------------------|
| `/config show` | Wyświetla aktualną konfigurację | Administrator |
| `/config set <klucz> <wartość>` | Ustawia wartość konfiguracji | Administrator |
| `/config reset` | Resetuje konfigurację | Administrator |

## 🎫 System ticketów

### Jak działa?

1. **Administrator** używa `/ticket panel` aby utworzyć panel
2. **Użytkownicy** klikają przycisk "Utwórz Ticket"
3. **Automatycznie** tworzony jest prywatny kanał
4. **Zespół wsparcia** otrzymuje powiadomienie
5. **Po rozwiązaniu** ticket można zamknąć i usunąć

### Funkcje systemu ticketów

- ✅ **Automatyczne tworzenie** kanałów z odpowiednimi uprawnieniami
- 🔒 **Kontrola dostępu** - tylko właściciel i zespół wsparcia
- 📝 **System logowania** wszystkich akcji w wyznaczonym kanale
- 📊 **Statystyki** - śledzenie liczby otwartych/zamkniętych ticketów
- 🎨 **Customizacja** - możliwość dostosowania wyglądu i kategorii
- ⚡ **Szybkie akcje** - przyciski do zamykania i usuwania

### Konfiguracja systemu ticketów

1. Utwórz **kategorię** dla ticketów
2. Utwórz **kanał logów** (opcjonalne)
3. Utwórz **rolę support**
4. Użyj `/config set` aby skonfigurować ID
5. Użyj `/ticket panel` aby utworzyć panel

## 📁 Struktura projektu

```
Bot/
├── commands/           # Komendy slash
│   ├── ban.js
│   ├── clear.js
│   ├── config.js
│   ├── kick.js
│   ├── serverinfo.js
│   ├── ticket.js
│   └── userinfo.js
├── events/             # Event handlers
│   └── interactionCreate.js
├── utils/              # Narzędzia pomocnicze
│   └── ticketHandler.js
├── data/               # Pliki danych
│   ├── config.json     # Konfiguracja bota
│   └── tickets.json    # Baza ticketów
├── .env.example        # Przykład konfiguracji
├── deploy-commands.js  # Skrypt rejestracji komend
├── index.js           # Główny plik bota
├── package.json       # Zależności projektu
└── README.md          # Ta dokumentacja
```

## 🚀 Rozwój

### Dodawanie nowych komend

1. Utwórz nowy plik w folderze `commands/`
2. Użyj tego szablonu:

```javascript
const { SlashCommandBuilder } = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('nazwa')
        .setDescription('Opis komendy'),
    
    cooldown: 3, // Cooldown w sekundach
    
    async execute(interaction) {
        await interaction.reply('Odpowiedź!');
    },
};
```

3. Uruchom `node deploy-commands.js` aby zarejestrować

### Dodawanie nowych eventów

1. Utwórz plik w folderze `events/`
2. Użyj tego szablonu:

```javascript
const { Events } = require('discord.js');

module.exports = {
    name: Events.EventName,
    once: false, // true jeśli event ma być wykonany tylko raz
    async execute(...args) {
        // Logika eventu
    },
};
```

### Uruchamianie w trybie deweloperskim

```bash
npm run dev  # Używa nodemon do automatycznego restartowania
```

## 🤝 Wsparcie

Jeśli napotkasz problemy lub masz pytania:

1. Sprawdź [Issues](https://github.com/revsafeDEV/Bot/issues)
2. Utwórz nowe Issue z opisem problemu
3. Dołącz logi błędów i konfigurację (bez tokenów!)

## 📝 Changelog

### v1.0.0 (2024-09-18)
- ✨ Pierwszy release
- 🛡️ System moderacji (kick, ban, clear)
- 🎫 Kompletny system ticketów
- 📊 Komendy informacyjne (userinfo, serverinfo)
- ⚙️ System konfiguracji
- 📚 Kompletna dokumentacja

## 📄 Licencja

Ten projekt jest licencjonowany na licencji MIT - zobacz plik [LICENSE](LICENSE) po szczegóły.

---

**Utworzony przez revsafeDEV** 💜

Jeśli ten bot jest przydatny, zostaw ⭐ na [GitHub](https://github.com/revsafeDEV/Bot)!
