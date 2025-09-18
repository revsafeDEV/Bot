const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('economy')
        .setDescription('System ekonomiczny bota')
        .addSubcommand(subcommand =>
            subcommand
                .setName('balance')
                .setDescription('Sprawdza twój stan konta')
                .addUserOption(option =>
                    option.setName('użytkownik')
                        .setDescription('Użytkownik do sprawdzenia (opcjonalne)')
                        .setRequired(false)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('daily')
                .setDescription('Odbierz dzienne monety'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('leaderboard')
                .setDescription('Ranking najbogatszych użytkowników'))
        .addSubcommand(subcommand =>
            subcommand
                .setName('pay')
                .setDescription('Przelej monety innemu użytkownikowi')
                .addUserOption(option =>
                    option.setName('użytkownik')
                        .setDescription('Użytkownik do wpłaty')
                        .setRequired(true))
                .addIntegerOption(option =>
                    option.setName('kwota')
                        .setDescription('Ilość monet do przelania')
                        .setMinValue(1)
                        .setRequired(true)))
        .addSubcommand(subcommand =>
            subcommand
                .setName('gamble')
                .setDescription('Graj w kości (ryzykuj monety!)')
                .addIntegerOption(option =>
                    option.setName('kwota')
                        .setDescription('Ilość monet do postawienia')
                        .setMinValue(10)
                        .setMaxValue(1000)
                        .setRequired(true))),
    
    cooldown: 3,
    economyPath: path.join(__dirname, '..', 'data', 'economy.json'),
    
    execute: async function(interaction) {
        const subcommand = interaction.options.getSubcommand();

        switch (subcommand) {
            case 'balance':
                await this.handleBalance(interaction);
                break;
            case 'daily':
                await this.handleDaily(interaction);
                break;
            case 'leaderboard':
                await this.handleLeaderboard(interaction);
                break;
            case 'pay':
                await this.handlePay(interaction);
                break;
            case 'gamble':
                await this.handleGamble(interaction);
                break;
        }
    },

    ensureEconomyFile: function() {
        if (!fs.existsSync(this.economyPath)) {
            fs.writeFileSync(this.economyPath, JSON.stringify({ users: {} }, null, 2));
        }
    },

    getEconomyData: function() {
        this.ensureEconomyFile();
        const data = fs.readFileSync(this.economyPath, 'utf8');
        return JSON.parse(data);
    },

    saveEconomyData: function(data) {
        fs.writeFileSync(this.economyPath, JSON.stringify(data, null, 2));
    },

    getUser: function(userId) {
        const data = this.getEconomyData();
        if (!data.users[userId]) {
            data.users[userId] = {
                coins: 100, // Startowe monety
                bank: 0,
                lastDaily: 0,
                totalEarned: 100,
                totalSpent: 0
            };
            this.saveEconomyData(data);
        }
        return data.users[userId];
    },

    updateUser: function(userId, newData) {
        const data = this.getEconomyData();
        data.users[userId] = { ...data.users[userId], ...newData };
        this.saveEconomyData(data);
        return data.users[userId];
    },

    handleBalance: async function(interaction) {
        const targetUser = interaction.options.getUser('użytkownik') || interaction.user;
        const userData = this.getUser(targetUser.id);

        const totalWealth = userData.coins + userData.bank;
        const isOwn = targetUser.id === interaction.user.id;

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle(`💰 ${isOwn ? 'Twój portfel' : `Portfel ${targetUser.displayName}`}`)
            .setThumbnail(targetUser.displayAvatarURL())
            .addFields(
                { name: '💰 Monety w portfelu', value: `**${userData.coins}** 🪙`, inline: true },
                { name: '🏛️ Monety w banku', value: `**${userData.bank}** 🪙`, inline: true },
                { name: '💎 Całkowity majątek', value: `**${totalWealth}** 🪙`, inline: true }
            );

        if (isOwn) {
            embed.addFields(
                { name: '📈 Łącznie zarobiono', value: `**${userData.totalEarned}** 🪙`, inline: true },
                { name: '📉 Łącznie wydano', value: `**${userData.totalSpent}** 🪙`, inline: true },
                { name: '💹 Zysk netto', value: `**${userData.totalEarned - userData.totalSpent}** 🪙`, inline: true }
            );
        }

        embed.setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    handleDaily: async function(interaction) {
        const userData = this.getUser(interaction.user.id);
        const now = Date.now();
        const lastDaily = userData.lastDaily || 0;
        const timeLeft = (lastDaily + 24 * 60 * 60 * 1000) - now;

        if (timeLeft > 0) {
            const hoursLeft = Math.floor(timeLeft / (60 * 60 * 1000));
            const minutesLeft = Math.floor((timeLeft % (60 * 60 * 1000)) / (60 * 1000));

            return interaction.reply({
                content: `⏰ Już odebrałeś/aś dzisiejsze monety! Następne za **${hoursLeft}h ${minutesLeft}m**`,
                ephemeral: true
            });
        }

        // Losowa ilość monet (50-150)
        const dailyAmount = Math.floor(Math.random() * 101) + 50;
        const bonusMultiplier = Math.random() < 0.1 ? 2 : 1; // 10% szans na bonus x2
        const finalAmount = dailyAmount * bonusMultiplier;

        this.updateUser(interaction.user.id, {
            coins: userData.coins + finalAmount,
            lastDaily: now,
            totalEarned: userData.totalEarned + finalAmount
        });

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('🎁 Dzienne monety odebrane!')
            .setDescription(`Otrzymałeś/aś **${finalAmount}** 🪙${bonusMultiplier > 1 ? '\\n🎉 **BONUS x2!**' : ''}`)
            .addFields(
                { name: '💰 Twoje monety', value: `**${userData.coins + finalAmount}** 🪙`, inline: true }
            )
            .setFooter({ text: 'Wróć za 24 godziny po następną nagrodę!' })
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    handleLeaderboard: async function(interaction) {
        const data = this.getEconomyData();
        const users = Object.entries(data.users)
            .map(([userId, userData]) => ({
                userId,
                totalWealth: userData.coins + userData.bank,
                coins: userData.coins,
                bank: userData.bank
            }))
            .sort((a, b) => b.totalWealth - a.totalWealth)
            .slice(0, 10);

        if (users.length === 0) {
            return interaction.reply({
                content: '📊 Ranking jest pusty! Użyj `/economy daily` aby zacząć zbierać monety.',
                ephemeral: true
            });
        }

        const embed = new EmbedBuilder()
            .setColor('#FFD700')
            .setTitle('🏆 Ranking Najbogatszych')
            .setDescription('Top 10 użytkowników z największym majątkiem');

        let leaderboardText = '';
        for (let i = 0; i < users.length; i++) {
            try {
                const user = await interaction.client.users.fetch(users[i].userId);
                const position = i + 1;
                const medal = position === 1 ? '🥇' : position === 2 ? '🥈' : position === 3 ? '🥉' : `**${position}.**`;
                
                leaderboardText += `${medal} ${user.displayName} - **${users[i].totalWealth}** 🪙\\n`;
            } catch (error) {
                // Użytkownik nie istnieje lub bot nie może go znaleźć
                leaderboardText += `${i + 1}. *Nieznany użytkownik* - **${users[i].totalWealth}** 🪙\\n`;
            }
        }

        embed.setDescription(leaderboardText);
        embed.setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    handlePay: async function(interaction) {
        const targetUser = interaction.options.getUser('użytkownik');
        const amount = interaction.options.getInteger('kwota');

        if (targetUser.id === interaction.user.id) {
            return interaction.reply({
                content: '❌ Nie możesz przelać monet samemu sobie!',
                ephemeral: true
            });
        }

        if (targetUser.bot) {
            return interaction.reply({
                content: '❌ Nie możesz przelać monet botom!',
                ephemeral: true
            });
        }

        const senderData = this.getUser(interaction.user.id);
        if (senderData.coins < amount) {
            return interaction.reply({
                content: `❌ Nie masz wystarczająco monet! Masz tylko **${senderData.coins}** 🪙`,
                ephemeral: true
            });
        }

        const receiverData = this.getUser(targetUser.id);

        // Przelej monety
        this.updateUser(interaction.user.id, {
            coins: senderData.coins - amount,
            totalSpent: senderData.totalSpent + amount
        });

        this.updateUser(targetUser.id, {
            coins: receiverData.coins + amount,
            totalEarned: receiverData.totalEarned + amount
        });

        const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setTitle('💸 Przelew wykonany!')
            .setDescription(`${interaction.user} przelał/a **${amount}** 🪙 dla ${targetUser}`)
            .addFields(
                { name: 'Nadawca', value: `**${senderData.coins - amount}** 🪙 pozostało`, inline: true },
                { name: 'Odbiorca', value: `**${receiverData.coins + amount}** 🪙 łącznie`, inline: true }
            )
            .setTimestamp();

        await interaction.reply({ embeds: [embed] });
    },

    handleGamble: async function(interaction) {
        const amount = interaction.options.getInteger('kwota');
        const userData = this.getUser(interaction.user.id);

        if (userData.coins < amount) {
            return interaction.reply({
                content: `❌ Nie masz wystarczająco monet! Masz tylko **${userData.coins}** 🪙`,
                ephemeral: true
            });
        }

        await interaction.deferReply();

        // Symulacja gry - rzut kostką
        const playerRoll = Math.floor(Math.random() * 6) + 1;
        const houseRoll = Math.floor(Math.random() * 6) + 1;

        let result, multiplier, winAmount;
        let resultColor = '#FF0000';

        if (playerRoll > houseRoll) {
            // Wygrana
            multiplier = playerRoll === 6 ? 2.5 : 1.8; // Bonus za 6
            winAmount = Math.floor(amount * multiplier);
            result = 'win';
            resultColor = '#00FF00';
        } else if (playerRoll === houseRoll) {
            // Remis - zwrot stawki
            winAmount = amount;
            result = 'tie';
            resultColor = '#FFFF00';
        } else {
            // Przegrana
            winAmount = 0;
            result = 'lose';
            resultColor = '#FF0000';
        }

        const netGain = winAmount - amount;

        this.updateUser(interaction.user.id, {
            coins: userData.coins + netGain,
            totalEarned: result !== 'lose' ? userData.totalEarned + (winAmount - amount) : userData.totalEarned,
            totalSpent: result === 'lose' ? userData.totalSpent + amount : userData.totalSpent
        });

        const embed = new EmbedBuilder()
            .setColor(resultColor)
            .setTitle('🎲 Gra w kości!')
            .addFields(
                { name: '🎯 Twój rzut', value: `**${playerRoll}**`, inline: true },
                { name: '🏠 Rzut kasyna', value: `**${houseRoll}**`, inline: true },
                { name: '💰 Stawka', value: `**${amount}** 🪙`, inline: true }
            );

        if (result === 'win') {
            embed.setDescription(`🎉 **WYGRANA!**\\nWygrałeś/aś **${winAmount}** 🪙!`)
                 .addFields({ name: '💎 Zysk', value: `**+${netGain}** 🪙`, inline: true });
        } else if (result === 'tie') {
            embed.setDescription(`🤝 **REMIS!**\\nOdzyskujesz swoją stawkę: **${amount}** 🪙`);
        } else {
            embed.setDescription(`😵 **PRZEGRANA!**\\nStracił/aś **${amount}** 🪙`)
                 .addFields({ name: '💸 Strata', value: `**-${amount}** 🪙`, inline: true });
        }

        embed.addFields({ 
            name: '💰 Twoje monety', 
            value: `**${userData.coins + netGain}** 🪙`, 
            inline: true 
        });

        embed.setTimestamp();

        await interaction.editReply({ embeds: [embed] });
    }
};
