const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'help',
    description: 'Provides guidance on adding commands to your guild.',
    dm_permission: true, // Allow in DMs for convenience
  },
  async execute(interaction) {
    try {
      const embed = new EmbedBuilder()
        .setColor(0x3498db)
        .setTitle('Help - Adding Commands to Your Guild')
        .setDescription(
          `This guide will help you add commands to your guild.\n\nHere’s how to add a command:\n\n` +
          `1. **View Available Commands:** Use \`/commands\` to see a list of all commands categorized by their folder.\n` +
          `2. **Add a Command to Your Guild:** Use the \`/add\` command with the command name and the guild ID where you want it enabled.\n\n` +
          `**Example:**\n\`\`\`/add info guild\`\`\`\n` +
          `This will add the \`info\` command to the guild\`.\n\n` +
          `**Note:** You need appropriate permissions (Administrator or Manage Guild) to add commands to a guild.`
        )
        .addFields(
          { name: 'Useful Commands', value: '`/commands`: Lists all available commands.', inline: false },
          { name: 'Support', value: '[Visit our support server](https://discord.gg/bobbarp)', inline: false }
        )
        .setFooter({
          text: 'Hobo Jim - Powered by discord.js',
          iconURL: 'https://sniped.gg/uploads/opWeBzeofYk121czJ101IJRAutqTlWToLW0Sj7iN.gif',
        });

      // Reply with the embed
      await interaction.reply({
        embeds: [embed],
        ephemeral: true, // Ephemeral to prevent clutter in the channel
      });
    } catch (error) {
      console.error('Error executing help command:', error);
      await interaction.reply({
        content: 'There was an error while executing this command!',
        ephemeral: true,
      }).catch(() => {
        interaction.followUp({
          content: 'There was an error while executing this command!',
          ephemeral: true,
        });
      });
    }
  },
};
