const { Events, Collection } = require('discord.js');

module.exports = {
    name: Events.InteractionCreate,
    async execute(interaction) {
        // Obsługa slash commands
        if (interaction.isChatInputCommand()) {
            const command = interaction.client.commands.get(interaction.commandName);

            if (!command) {
                console.error(`Nie znaleziono komendy ${interaction.commandName}.`);
                return;
            }

            const { cooldowns } = interaction.client;

            if (!cooldowns.has(command.data.name)) {
                cooldowns.set(command.data.name, new Collection());
            }

            const now = Date.now();
            const timestamps = cooldowns.get(command.data.name);
            const defaultCooldownDuration = 3;
            const cooldownAmount = (command.cooldown ?? defaultCooldownDuration) * 1000;

            if (timestamps.has(interaction.user.id)) {
                const expirationTime = timestamps.get(interaction.user.id) + cooldownAmount;

                if (now < expirationTime) {
                    const expiredTimestamp = Math.round(expirationTime / 1000);
                    return interaction.reply({
                        content: `Musisz poczekać <t:${expiredTimestamp}:R> zanim użyjesz ponownie komendy \`${command.data.name}\`.`,
                        ephemeral: true
                    });
                }
            }

            timestamps.set(interaction.user.id, now);
            setTimeout(() => timestamps.delete(interaction.user.id), cooldownAmount);

            try {
                await command.execute(interaction);
            } catch (error) {
                console.error(`Błąd wykonywania komendy ${interaction.commandName}:`, error);
                
                const errorMessage = {
                    content: 'Wystąpił błąd podczas wykonywania tej komendy!',
                    ephemeral: true
                };

                if (interaction.replied || interaction.deferred) {
                    await interaction.followUp(errorMessage);
                } else {
                    await interaction.reply(errorMessage);
                }
            }
        }
        
        // Obsługa button interactions (dla systemu ticketów)
        else if (interaction.isButton()) {
            const buttonId = interaction.customId;
            
            // System ticketów
            if (buttonId === 'create_ticket') {
                const ticketHandler = require('../utils/ticketHandler');
                await ticketHandler.createTicket(interaction);
            }
            else if (buttonId === 'close_ticket') {
                const ticketHandler = require('../utils/ticketHandler');
                await ticketHandler.closeTicket(interaction);
            }
            else if (buttonId === 'delete_ticket') {
                const ticketHandler = require('../utils/ticketHandler');
                await ticketHandler.deleteTicket(interaction);
            }
        }
        
        // Obsługa select menu interactions
        else if (interaction.isStringSelectMenu()) {
            if (interaction.customId === 'ticket_category') {
                const ticketHandler = require('../utils/ticketHandler');
                await ticketHandler.handleCategorySelect(interaction);
            }
        }
    },
};
