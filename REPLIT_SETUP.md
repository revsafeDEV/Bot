# 🚀 Discord Bot - Replit Setup Guide

This guide will help you set up and run the Discord Bot on Replit for free 24/7 hosting.

## 📋 Prerequisites

1. **Discord Bot Token** - Get one from [Discord Developer Portal](https://discord.com/developers/applications)
2. **Replit Account** - Sign up at [replit.com](https://replit.com)
3. **GitHub Account** - To import the repository

## 🔧 Step-by-Step Setup

### 1. Import to Replit

1. Go to [Replit](https://replit.com)
2. Click **"+ Create Repl"**
3. Select **"Import from GitHub"**
4. Enter the repository URL: `https://github.com/revsafeDEV/Bot`
5. Click **"Import from GitHub"**

### 2. Configure Environment Variables

In your Replit project, go to the **Secrets** tab (🔒 icon in sidebar) and add these environment variables:

#### Required Variables:
```
DISCORD_TOKEN=your_discord_bot_token_here
CLIENT_ID=your_discord_application_client_id
GUILD_ID=your_discord_server_id (optional for global commands)
```

#### Optional Configuration:
```
PREFIX=!
EMBED_COLOR=#5865F2
TICKET_CATEGORY_ID=your_ticket_category_id
TICKET_LOG_CHANNEL_ID=your_log_channel_id
SUPPORT_ROLE_ID=your_support_role_id
MODERATOR_ROLE_ID=your_moderator_role_id
ADMIN_ROLE_ID=your_admin_role_id
```

### 3. Get Discord Bot Credentials

1. Go to [Discord Developer Portal](https://discord.com/developers/applications)
2. Create a new application or select existing one
3. Go to **"Bot"** section:
   - Copy the **Token** → Add as `DISCORD_TOKEN` in Replit Secrets
4. Go to **"General Information"**:
   - Copy the **Application ID** → Add as `CLIENT_ID` in Replit Secrets

### 4. Get Guild ID (Server ID)

1. Enable Developer Mode in Discord: **Settings > Advanced > Developer Mode**
2. Right-click your server name → **"Copy Server ID"**
3. Add as `GUILD_ID` in Replit Secrets

### 5. Invite Bot to Server

1. In Discord Developer Portal, go to **"OAuth2" > "URL Generator"**
2. Select scopes:
   - ✅ `bot`
   - ✅ `applications.commands`
3. Select permissions:
   - ✅ `Administrator` (or specific permissions you need)
4. Copy the generated URL and open in browser
5. Select your server and authorize

### 6. Deploy Commands

1. In Replit, open the **Shell** tab
2. Run: `node deploy-commands.js`
3. You should see: "✅ Successfully registered X application commands"

### 7. Run the Bot

1. Click the **"Run"** button in Replit
2. You should see:
   - `🌐 Keep-alive server is running on port 8080`
   - `✅ Bot zalogowany jako YourBotName#1234`
   - `🔧 Działam na X serwerach`

## 🎮 Using the Bot

### Interactive Configuration Menu
```
/config menu
```
This opens an interactive menu with buttons to:
- 📋 Show current configuration
- 👥 Configure roles (Support, Moderator, Admin)
- 📝 Configure channels (Tickets, Logs, Welcome)
- 🔄 Reset settings

### Other Commands
- `/ping` - Check bot latency
- `/serverinfo` - Server information
- `/userinfo` - User information  
- `/ticket` - Create support tickets
- And many more moderation commands!

## 🔄 24/7 Hosting

The bot includes a keep-alive server that prevents Replit from sleeping. The web interface will show bot status at your Replit URL.

### Keep Bot Online:
1. **Replit Hacker Plan** - Automatic always-on
2. **Free Plan** - Use services like [UptimeRobot](https://uptimerobot.com) to ping your Replit URL every 5 minutes

## 🐛 Troubleshooting

### Bot won't start:
- ✅ Check all environment variables are set correctly
- ✅ Ensure Discord token is valid and not regenerated
- ✅ Verify bot has correct permissions on server

### Commands not working:
- ✅ Run `node deploy-commands.js` in Shell
- ✅ Check bot has `applications.commands` scope
- ✅ Ensure you have Administrator permission on server

### Keep-alive not working:
- ✅ Check if Replit URL is accessible
- ✅ Verify port 8080 is open in Replit
- ✅ Make sure no firewall is blocking the connection

## 📁 File Structure
```
Bot/
├── commands/           # Slash commands
├── events/            # Discord event handlers  
├── data/              # Bot configuration files
├── keep_alive.js      # Replit keep-alive server
├── index.js           # Main bot file
├── deploy-commands.js # Command registration
├── .replit           # Replit configuration
├── replit.nix        # Replit dependencies
└── package.json      # Node.js dependencies
```

## 🆘 Support

If you need help:
1. Check the **Console** in Replit for error messages
2. Verify all environment variables are correct
3. Make sure bot has proper Discord permissions
4. Check Discord Developer Portal for any issues

## 🎉 Success!

Your Discord bot should now be running 24/7 on Replit with the interactive configuration menu! Use `/config menu` to start configuring your bot.
