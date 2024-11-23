const fs = require('fs');
const path = require('path');
const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: {
    name: 'modcommands',
    description: 'Lists all the commands in the same folder.',
  },

  async execute(interaction) {
    // Check if the user has the required permissions
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
      !interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers) &&
      !interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)
    ) {
      return interaction.reply({
        content: 'You do not have permission to use this command!',
        ephemeral: true,
      });
    }

    try {
      // Get the current directory of this file
      const commandsFolder = __dirname;

      // Read all files in the current directory
      const files = fs.readdirSync(commandsFolder);

      // Filter files for .js (JavaScript files, assuming your commands are .js files)
      const commandFiles = files.filter(file => file.endsWith('.js'));

      // Extract the command names from each file
      const commandNames = commandFiles.map(file => path.parse(file).name);

      // Create an embed to display the command list
      const embed = new EmbedBuilder()
        .setTitle('Available Commands')
        .setDescription(commandNames.map(name => `- \`${name}\``).join('\n'))
        .setColor('#E33232')
        .setFooter({ text: `Found ${commandNames.length} commands.` })
        .setTimestamp();

      // Reply with the embed
      await interaction.reply({ embeds: [embed] });
    } catch (error) {
      console.error(`Error listing commands: ${error}`);
      await interaction.reply({
        content: 'There was an error trying to list the commands.',
        ephemeral: true,
      });
    }
  },
};
