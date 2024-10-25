const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'addrole',
    description: 'Add a role to a specified user.',
    options: [
      {
        name: 'target',
        description: 'The member to whom you want to add the role',
        type: 6, // USER type
        required: true,
      },
      {
        name: 'role',
        description: 'The role you want to add',
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
        content: 'You cannot add a role that is equal or higher than your own!',
        ephemeral: true,
      });
    }

    try {
      await targetMember.roles.add(role);

      await interaction.reply({
        content: `✅ Successfully added the role ${role.name} to <@${targetMember.id}>.`,
        ephemeral: true,
      });

      // Logging the role addition
      const logChannelId = 'YOUR_LOG_CHANNEL_ID';
      const logChannel = interaction.guild.channels.cache.get(logChannelId);

      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('Role Added')
          .setColor('#43BA55') // Green for addition
          .addFields(
            { name: 'User', value: `<@${targetMember.id}>`, inline: true },
            { name: 'Role', value: role.name, inline: true },
            { name: 'Added by', value: `<@${interaction.user.id}>`, inline: true }
          )
          .setTimestamp();

        logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(`Error adding role: ${error}`);
      interaction.reply({
        content: 'There was an error trying to add the role. Please try again.',
        ephemeral: true,
      });
    }
  },
};
