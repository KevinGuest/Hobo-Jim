const { Client, GatewayIntentBits, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } = require('discord.js');
const OpenAI = require("openai");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Initialize OpenAI with the API key
const openai = new OpenAI({
  apiKey: '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',
});

const REVIEW_CHANNEL_ID = '1297419386654556200'; // Review channel ID
const excludedRoles = ["Administrators", "Developers", "Bobba Staff", "Discord Moderators"]; // Roles to exclude

// Patterns and Keywords to Detect for Discord's Moderation Standards
const addressPattern = /\d{1,6}\s(?:[A-Za-z0-9#]+\s){1,4}(?:Avenue|Ave|Street|St|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Square|Sq|Trail|Trl|Parkway|Pkwy|Commons)/i;
const explicitKeywords = ["porn", "nsfw", "adult content"];
const hateSpeechKeywords = ["kill", "genocide", "exterminate"];

// Function to send a message to the review channel with buttons
async function sendToReviewChannel(message, reason) {
  const reviewChannel = message.guild.channels.cache.get(REVIEW_CHANNEL_ID);
  if (!reviewChannel) return;

  const embed = new EmbedBuilder()
    .setTitle('🚨 Message Flagged')
    .setColor('#E67E22')
    .setDescription(`Message from ${message.author} in ${message.channel} flagged for: **${reason}**`)
    .addFields(
      { name: 'Status', value: 'Review: Pending', inline: true }, // Initial status as pending
      { name: 'Message Content', value: message.content || '*(Message had no content)*', inline: false }
    )
    .setTimestamp()
    .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

  const actionRow = new ActionRowBuilder()
    .addComponents(
      new ButtonBuilder()
        .setCustomId(`delete_${message.channel.id}_${message.id}`) // Include original channel and message ID
        .setLabel('Delete')
        .setStyle(ButtonStyle.Danger),
      new ButtonBuilder()
        .setCustomId(`ignore_${message.channel.id}_${message.id}`) // Include original channel and message ID
        .setLabel('Ignore')
        .setStyle(ButtonStyle.Secondary)
    );

  // Send the embed and buttons to the review channel, without extra text above it
  const sentMessage = await reviewChannel.send({
    embeds: [embed],
    components: [actionRow]
  });

  return sentMessage.id; // Return the review message ID for future reference
}

client.once('ready', () => {
  console.log(`OpenAI AutoMod has started!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  const hasExcludedRole = message.member.roles.cache.some(role => excludedRoles.includes(role.name));
  if (hasExcludedRole) return; // Skip processing if the user has an excluded role

  // 1. Check for common address patterns
  if (addressPattern.test(message.content)) {
    await sendToReviewChannel(message, 'Personal Information (Address) Detected');
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

  // 4. Use OpenAI for nuanced or context-sensitive content moderation
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "You are a content moderator. Only flag messages for deletion if they contain clear hate speech, violent threats, racial slurs, or serious malicious content. Ignore non-threatening gaming terms and RPG language (e.g., 'level up', 'gym', 'strength')."
        },
        { role: "user", content: message.content }
      ],
    });

    const result = response.choices[0].message.content.trim().toLowerCase();

    if (result.includes("yes")) {
      await sendToReviewChannel(message, 'Detected by Hobo Jim');
    }
  } catch (error) {
    console.error('Error detecting message content:', error);
  }
});

// Handle button interactions for Delete and Ignore actions
client.on('interactionCreate', async interaction => {
  if (!interaction.isButton()) return;

  const [action, channelId, messageId] = interaction.customId.split('_');
  const originalChannel = interaction.guild.channels.cache.get(channelId);
  const message = await originalChannel.messages.fetch(messageId).catch(() => null);

  const reviewChannel = interaction.guild.channels.cache.get(REVIEW_CHANNEL_ID);
  const reviewMessageId = interaction.message.id;

  try {
    const reviewMessage = await reviewChannel.messages.fetch(reviewMessageId);
    let updatedEmbed;

    if (!message) {
      // Update embed with error message in the "Status" field if message is missing
      updatedEmbed = EmbedBuilder.from(reviewMessage.embeds[0])
        .spliceFields(0, 1, { name: 'Status', value: 'Error: Message could not be found or was already deleted', inline: true });
      
      await reviewMessage.edit({ embeds: [updatedEmbed], components: [] });
      return;
    }

    if (action === 'delete') {
      await message.delete();

      // Update the embed with status as "Deleted by" and the moderator's name
      updatedEmbed = EmbedBuilder.from(reviewMessage.embeds[0])
        .spliceFields(0, 1, { name: 'Status', value: `Deleted by: <@${interaction.user.id}>`, inline: true });

      await reviewMessage.edit({ embeds: [updatedEmbed], components: [] });
    } else if (action === 'ignore') {
      // Update the embed with status as "Ignored by" and the moderator's name
      updatedEmbed = EmbedBuilder.from(reviewMessage.embeds[0])
        .spliceFields(0, 1, { name: 'Status', value: `Ignored by: <@${interaction.user.id}>`, inline: true });

      await reviewMessage.edit({ embeds: [updatedEmbed], components: [] });
    }
  } catch (error) {
    console.error('Error handling button interaction:', error);
    const updatedEmbed = EmbedBuilder.from(interaction.message.embeds[0])
      .spliceFields(0, 1, { name: 'Status', value: `Error: ${error.message}`, inline: true });
    await interaction.message.edit({ embeds: [updatedEmbed], components: [] });
  }
});

client.login('NTg4NTQxNTI5NTIyNzAwMzAx.GXG-Pw.3Pua78SsdbYRgyRPsLKiZRb3jhPryGHQv4cAhQ'); // Bot token
