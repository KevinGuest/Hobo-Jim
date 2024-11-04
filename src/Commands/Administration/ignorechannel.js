const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const IGNORED_CHANNELS_PATH = path.join(__dirname, '../../../src/data/ignoredChannels.json');
const LOG_CHANNEL_ID = '1286176037398384702'; // Replace with your actual log channel ID

// Function to safely load or initialize ignored channels
function loadIgnoredChannels() {
  try {
    if (fs.existsSync(IGNORED_CHANNELS_PATH)) {
      const data = fs.readFileSync(IGNORED_CHANNELS_PATH, 'utf8');
      return data ? JSON.parse(data) : {}; // Parse if not empty, otherwise initialize
    }
  } catch (error) {
    console.error('Error loading ignored channels:', error);
  }
  return {}; // Return an empty object if file read or parse fails
}

// Function to save ignored channels to file
function saveIgnoredChannels(channels) {
  try {
    ensureDirectoryExists(IGNORED_CHANNELS_PATH);
    fs.writeFileSync(IGNORED_CHANNELS_PATH, JSON.stringify(channels, null, 2));
  } catch (error) {
    console.error('Error saving ignored channels:', error);
  }
}

// Ensure directory exists before saving
function ensureDirectoryExists(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

// Load or initialize ignored channels
let ignoredChannels = loadIgnoredChannels();

module.exports = {
  data: {
    name: 'ignorechannel',
    description: 'Toggle command usage in a channel (mods and managers not affected).',
    options: [
      {
        name: 'target',
        description: 'The channel to toggle command usage',
        type: 7, // Channel type
        required: true,
      },
    ],
  },

  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('target');

    // Check if the channel is ignored and user has permissions
    if (ignoredChannels[interaction.channel.id]) {
      return interaction.reply({
        content: 'Commands are disabled in this channel.',
        ephemeral: true,
      });
    }

    if (!interaction.member.permissions.has('MANAGE_CHANNELS')) {
      return interaction.reply({
        content: 'You do not have permission to use this command!',
        ephemeral: true,
      });
    }

    // Reload ignored channels to ensure consistency
    ignoredChannels = loadIgnoredChannels();

    let action = '';
    let embed;

    // Toggle the channel in the ignoredChannels list
    if (ignoredChannels[targetChannel.id]) {
      delete ignoredChannels[targetChannel.id];
      action = 'enabled';

      embed = new EmbedBuilder()
        .setColor(0x00FF00) // Green color for enabling
        .setTitle('Channel Toggled')
        .setDescription(`✅ Commands are now enabled in <#${targetChannel.id}>.`)
        .setTimestamp();
    } else {
      ignoredChannels[targetChannel.id] = true;
      action = 'disabled';

      embed = new EmbedBuilder()
        .setColor(0xFF0000) // Red color for disabling
        .setTitle('Channel Toggled')
        .setDescription(`🚫 Commands are now disabled in <#${targetChannel.id}>.`)
        .setTimestamp();
    }

    interaction.reply({ embeds: [embed], ephemeral: true });
    saveIgnoredChannels(ignoredChannels);

    // Log the command usage in the #logs channel
    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor(0x3498db) // Blue color for log entries
        .setTitle('Ignore Channel Command Used')
        .addFields(
          { name: 'Action', value: action.charAt(0).toUpperCase() + action.slice(1), inline: true },
          { name: 'Target Channel', value: `<#${targetChannel.id}>`, inline: true },
          { name: 'Executed By', value: `<@${interaction.user.id}>`, inline: true },
        )
        .setTimestamp();

      logChannel.send({ embeds: [logEmbed] });
    } else {
      console.error(`Log channel with ID ${LOG_CHANNEL_ID} not found.`);
    }
  },
};
