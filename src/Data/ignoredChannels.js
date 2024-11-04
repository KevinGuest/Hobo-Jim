const fs = require('fs');
const path = require('path');

const IGNORED_CHANNELS_PATH = path.join(__dirname, 'ignoredChannels.json');

function loadIgnoredChannels() {
  try {
    if (fs.existsSync(IGNORED_CHANNELS_PATH)) {
      const data = fs.readFileSync(IGNORED_CHANNELS_PATH, 'utf8');
      return data ? JSON.parse(data) : {};
    }
  } catch (error) {
    console.error('Error loading ignored channels:', error);
  }
  return {};
}

function saveIgnoredChannels(channels) {
  try {
    fs.writeFileSync(IGNORED_CHANNELS_PATH, JSON.stringify(channels, null, 2));
  } catch (error) {
    console.error('Error saving ignored channels:', error);
  }
}

let ignoredChannels = loadIgnoredChannels();

module.exports = {
  getIgnoredChannels: () => ignoredChannels,
  toggleIgnoredChannel: (channelId) => {
    if (ignoredChannels[channelId]) {
      delete ignoredChannels[channelId];
    } else {
      ignoredChannels[channelId] = true;
    }
    saveIgnoredChannels(ignoredChannels);
    return ignoredChannels[channelId] ? 'disabled' : 'enabled';
  },
};
