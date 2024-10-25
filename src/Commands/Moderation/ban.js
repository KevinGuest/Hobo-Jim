const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'ban',
    description: 'Ban a user from the server.',
    options: [
      {
        name: 'target',
        description: 'The member you want to ban',
        type: 6, // USER type
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason for banning the member',
        type: 3, // STRING type
        required: false,
      },
    ],
  },
  async execute(interaction) {
    // Define the role names for authorized roles
    const authorizedRoles = ['Discord Moderator', 'Bobba Staff', 'Developers', 'Administrators'];
    const memberRoles = interaction.member.roles.cache;

    // Check if the member has at least one authorized role
    const hasRole = authorizedRoles.some(role => memberRoles.some(r => r.name === role));

    if (!hasRole) {
      return interaction.reply({
        content: 'You do not have permission to use this command!',
        ephemeral: true, // Reply only visible to the user
      });
    }

    // Get the user to ban and reason (if any)
    const target = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const targetMember = interaction.guild.members.cache.get(target.id);

    if (!targetMember) {
      return interaction.reply({
        content: 'The specified user is not in this server!',
        ephemeral: true,
      });
    }

    // Prevent banning users with higher roles than the person initiating the ban
    if (interaction.member.roles.highest.comparePositionTo(targetMember.roles.highest) <= 0) {
      return interaction.reply({
        content: 'You cannot ban this user because their role is equal or higher than yours!',
        ephemeral: true,
      });
    }

    try {
      await targetMember.ban({ reason });

      // Notify the command issuer
      await interaction.reply({
        content: `✅ <@${targetMember.id}> has been banned. Reason: ${reason}`,
        ephemeral: true, // Only the command issuer can see this
      });

      // Logging the ban to a specific channel
      const logChannelId = '1286176037398384702'; // Replace with your log channel ID
      const logChannel = interaction.guild.channels.cache.get(logChannelId);

      if (logChannel) {
        const embed = new EmbedBuilder()
          .setTitle('User Banned')
          .setColor('#E33232') // Red for bans
          .addFields(
            { name: 'User', value: `<@${targetMember.id}>`, inline: true },
            { name: 'Banned by', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Reason', value: reason, inline: true },
            { name: 'Time of Ban', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
          )
          .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
          .setTimestamp();

        logChannel.send({ embeds: [embed] });
      }
    } catch (error) {
      console.error(`Error banning user: ${error}`);
      interaction.reply({
        content: 'There was an error trying to ban this user.',
        ephemeral: true,
      });
    }
  },
};
