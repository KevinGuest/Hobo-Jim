const { PermissionsBitField, EmbedBuilder } = require('discord.js');

const rules = [
  "No spamming",
  "No trolling",
  "No advertising",
  "Respectful interactions",
  "Privacy respect",
  "No doxing or DDoS talk",
  "Nicknames",
  "No NSFW content",
  "No posting personal information or photos of others",
  "Third-party program usage",
  "Macros policy",
  "Alts",
];

module.exports = {
  data: {
    name: 'jail',
    description: 'Jail a user by assigning them the Jail role.',
    options: [
      {
        name: 'user',
        description: 'The user to jail.',
        type: 6, // User type
        required: true,
      },
      {
        name: 'reason',
        description: 'Select the reason for jailing the user.',
        type: 3, // String type
        required: true,
        choices: rules.map((rule, index) => ({
          name: rule,
          value: `Rule ${index + 1}`,
        })),
      },
      {
        name: 'duration',
        description: 'How long to jail the user (in minutes).',
        type: 4, // Integer type
        required: true,
      },
    ],
  },

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reasonChoice = interaction.options.getString('reason'); // Selected rule
    const ruleDescription = rules[parseInt(reasonChoice.split(' ')[1]) - 1]; // Get the short rule title
    const duration = interaction.options.getInteger('duration'); // Jail duration in minutes
    const jailRoleId = '1308685225152352328'; // Jail role ID
    const jailNotificationChannelId = '1308698303076237344'; // Notification channel ID
    const logChannelId = '1286176037398384702'; // Log channel ID
    const guildMember = interaction.guild.members.cache.get(user.id);

    // Permission check
    if (
      !interaction.member.permissions.has(PermissionsBitField.Flags.Administrator) &&
      !interaction.member.permissions.has(PermissionsBitField.Flags.KickMembers) &&
      !interaction.member.permissions.has(PermissionsBitField.Flags.BanMembers)
    ) {
      const embed = new EmbedBuilder()
        .setTitle('Permission Denied')
        .setDescription('You do not have permission to use this command! Requires Administrator, Kick Members, or Ban Members permission.')
        .setColor('#E33232')
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Ensure the user is part of the guild
    if (!guildMember) {
      const embed = new EmbedBuilder()
        .setTitle('User Not Found')
        .setDescription('The specified user is not in this server.')
        .setColor('#E33232')
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Check if the user is already jailed
    if (guildMember.roles.cache.has(jailRoleId)) {
      const embed = new EmbedBuilder()
        .setTitle('Already Jailed')
        .setDescription(`${user.username} is already jailed.`)
        .setColor('#E33232')
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      await guildMember.roles.add(jailRoleId);

      const confirmationEmbed = new EmbedBuilder()
        .setTitle('🔒 User Jailed')
        .setColor('#E67E22')
        .addFields(
          { name: 'Jailed User', value: `<@${user.id}>`, inline: true },
          { name: 'Reason', value: `${reasonChoice}: ${ruleDescription}`, inline: false },
          { name: 'Duration', value: `${duration} minutes`, inline: true }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [confirmationEmbed], ephemeral: false });

      const notificationChannel = interaction.guild.channels.cache.get(jailNotificationChannelId);
      if (notificationChannel) {
        const notificationEmbed = new EmbedBuilder()
          .setTitle('🔒 Jail Notification')
          .setDescription(`<@${user.id}> has been jailed.`)
          .addFields(
            { name: 'Reason', value: `${reasonChoice}: ${ruleDescription}`, inline: false },
            { name: 'Duration', value: `${duration} minutes`, inline: true }
          )
          .setColor('#E67E22')
          .setTimestamp();
        await notificationChannel.send({ embeds: [notificationEmbed] });
      }

      const logChannel = interaction.guild.channels.cache.get(logChannelId);
      if (logChannel) {
        const logEmbed = new EmbedBuilder()
          .setTitle('🔒 User Jailed)')
          .setColor('#E67E22')
          .addFields(
            { name: 'Jailed User', value: `<@${user.id}>`, inline: true },
            { name: 'Jailed By', value: `<@${interaction.user.id}>`, inline: true },
            { name: 'Reason', value: `${reasonChoice}: ${ruleDescription}`, inline: false },
            { name: 'Duration', value: `${duration} minutes`, inline: true }
          )
          .setTimestamp();
        await logChannel.send({ embeds: [logEmbed] });
      }

      setTimeout(async () => {
        try {
          if (guildMember.roles.cache.has(jailRoleId)) {
            await guildMember.roles.remove(jailRoleId);

            if (notificationChannel) {
              const releaseEmbed = new EmbedBuilder()
                .setTitle('User Released')
                .setDescription(`<@${user.id}> has been released from jail after serving ${duration} minutes.`)
                .setColor('#43BA55')
                .setTimestamp();
              await notificationChannel.send({ embeds: [releaseEmbed] });
            }
          }
        } catch (error) {
          console.error(`Error releasing user from jail: ${error}`);
        }
      }, duration * 60 * 1000);
    } catch (error) {
      console.error(`Error jailing user: ${error}`);
      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('There was an error trying to jail the user. Please check my permissions and try again.')
        .setColor('#E33232')
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
