const { readdirSync } = require("node:fs");
const { PermissionsBitField, EmbedBuilder } = require("discord.js");
const { getIgnoredChannels } = require("../data/ignoredChannels");

module.exports = {
  async execute(client) {
    const PATH = process.cwd() + "/src/Events";
    const events = readdirSync(PATH);

    for (let event of events) {
      event = event.split(".")[0];
      client.on(event, async (...args) => {
        if (event === 'interactionCreate') {
          const interaction = args[0];

          if (!interaction.isCommand()) return;

          // Load ignored channels
          const ignoredChannels = getIgnoredChannels();

          // Check if the command is in an ignored channel
          const isChannelIgnored = ignoredChannels[interaction.channel.id];

          // Check if the user has permissions to bypass the restriction
          const hasBypassPermissions = interaction.member.permissions.has(
            PermissionsBitField.Flags.Administrator |
            PermissionsBitField.Flags.BanMembers |
            PermissionsBitField.Flags.KickMembers
          );

          // If the channel is ignored and the user does not have bypass permissions, block the command
          if (isChannelIgnored && !hasBypassPermissions) {
            const embed = new EmbedBuilder()
              .setColor('#E74C3C') // Red for restrictions
              .setTitle('Channel Restricted')
              .setDescription('⚠️ Commands are disabled in this channel for users without the necessary permissions.');

            return interaction.reply({
              embeds: [embed],
              ephemeral: true,
            });
          }

          // Proceed to execute the command if not blocked
          const command = client.commands.get(interaction.commandName);
          if (!command) return;

          try {
            await command.execute(interaction, client); // Pass client as the second parameter
          } catch (error) {
            console.error(error);

            // Check if the interaction has already been replied to, to avoid double replies
            if (interaction.replied || interaction.deferred) {
              await interaction.followUp({
                embeds: [
                  new EmbedBuilder()
                    .setColor('#E74C3C') // Red for errors
                    .setTitle('Command Execution Error')
                    .setDescription('❌ There was an error executing that command. Please try again.')
                ],
                ephemeral: true,
              });
            } else {
              await interaction.reply({
                embeds: [
                  new EmbedBuilder()
                    .setColor('#E74C3C') // Red for errors
                    .setTitle('Command Execution Error')
                    .setDescription('❌ There was an error executing that command. Please try again.')
                ],
                ephemeral: true,
              });
            }
          }
        } else {
          // Execute other events
          await require(`${PATH}/${event}.js`).execute(...args);
        }
      });
    }
  },
};
