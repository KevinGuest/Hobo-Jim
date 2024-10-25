const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'kick',
    description: 'Kick a user from the server.',
    options: [
      {
        name: 'target',
        description: 'The member you want to kick',
        type: 6, // USER type
        required: true,
      },
      {
        name: 'reason',
        description: 'Reason for kicking the member',
        type: 3, // STRING type
        required: false,
      },
    ],
  },
  async execute(interaction) {
    const targetUser = interaction.options.getUser('target');
    const reason = interaction.options.getString('reason') || 'No reason provided';
    const targetMember = interaction.guild.members.cache.get(targetUser.id);

    // Check if the member is kickable
    if (!targetMember) {
      return interaction.reply({
        content: 'The specified user is not in this server!',
        ephemeral: true,
      });
    }

    // Check role hierarchy to prevent kicking users with higher or equal roles
    if (interaction.member.roles.highest.comparePositionTo(targetMember.roles.highest) <= 0) {
      return interaction.reply({
        content: 'You cannot kick this user because their role is equal or higher than yours!',
        ephemeral: true,
      });
    }

    try {
      // Kick the user
      await targetMember.kick(reason);

      // Create an embed message for the kick
      const embed = new EmbedBuilder()
        .setTitle('User Kicked')
        .setDescription(`<@${targetUser.id}> has been kicked.`)
        .addFields(
          { name: 'Kicked By', value: `<@${interaction.user.id}>`, inline: true },
          { name: 'Reason', value: reason, inline: true }
        )
        .setTimestamp()
        .setColor('#E87E2C')
        .setFooter({
          text: `Moderator: ${interaction.user.tag}`,
          iconURL: interaction.user.displayAvatarURL({ dynamic: true }),
        });

      // Send the embed to the command issuer
      await interaction.reply({
        embeds: [embed],
        ephemeral: true, // Visible only to the user who issued the command
      });
    } catch (error) {
      console.error(`Error kicking user: ${error}`);
      return interaction.reply({
        content: 'There was an error trying to kick this user.',
        ephemeral: true,
      });
    }
  },
};
