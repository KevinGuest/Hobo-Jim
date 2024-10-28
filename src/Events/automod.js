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

// Initialize OpenAI with the API key
const openai = new OpenAI({
  apiKey: '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', // Replace this string with your actual OpenAI API key
});

const LOG_CHANNEL_ID = '1286176037398384702'; // Replace with your log channel ID
const excludedRoles = ["Discord Moderator", "Bobba Staff", "Developers", "Administrators"];
const addressPattern = /\d{1,6}\s(?:[A-Za-z0-9#]+\s){1,4}(?:Avenue|Ave|Street|St|Road|Rd|Boulevard|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Square|Sq|Trail|Trl|Parkway|Pkwy|Commons)/i;

// Queue to handle messages to be deleted
const deleteQueue = [];

// Function to process the delete queue with a small delay
async function processDeleteQueue() {
  while (deleteQueue.length > 0) {
    const { message } = deleteQueue.shift();

    try {
      await message.delete();
      await logViolation(message);
      await notifyUser(message); // Notify the user about the deletion
      await delay(500); // Delay of 500ms between deletions to avoid rate limits
    } catch (error) {
      if (error.code === 10008) {
        console.warn(`Message not found (it may have already been deleted): ${message.id}`);
      } else {
        console.error('Error deleting message:', error);
      }
    }
  }
}

// Function to notify the user why their message was deleted
async function notifyUser(message) {
  message.channel.send({
    content: `${message.author}, your message was removed for violating server rules.`,
    allowedMentions: { users: [message.author.id] }
  });
}

// Delay function to avoid rapid API requests
function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Logging Function for Detected Violations
async function logViolation(message) {
  const logChannel = message.guild.channels.cache.get(LOG_CHANNEL_ID);
  if (logChannel) {
    const embed = new EmbedBuilder()
      .setTitle('🚨 Server Violation')
      .setColor('#E74C3C')
      .addFields(
        { name: 'User', value: message.author.tag, inline: true },
        { name: 'Channel', value: message.channel.toString(), inline: true },
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

  const hasExcludedRole = message.member.roles.cache.some(role => excludedRoles.includes(role.name));
  if (hasExcludedRole) return;

  if (addressPattern.test(message.content)) {
    deleteQueue.push({ message });
    processDeleteQueue();
    return;
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        { role: "system", content: "You are a content moderator. Strictly monitor for any hate speech, explicit content, doxing, or malicious intent. Especially focus on detecting messages that contain extreme racism, incitements of violence against racial or ethnic groups, or statements suggesting harm or death to specific groups." },
        { role: "user", content: message.content }
      ],
    });

    const result = response.choices[0].message.content.trim().toLowerCase();

    if (result.includes("yes")) {
      deleteQueue.push({ message });
      processDeleteQueue();
    }
  } catch (error) {
    console.error('Error detecting message content:', error);
  }
});

client.login('NTg4NTQxNTI5NTIyNzAwMzAx.GXG-Pw.3Pua78SsdbYRgyRPsLKiZRb3jhPryGHQv4cAhQ'); // Replace with your bot token
