const { EmbedBuilder, PermissionFlagsBits } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  data: {
    name: 'commands',
    description: 'Lists all available bot commands, grouped by category (folder).',
    dm_permission: false, // Disable in DMs since server permissions cannot be checked
  },
  async execute(interaction) {
    try {
      // Check if the user is an administrator or server owner
      const member = interaction.member;
      if (!member.permissions.has(PermissionFlagsBits.Administrator) && interaction.user.id !== interaction.guild.ownerId) {
        await interaction.reply({
          content: 'You do not have permission to use this command! Only administrators or the server owner can use it.',
          ephemeral: true,
        });
        return;
      }

      const commandsDir = path.join(__dirname, '../..');
      const categories = {};

      // Read the Commands folder
      function readCommands(dir, category = 'General') {
        const files = fs.readdirSync(dir);
        for (const file of files) {
          const fullPath = path.join(dir, file);
          const stat = fs.lstatSync(fullPath);
          if (stat.isDirectory()) {
            readCommands(fullPath, file); // Subfolder becomes a category
          } else if (file.endsWith('.js')) {
            const command = require(fullPath);
            if (command.data && command.data.name && command.data.description) {
              if (!categories[category]) {
                categories[category] = [];
              }
              categories[category].push({
                name: command.data.name,
                description: command.data.description,
              });
            }
          }
        }
      }

      readCommands(commandsDir);

      if (Object.keys(categories).length === 0) {
        await interaction.reply({
          content: 'No commands found!',
          ephemeral: true,
        });
        return;
      }

      const embeds = [];
      Object.keys(categories).forEach((category) => {
        const commands = categories[category];
        const embed = new EmbedBuilder()
          .setColor(0x3498db)
          .setTitle(`${category} Commands`)
          .setDescription(`Commands in the **${category}** category:`)
          .addFields(
            commands.map(cmd => ({
              name: `/${cmd.name}`,
              value: cmd.description,
              inline: false, // Set to true if you want them inline
            }))
          )
          .setFooter({
            text: `Total Commands in ${category}: ${commands.length}`,
          });

        embeds.push(embed);
      });

      await interaction.reply({
        embeds: embeds,
        ephemeral: true,
      });
    } catch (error) {
      console.error('Error executing commands command:', error);
      await interaction.reply({
        content: 'There was an error while fetching the commands!',
        ephemeral: true,
      }).catch(() => {
        interaction.followUp({
          content: 'There was an error while fetching the commands!',
          ephemeral: true,
        });
      });
    }
  },
};
