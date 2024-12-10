const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const { GoogleGenerativeAI } = require('@google/generative-ai');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

const genAI = new GoogleGenerativeAI('AIzaSyACAiM7LJElkuaeYNhzQgBz4_KBFlEBK4s');
const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });

const REVIEW_CHANNEL_ID = '1297419386654556200';
const MUTED_ROLE_ID = '1308685225152352328';
const excludedRoles = ["Administrators", "Developers", "Bobba Staff", "Discord Moderators"];
const addressPattern = /\d{1,6}\s(?:[A-Za-z0-9#]+\s){1,4}(?:Avenue|Ave|Street|St|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Square|Sq|Trail|Trl|Parkway|Pkwy|Commons)/i;
const explicitKeywords = ["porn", "nudes", "nsfw", "adult content"];
const hateSpeechKeywords = ["nigger", "negro", "faggot", "tranny", "chink", "spic", "kike", "cracker", "retard", "dyke", "coon", "wetback", "sandnigger", "gook", "towelhead", "terrorist", "pedophile", "rapist", "kill all", "gas the", "go back to", "white power", "heil hitler", "zionist pig"];

const rules = [
  "**Server Rules & Information**\n*Last updated: September 25th, 2024*",
  "1. **No spamming**: Avoid spamming text channels, including command spamming.",
  "2. **No trolling**: Trolling and disruptive behavior is not allowed.",
  "3. **No advertising**: Promoting other servers or sites not affiliated with BobbaRP is prohibited.",
  "4. **Respectful interactions**: Arguments are allowed, but drama, racism, homophobia, and hate speech are strictly prohibited.",
  "5. **Privacy respect**: Do not share others' personal information, including IP addresses.",
  "6. **No doxing or DDoS talk**: Discussing doxing or DDoS will result in an immediate ban without warning.",
  "7. **Nicknames**: Avoid setting disruptive nicknames; non-compliance may result in losing nickname privileges.",
  "8. **No NSFW content**: Posting NSFW images in any channel outside of its designated #nsfw channel is forbidden.",
  "9. **No posting personal information or photos of others**: Posting any personal information or images of another person is strictly prohibited.",
  "10. **Third-party program usage**: Using third-party programs for unfair advantage is not allowed. *XMouse is an exception.*",
  "11. **Macros policy**: Simple macros (BMT/AHK) are allowed, but in-game macros are preferred.",
  "12. **Alts**: Only one alt account may be logged in at a time. Transferring items or currency between alts is prohibited.",
  "**Consequences**\nViolations may result in mutes, kicks, bans, or other punishments, including IP bans or stat/economy resets."
];


// Function to find the rule associated with the reason
function getRule(reason) {
  const reasonLower = reason.toLowerCase();

  // Keyword-to-rule matching
  const ruleMappings = [
    { keywords: ['spamming'], ruleIndex: 1 },
    { keywords: ['trolling'], ruleIndex: 2 },
    { keywords: ['advertising'], ruleIndex: 3 },
    { keywords: ['hate speech', 'racism', 'homophobia'], ruleIndex: 4 },
    { keywords: ['privacy'], ruleIndex: 5 },
    { keywords: ['doxing', 'ddos'], ruleIndex: 6 },
    { keywords: ['nsfw'], ruleIndex: 8 },
    { keywords: ['personal information'], ruleIndex: 9 },
    { keywords: ['third-party program'], ruleIndex: 10 },
  ];

  for (const mapping of ruleMappings) {
    if (mapping.keywords.some(keyword => reasonLower.includes(keyword))) {
      return rules[mapping.ruleIndex];
    }
  }

  return null; // Return null if no match is found
}

// Updated function to send a flagged message to the review channel
async function sendToReviewChannel(message, reason) {
  const reviewChannel = message.guild.channels.cache.get(REVIEW_CHANNEL_ID);
  if (!reviewChannel) return;

  // Get the associated rule
  const associatedRule = getRule(reason);

  const embed = new EmbedBuilder()
    .setTitle('🚨 Message Flagged')
    .setColor('#E67E22')
    .setDescription(`Message from ${message.author} in ${message.channel} flagged for: **${reason}**`)
    .addFields(
      { name: 'Status', value: 'Review: Pending', inline: true },
      { name: 'Message Content', value: message.content || '*(Message had no content)*', inline: false },
      ...(associatedRule ? [{ name: 'Rule Violated', value: associatedRule, inline: false }] : []) // Add rule if matched
    )
    .setTimestamp()
    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }))
    .setFooter({ 
      text: 'Powered By Google Gemini', 
      iconURL: 'https://upload.wikimedia.org/wikipedia/commons/3/3a/Google-favicon-vector.png' 
    });

  const actionRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`delete_${message.channel.id}_${message.id}`)
        .setLabel('Delete')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`ignore_${message.channel.id}_${message.id}`)
        .setLabel('Ignore')
        .setStyle(ButtonStyle.Secondary)
    );

  const sentMessage = await reviewChannel.send({
    content: `<@&1297941002924855337>`,
    embeds: [embed],
    components: [actionRow]
  });

  return sentMessage.id;
}

client.on('messageCreate', async (message) => {
  // Restrict bot to operate only in the specified server
  if (message.guild?.id !== '857134668770705438') return; // Ignore messages from other servers

  if (message.author.bot) return;

  const hasExcludedRole = message.member.roles.cache.some(role => excludedRoles.includes(role.name));
  if (hasExcludedRole) return;

  // 1. Check for common address patterns
  if (addressPattern.test(message.content)) {
    await sendToReviewChannel(message, 'Personal Information Detected');
    return;
  }

  // 2. Check for explicit content keywords
  if (explicitKeywords.some(keyword => message.content.toLowerCase().includes(keyword))) {
    await sendToReviewChannel(message, 'Explicit Content Detected');
    return;
  }

  // 3. Check for hate speech keywords
  if (hateSpeechKeywords.some(keyword => message.content.toLowerCase().includes(keyword))) {
    await sendToReviewChannel(message, 'Hate Speech Detected');
    return;
  }

  // 4. Use Google Gemini for nuanced or context-sensitive content moderation
  try {
    const prompt = `You are a content moderator. Only flag messages for deletion if they contain clear complete addresses matching one in the real world, hate speech, violent threats, racial slurs, or serious malicious content, exclude profanity. Ignore non-threatening gaming terms and RPG language (e.g., 'level up', 'gym', 'strength', 'kill', 'hit', 'rob', 'steal', 'hospital', 'streets').\n\nMessage: "${message.content}"\n\nShould this message be flagged? Respond with "Yes" or "No".`;

    const result = await model.generateContent(prompt);
    const response = result.response.text().trim().toLowerCase();

    if (response.includes("yes")) {
      await sendToReviewChannel(message, 'Detected by Hobo Jim');
    }
  } catch (error) {
    console.error('Error detecting message content:', error);
  }
});

client.on('interactionCreate', async (interaction) => {
  // Restrict bot to operate only in the specified server
  if (interaction.guild?.id !== '857134668770705438') return; // Ignore interactions from other servers

  if (!interaction.isButton()) return;

  // Parse the action and IDs
  const [action, option, channelId, messageId] = interaction.customId.split('_');
  const reviewChannel = interaction.guild.channels.cache.get(REVIEW_CHANNEL_ID);
  const originalChannel = interaction.guild.channels.cache.get(channelId);

  try {
    const reviewMessage = await reviewChannel.messages.fetch(interaction.message.id);

    if (action === 'delete') {
      const muteConfirmRow = new ActionRowBuilder().addComponents(
        new ButtonBuilder()
          .setCustomId(`mute_yes_${channelId}_${messageId}`)
          .setLabel('Yes, Mute')
          .setStyle(ButtonStyle.Danger),
        new ButtonBuilder()
          .setCustomId(`mute_no_${channelId}_${messageId}`)
          .setLabel('No, Delete')
          .setStyle(ButtonStyle.Secondary)
      );

      const updatedEmbed = EmbedBuilder.from(reviewMessage.embeds[0]).spliceFields(0, 1, {
        name: 'Status',
        value: 'Pending: Mute Confirmation',
        inline: true,
      });

      await reviewMessage.edit({ embeds: [updatedEmbed], components: [muteConfirmRow] });
      await interaction.deferUpdate();
    } else if (action === 'mute' && option === 'yes') {
      const userIdMatch = reviewMessage.embeds[0].description.match(/<@(\d+)>/);
      if (!userIdMatch) {
        console.error('Failed to extract user ID from embed.');
        await interaction.reply({
          content: 'Unable to identify the user. Please try again.',
          ephemeral: true,
        });
        return;
      }

      const userId = userIdMatch[1];
      const guildMember = interaction.guild.members.cache.get(userId);

      if (!guildMember) {
        console.error('User not found in the guild.');
        await interaction.reply({
          content: 'User is no longer in the server.',
          ephemeral: true,
        });
        return;
      }

      await guildMember.roles.add(MUTED_ROLE_ID);

      const updatedEmbed = EmbedBuilder.from(reviewMessage.embeds[0]).spliceFields(0, 1, {
        name: 'Status',
        value: `Muted by <@${interaction.user.id}> for 10 minutes.`,
        inline: true,
      });

      await reviewMessage.edit({ embeds: [updatedEmbed], components: [] });

      const muteEmbed = new EmbedBuilder()
        .setTitle('🔒 User Muted')
        .setColor('#E67E22')
        .setDescription(`User <@${userId}> has been muted.`)
        .addFields(
          { name: 'Duration', value: '10 minutes', inline: true },
          { name: 'Moderator', value: `<@${interaction.user.id}>`, inline: true }
        )
        .setTimestamp();

      const logsChannel = interaction.guild.channels.cache.get('1286176037398384702');
      if (logsChannel) {
        await logsChannel.send({ embeds: [muteEmbed] });
      } else {
        console.error('Logs channel not found.');
      }

      setTimeout(async () => {
        if (guildMember.roles.cache.has(MUTE_ROLE_ID)) {
          console.log(`Removing Muted role from user: ${guildMember.id}`);
          await guildMember.roles.remove(MUTE_ROLE_ID);

          const releaseEmbed = new EmbedBuilder()
            .setTitle('🔓 User Unmuted')
            .setDescription(`<@${userId}> has been unmuted after serving 10 minutes.`)
            .setColor('#43BA55')
            .setTimestamp();

          if (logsChannel) {
            await logsChannel.send({ embeds: [releaseEmbed] });
          } else {
            console.error('Logs channel not found.');
          }
        }
      }, 10 * 60 * 1000);

      await interaction.reply({
        embeds: [muteEmbed],
        ephemeral: true,
      });
    } else if (action === 'mute' && option === 'no') {
      console.log('Mute No action triggered.');

      const flaggedMessage = await originalChannel?.messages.fetch(messageId).catch(() => null);

      if (flaggedMessage) {
        await flaggedMessage.delete();
      }

      const updatedEmbed = EmbedBuilder.from(reviewMessage.embeds[0]).spliceFields(0, 1, {
        name: 'Status',
        value: `Message deleted by <@${interaction.user.id}>.`,
        inline: true,
      });

      await reviewMessage.edit({ embeds: [updatedEmbed], components: [] });
      await interaction.deferUpdate();
    } else if (action === 'ignore') {
      const updatedEmbed = EmbedBuilder.from(reviewMessage.embeds[0]).spliceFields(0, 1, {
        name: 'Status',
        value: `Ignored by <@${interaction.user.id}>.`,
        inline: true,
      });

      await reviewMessage.edit({ embeds: [updatedEmbed], components: [] });
      await interaction.deferUpdate();
    }
  } catch (error) {
    console.error('Error handling interaction:', error);
    await interaction.reply({
      content: 'An error occurred while processing this action.',
      ephemeral: true,
    });
  }
});

client.once('ready', () => {
  console.log('Google Gemini AutoMod is now online!');
});

client.login('NTg4NTQxNTI5NTIyNzAwMzAx.GXG-Pw.3Pua78SsdbYRgyRPsLKiZRb3jhPryGHQv4cAhQ'); // Bot token