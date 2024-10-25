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

    // Check if the user has the required permissions
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

    // Confirmation message in an embed
    const embed = new EmbedBuilder()
      .setColor('#43BA55') // Green for success
      .setTitle('Channel Unignored')
      .setDescription(`✅ Commands are now enabled in <#${targetChannel.id}>.`);

    interaction.reply({
      embeds: [embed],
      ephemeral: true,
    });

    // Save the updated ignored channels list
    fs.writeFileSync(IGNORED_CHANNELS_PATH, JSON.stringify(ignoredChannels, null, 2));
  },
};
