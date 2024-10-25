const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'warn',
    description: 'Issue a warning to a user.',
    options: [
      {
        name: 'target',
        description: 'The member you want to warn',
        type: 6, // 6 is the type for USER
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason for warning the member',
        type: 3, // 3 is the type for STRING
        required: false,
      },
    ],
  },

  async execute(interaction) {
    const authorizedRoles = ['Discord Moderator', 'Bobba Staff', 'Developers', 'Administrators'];
    const memberRoles = interaction.member.roles.cache;

    const hasRole = authorizedRoles.some(role => memberRoles.some(r => r.name === role));

    if (!hasRole) {
      return interaction.reply({
        content: 'You do not have permission to use this command!',
        ephemeral: true,
      });
    }

    const targetUser = interaction.options.getUser('target');
    if (!targetUser) {
      return interaction.reply({
        content: 'The specified user could not be found. Please try again.',
        ephemeral: true,
      });
    }

    const reason = interaction.options.getString('reason') || 'No reason provided';
    const targetMember = interaction.guild.members.cache.get(targetUser.id);

    if (!targetMember) {
      return interaction.reply({
        content: 'The specified user is not in this server!',
        ephemeral: true,
      });
    }

    if (interaction.member.roles.highest.comparePositionTo(targetMember.roles.highest) <= 0) {
      return interaction.reply({
        content: 'You cannot warn this user because their role is equal or higher than yours!',
        ephemeral: true,
      });
    }

    try {
      await interaction.reply({
        content: `⚠️ <@${targetMember.id}> has been warned. Reason: ${reason}`,
        ephemeral: true,
      });

      const logChannelId = '1286176037398384702'; // Replace with your log channel ID
      const logChannel = interaction.guild.channels.cache.get(logChannelId);

      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('User Warned')
          .setColor('#FFA500')
          .addFields(
            { name: 'User', value: `<@${targetMember.id}>`, inline: true },
            { name: 'Warned by', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Reason', value: reason, inline: true },
            { name: 'Time of Warning', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
          )
          .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();

        logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(`Error warning user: ${error}`);
      interaction.reply({
        content: 'There was an error trying to warn this user.',
        ephemeral: true,
      });
    }
  },
};
