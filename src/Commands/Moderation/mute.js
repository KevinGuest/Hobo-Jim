const { PermissionsBitField, EmbedBuilder } = require('discord.js');
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
    name: 'mute',
    description: 'Mute a user by assigning them the Muted role.',
    options: [
      {
        name: 'user',
        description: 'The user to mute.',
        type: 6, // User type
        required: true,
      },
      {
        name: 'reason',
        description: 'Select the reason for muting the user.',
        type: 3, // String type
        required: true,
        choices: rules.map((rule, index) => ({
          name: rule,
          value: `Rule ${index + 1}`,
        })),
      },
      {
        name: 'duration',
        description: 'How long to mute the user (in minutes).',
        type: 4, // Integer type
        required: true,
      },
    ],
  },

  async execute(interaction) {
    const user = interaction.options.getUser('user');
    const reasonChoice = interaction.options.getString('reason');
    const ruleDescription = rules[parseInt(reasonChoice.split(' ')[1]) - 1];
    const duration = interaction.options.getInteger('duration');
    const guild = interaction.guild;
    const guildMember = guild.members.cache.get(user.id);

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

    // Role check
    if (guildMember.roles.highest.position >= interaction.member.roles.highest.position) {
      const embed = new EmbedBuilder()
        .setTitle('Role Error')
        .setDescription('You cannot mute a user with a role equal to or higher than yours.')
        .setColor('#E33232')
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    // Find or create the "Muted" role
    let mutedRole = guild.roles.cache.find(role => role.name.toLowerCase() === 'muted');
    if (!mutedRole) {
      try {
        mutedRole = await guild.roles.create({
          name: 'Muted',
          color: '#808080',
          permissions: [],
          reason: 'Muted role created dynamically for muting users.',
        });

        // Update channel permissions for the "Muted" role
        guild.channels.cache.forEach(channel => {
          channel.permissionOverwrites.create(mutedRole, {
            SendMessages: false,
            Speak: false,
            AddReactions: false,
          });
        });
      } catch (error) {
        console.error('Error creating Muted role:', error);
        return interaction.reply({ content: 'Failed to create Muted role. Please check my permissions.', ephemeral: true });
      }
    }

    // Check if the user is already muted
    if (guildMember.roles.cache.has(mutedRole.id)) {
      const embed = new EmbedBuilder()
        .setTitle('Already Muted')
        .setDescription(`${user.username} is already muted.`)
        .setColor('#E33232')
        .setTimestamp();
      return interaction.reply({ embeds: [embed], ephemeral: true });
    }

    try {
      await guildMember.roles.add(mutedRole);

      const confirmationEmbed = new EmbedBuilder()
        .setTitle('🔇 User Muted')
        .setColor('#E67E22')
        .addFields(
          { name: 'Muted User', value: `<@${user.id}>`, inline: true },
          { name: 'Reason', value: `${reasonChoice}: ${ruleDescription}`, inline: false },
          { name: 'Duration', value: `${duration} minutes`, inline: true }
        )
        .setTimestamp();
      await interaction.reply({ embeds: [confirmationEmbed], ephemeral: false });

      // Dynamically fetch log channel from config
      const loggingConfig = loadLoggingConfig();
      const logChannelId = loggingConfig[guild.id];

      if (logChannelId) {
        const logChannel = guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const notificationEmbed = new EmbedBuilder()
            .setTitle('🔇 Mute Notification')
            .setDescription(`<@${user.id}> has been muted.`)
            .addFields(
              { name: 'Reason', value: `${reasonChoice}: ${ruleDescription}`, inline: false },
              { name: 'Duration', value: `${duration} minutes`, inline: true }
            )
            .setColor('#E67E22')
            .setTimestamp();
          await logChannel.send({ embeds: [notificationEmbed] });
        }
      }

      setTimeout(async () => {
        try {
          if (guildMember.roles.cache.has(mutedRole.id)) {
            await guildMember.roles.remove(mutedRole);

            if (logChannelId) {
              const logChannel = guild.channels.cache.get(logChannelId);
              if (logChannel) {
                const releaseEmbed = new EmbedBuilder()
                  .setTitle('User Unmuted')
                  .setDescription(`<@${user.id}> has been unmuted after serving ${duration} minutes.`)
                  .setColor('#43BA55')
                  .setTimestamp();
                await logChannel.send({ embeds: [releaseEmbed] });
              }
            }
          }
        } catch (error) {
          console.error(`Error unmuting user: ${error}`);
        }
      }, duration * 60 * 1000);
    } catch (error) {
      console.error(`Error muting user: ${error}`);
      const embed = new EmbedBuilder()
        .setTitle('Error')
        .setDescription('There was an error trying to mute the user. Please check my permissions and try again.')
        .setColor('#E33232')
        .setTimestamp();
      await interaction.reply({ embeds: [embed], ephemeral: true });
    }
  },
};
