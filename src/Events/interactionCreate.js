const fs = require('fs');
const path = require('path');
const { EmbedBuilder } = require('discord.js');

// Path to store ignored channels data
const IGNORED_CHANNELS_PATH = path.join(__dirname, '../../data/ignoredChannels.json');

// Function to load or initialize ignored channels safely
function loadIgnoredChannels() {
  try {
    if (fs.existsSync(IGNORED_CHANNELS_PATH)) {
      const data = fs.readFileSync(IGNORED_CHANNELS_PATH, 'utf8');
      return data ? JSON.parse(data) : {}; // Parse if not empty, else initialize
    }
  } catch (error) {
    console.error('Error loading ignored channels:', error);
  }
  return {}; // Return an empty object if parsing fails
}

// Load ignored channels
let ignoredChannels = loadIgnoredChannels();

module.exports = {
  async execute(interaction) {
    const { client, commandName } = interaction;
    const command = client.commands.get(commandName);

    if (!command) return;

    // Check if the channel is ignored and if the user lacks override permissions
    if (
      ignoredChannels[interaction.channel.id] &&
      !interaction.member.permissions.has('MANAGE_GUILD')
    ) {
      const embed = new EmbedBuilder()
        .setColor('#E74C3C') // Red for restrictions
        .setTitle('Channel Restricted')
        .setDescription('⚠️ Commands are disabled in this channel for users without manage permissions.');

      return interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }

    try {
      await command.execute(interaction, client);
    } catch (err) {
      console.error(`Error executing command ${commandName}:`, err);

      const embed = new EmbedBuilder()
        .setColor('#E74C3C') // Red for errors
        .setTitle('Command Execution Error')
        .setDescription('❌ There was an error executing that command. Please try again.');

      interaction.reply({
        embeds: [embed],
        ephemeral: true,
      });
    }
  },
};
