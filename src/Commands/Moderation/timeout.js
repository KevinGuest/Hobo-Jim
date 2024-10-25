const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'timeout',
    description: 'Temporarily time out a user.',
    options: [
      {
        name: 'target',
        description: 'The member you want to time out',
        type: 6, // Type 6 is a USER
        required: true
      },
      {
        name: 'duration',
        description: 'Duration of the timeout in minutes',
        type: 4, // Type 4 is an INTEGER
        required: true
      },
      {
        name: 'reason',
        description: 'Reason for timing out the member',
        type: 3, // Type 3 is a STRING
        required: false
      }
    ]
  },
  async execute(interaction) {
    // Define authorized roles
    const authorizedRoles = ['Discord Moderator', 'Bobba Staff', 'Developers', 'Administrators'];
    const memberRoles = interaction.member.roles.cache;

    // Check if the user has one of the authorized roles
    const hasRole = authorizedRoles.some(role => memberRoles.some(r => r.name === role));
    if (!hasRole) {
      return interaction.reply({
        content: 'You do not have permission to use this command!',
        ephemeral: true,
      });
    }

    // Get target user, duration, and reason
    const targetUser = interaction.options.getUser('target');
    const duration = interaction.options.getInteger('duration') * 60 * 1000; // Convert minutes to milliseconds
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const targetMember = interaction.guild.members.cache.get(targetUser.id);

    // Check if the target member exists
    if (!targetMember) {
      return interaction.reply({
        content: 'The specified user is not in this server!',
        ephemeral: true,
      });
    }

    // Prevent timing out users with higher or equal roles
    if (interaction.member.roles.highest.comparePositionTo(targetMember.roles.highest) <= 0) {
      return interaction.reply({
        content: 'You cannot time out this user because their role is equal or higher than yours!',
        ephemeral: true,
      });
    }

    try {
      // Timeout the user
      await targetMember.timeout(duration, reason);

      // Notify the command issuer
      await interaction.reply({
        content: `✅ <@${targetMember.id}> has been timed out for ${interaction.options.getInteger('duration')} minutes. Reason: ${reason}`,
        ephemeral: true,
      });

      // Logging the timeout to the log channel
      const logChannelId = '1286176037398384702'; // Replace with your log channel ID
      const logChannel = interaction.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('User Timed Out')
          .setColor('#F1C40F') // Yellow for timeouts
          .addFields(
            { name: 'User', value: `<@${targetMember.id}>`, inline: true },
            { name: 'Timed out by', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Duration', value: `${interaction.options.getInteger('duration')} minutes`, inline: true },
            { name: 'Reason', value: reason, inline: true },
            { name: 'Time of Timeout', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
          )
          .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();

        logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(`Error timing out user: ${error}`);
      interaction.reply({
        content: 'There was an error trying to time out this user.',
        ephemeral: true,
      });
    }
  },
};
