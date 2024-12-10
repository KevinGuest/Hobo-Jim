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

const rules = [
  "**Server Rules & Information**\n*Last updated: September 25th, 2024*",
  "1. **No spamming**: Avoid spamming text channels, including command spamming.",
  "2. **No trolling**: Trolling and disruptive behavior is not allowed.",
  "3. **No advertising**: Promoting other servers or sites not affiliated with BobbaRP is prohibited.",
  "4. **Respectful interactions**: Arguments are allowed, but drama, racism, homophobia, and hate speech are strictly prohibited.",
  "5. **Privacy respect**: Do not share others' personal information, including IP addresses.",
  "6. **No doxing or DDoS talk**: Discussing doxing or DDoS will result in an immediate ban without warning.",
  "7. **Nicknames**: Avoid setting disruptive nicknames; non-compliance may result in losing nickname privileges.",
  "8. **No NSFW content**: Posting NSFW images in any channel outside of its designated #nsfw channel, is forbidden.",
  "9. **No posting personal information or photos of others**: Posting any personal information or images of another person is strictly prohibited.",
  "10. **Third-party program usage**: Using third-party programs for unfair advantage is not allowed. *XMouse is an exception.*",
  "11. **Macros policy**: Simple macros (BMT/AHK) are allowed, but in-game macros are preferred.",
  "12. **Alts**: Only one alt account may be logged in at a time. Transferring items or currency between alts is prohibited.",
  "**Consequences**\nViolations may result in mutes, kicks, bans, or other punishments, including IP bans or stat/economy resets."
];

module.exports = {
  data: {
    name: 'warn',
    description: 'Issue a warning to a user based on a rule violation.',
    options: [
      {
        name: 'target',
        description: 'The member you want to warn',
        type: 6, // 6 is the type for USER
        required: true,
      },
      {
        name: 'rule_number',
        description: 'The rule number violated',
        type: 4, // 4 is the type for INTEGER
        required: true,
      },
      {
        name: 'reason',
        description: 'Additional reason for warning the member',
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
    const ruleNumber = interaction.options.getInteger('rule_number');
    const reason = interaction.options.getString('reason') || 'No additional reason provided';

    // Validate rule number
    if (ruleNumber < 1 || ruleNumber > rules.length) {
      return interaction.reply({
        content: `Invalid rule number. Please specify a rule number between 1 and ${rules.length}.`,
        ephemeral: true,
      });
    }

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

    // Get the rule text based on rule number
    const ruleText = rules[ruleNumber];

    try {
      // Send a warning notification to the user in an embed
      const userWarningEmbed = new EmbedBuilder()
        .setColor('#FFA500') // Orange for warnings
        .setTitle('Warning Issued')
        .setDescription(`⚠️ <@${targetMember.id}> has been warned for violating rule #${ruleNumber}.`)
        .addFields(
          { name: 'Reason', value: reason, inline: false },
          { name: `Rule Text: ${ruleNumber}`, value: ruleText, inline: false }
        )
        .setFooter({ text: 'Please adhere to the server rules to avoid further action.' })
        .setTimestamp();

      await interaction.reply({ embeds: [userWarningEmbed], ephemeral: false });

      // Log the warning in the dynamically configured log channel
      const loggingConfig = loadLoggingConfig();
      const logChannelId = loggingConfig[interaction.guild.id];

      if (logChannelId) {
        const logChannel = interaction.guild.channels.cache.get(logChannelId);
        if (logChannel) {
          const logEmbed = new EmbedBuilder()
            .setTitle('User Warned')
            .setColor('#FFA500')
            .addFields(
              { name: 'User', value: `<@${targetMember.id}>`, inline: true },
              { name: 'Warned by', value: `<@${interaction.user.id}>`, inline: true },
              { name: 'Rule Violated', value: `#${ruleNumber} - ${ruleText}`, inline: false },
              { name: 'Reason', value: reason, inline: false },
              { name: 'Time of Warning', value: `<t:${Math.floor(Date.now() / 1000)}:F>`, inline: true }
            )
            .setThumbnail(targetMember.user.displayAvatarURL({ dynamic: true }))
            .setTimestamp();

          await logChannel.send({ embeds: [logEmbed] });
        }
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
