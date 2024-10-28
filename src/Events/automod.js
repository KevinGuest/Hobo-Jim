const { Client, GatewayIntentBits, EmbedBuilder } = require('discord.js');
const OpenAI = require("openai");

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.GuildMembers,
  ],
});

// Initialize OpenAI directly with the API key
const openai = new OpenAI({
    apiKey: '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', // Replace this string with your actual OpenAI API key
});

const LOG_CHANNEL_ID = '1286176037398384702'; // Replace with your log channel ID

// Patterns and Keywords to Detect for Discord's Moderation Standards
const addressPattern = /\d{1,6}\s(?:[A-Za-z0-9#]+\s){1,4}(?:Avenue|Ave|Street|St|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Square|Sq|Trail|Trl|Parkway|Pkwy|Commons)/i;
const explicitKeywords = ["nude", "nudity", "explicit", "porn", "nsfw", "adult content", "violence"];
const hateSpeechKeywords = ["racist", "sexist", "homophobic", "hate speech", "slur", "offensive"];

// Logging Function for Detected Violations
async function logViolation(message, reason) {
  const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
  if (logChannel) {
    const embed = new EmbedBuilder()
      .setTitle('Content Violation Detected')
      .setColor('#E74C3C')
      .addFields(
        { name: 'User', value: message.author.tag, inline: true },
        { name: 'Channel', value: message.channel.toString(), inline: true },
        { name: 'Reason', value: reason, inline: true },
        { name: 'Message Content', value: message.content || '*(Message had no content)*', inline: false }
      )
      .setTimestamp()
      .setThumbnail(message.author.displayAvatarURL({ dynamic: true }));

    logChannel.send({ embeds: [embed] });
  }
}

client.once('ready', () => {
  console.log(`OpenAI AutoMod has started!`);
});

client.on('messageCreate', async (message) => {
  if (message.author.bot) return;

  // 1. Check for common address patterns
  if (addressPattern.test(message.content)) {
    await message.delete();
    message.channel.send(`${message.author}, sharing personal information is against server rules.`);
    await logViolation(message, 'Personal Information (Address) Detected');
    return;
  }

  // 2. Check for explicit content keywords
  if (explicitKeywords.some(keyword => message.content.toLowerCase().includes(keyword))) {
    await message.delete();
    message.channel.send(`${message.author}, explicit content is not allowed on this server.`);
    await logViolation(message, 'Explicit Content Detected');
    return;
  }

  // 3. Check for hate speech keywords
  if (hateSpeechKeywords.some(keyword => message.content.toLowerCase().includes(keyword))) {
    await message.delete();
    message.channel.send(`${message.author}, hate speech is not tolerated on this server.`);
    await logViolation(message, 'Hate Speech Detected');
    return;
  }

  // 4. Check for other types of harmful content using OpenAI for contextual moderation
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a content moderator. Detect if this message includes hate speech, explicit content, doxing, or malicious intent." },
        { role: "user", content: message.content }
      ],
    });

    const result = response.choices[0].message.content.trim().toLowerCase();

    if (result.includes("yes")) {
      await message.delete();
      message.channel.send(`${message.author}, your message was removed for violating server rules.`);
      await logViolation(message, 'Detected by Hobo Jim');
    }
  } catch (error) {
    console.error('Error detecting message content:', error);
  }
});

client.login('NTg4NTQxNTI5NTIyNzAwMzAx.GXG-Pw.3Pua78SsdbYRgyRPsLKiZRb3jhPryGHQv4cAhQ'); // Replace with your bot token
