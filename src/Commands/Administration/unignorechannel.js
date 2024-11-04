const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');
const IGNORED_CHANNELS_PATH = path.join(__dirname, '../../../src/data/ignoredChannels.json');
const LOG_CHANNEL_ID = '1286176037398384702'; // The ID of your log channel

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
    name: 'unignorechannel',
    description: 'Re-enable command usage in a previously ignored channel.',
    options: [
      {
        name: 'target',
        description: 'The channel to re-enable command usage',
        type: 7, // Channel type
        required: true,
      },
    ],
  },

  async execute(interaction) {
    const targetChannel = interaction.options.getChannel('target');

    // Reload ignoredChannels to ensure it's up-to-date
    ignoredChannels = loadIgnoredChannels();

    if (!interaction.member.permissions.has('MANAGE_CHANNELS')) {
      return interaction.reply({
        content: 'You do not have permission to use this command!',
        ephemeral: true,
      });
    }

    // Check if the channel is actually ignored
    if (!ignoredChannels[targetChannel.id]) {
      const embed = new EmbedBuilder()
        .setColor('#E74C3C') // Red color for error
        .setTitle('Channel Not Ignored')
        .setDescription(`Commands are already enabled in <#${targetChannel.id}>.`);

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    // Remove the channel from ignored channels
    delete ignoredChannels[targetChannel.id];

    const embed = new EmbedBuilder()
      .setColor('#43BA55') // Green for success
      .setTitle('Channel Unignored')
      .setDescription(`✅ Commands are now enabled in <#${targetChannel.id}>.`);

    interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });

    // Save the updated ignored channels list
    saveIgnoredChannels(ignoredChannels);

    // Log the command usage in the #logs channel
    const logChannel = interaction.guild.channels.cache.get(LOG_CHANNEL_ID);
    if (logChannel) {
      const logEmbed = new EmbedBuilder()
        .setColor(0x3498db) // Blue color for log entries
        .setTitle('Unignore Channel Command Used')
        .addFields(
          { name: 'Action', value: 'Enabled Commands', inline: true },
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
