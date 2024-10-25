const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

// Path to store ignored channels data
const IGNORED_CHANNELS_PATH = path.join(__dirname, '../../../src/data/ignoredChannels.json');

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

    // Check if the user has the required permissions
    if (!interaction.member.permissions.has('MANAGE_CHANNELS')) {
      return interaction.reply({
        content: 'You do not have permission to use this command!',
        ephemeral: true,
      });
    }

    // Toggle the channel in the ignoredChannels list
    if (ignoredChannels[targetChannel.id]) {
      delete ignoredChannels[targetChannel.id];
      interaction.reply(`✅ Commands are now enabled in <#${targetChannel.id}>.`);
    } else {
      ignoredChannels[targetChannel.id] = true;
      interaction.reply(`🚫 Commands are now disabled in <#${targetChannel.id}>.`);
    }

    // Save the updated ignored channels list
    fs.writeFileSync(IGNORED_CHANNELS_PATH, JSON.stringify(ignoredChannels, null, 2));
  },
};
