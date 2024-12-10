const { EmbedBuilder } = require('discord.js');
const fs = require('fs');
const path = require('path');

// Load the logging configuration
function loadLoggingConfig() {
  const dataDirectory = path.join(__dirname, '../../Data');
  const loggingConfigFilePath = path.join(dataDirectory, 'loggingConfig.json');

  if (fs.existsSync(loggingConfigFilePath)) {
    try {
      return JSON.parse(fs.readFileSync(loggingConfigFilePath, 'utf8'));
    } catch (error) {
      console.error('[Logging] Error reading config file:', error);
      return {};
    }
  }
  return {};
}

module.exports = {
  data: {
    name: 'removerole',
    description: 'Remove a role from a specified user.',
    options: [
      {
        name: 'target',
        description: 'The member from whom you want to remove the role',
        type: 6, // USER type
        required: true,
      },
      {
        name: 'role',
        description: 'The role you want to remove',
        type: 8, // ROLE type
        required: true,
      },
    ],
  },

  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const role = interaction.options.getRole('role');
    const targetMember = interaction.guild.members.cache.get(targetUser.id);

    if (!targetMember) {
      return interaction.reply({
        content: 'The specified user could not be found. Please try again.',
        ephemeral: true,
      });
    }

    // Check for permissions
    if (!interaction.member.permissions.has('MANAGE_ROLES')) {
      return interaction.reply({
        content: 'You do not have permission to use this command!',
        ephemeral: true,
      });
    }

    // Check if the role is higher or equal to the command issuer's role
    if (interaction.member.roles.highest.comparePositionTo(role) <= 0) {
      return interaction.reply({
        content: 'You cannot remove a role that is equal or higher than your own!',
        ephemeral: true,
      });
    }

    try {
      await targetMember.roles.remove(role);

      await interaction.reply({
        content: `✅ Successfully removed the role ${role.name} from <@${targetMember.id}>.`,
        ephemeral: true,
      });

      // Logging the role removal
      const loggingConfig = loadLoggingConfig();
      const logChannelId = loggingConfig[interaction.guild.id];

      if (logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const embed = new EmbedBuilder()
            .setTitle('Role Removed')
            .setColor('#E74C3C') // Red for removal
            .addFields(
              { name: 'User', value: `<@${targetMember.id}>`, inline: true },
              { name: 'Role', value: role.name, inline: true },
              { name: 'Removed by', value: `<@${interaction.user.id}>`, inline: true }
            )
            .setTimestamp();

          logChannel.send({ embeds: [embed] });
        }
      }
    } catch (error) {
      console.error(`Error removing role: ${error}`);
      interaction.reply({
        content: 'There was an error trying to remove the role. Please try again.',
        ephemeral: true,
      });
    }
  },
};
