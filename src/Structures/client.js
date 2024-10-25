const { Client, GatewayIntentBits, Collection } = require('discord.js');

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.commands = new Collection();

module.exports.start = async (config) => {
  client.config = config;

  console.log('loading commands...');
  await require('./commands.js').execute(client);
  console.log('loading handler...');
  await require('./handler.js').execute(client);
  console.log('loading events...');

  await require('./events.js').execute(client);

  // Set presence after the bot is ready
  client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Update presence with detailed activity information
    client.user.setPresence({
      status: 'dnd', // "Do Not Disturb" status
      activities: [
        {
          name: 'BobbaRP', // The game or activity name
          type: 'PLAYING', // Type of activity ('PLAYING', 'STREAMING', 'LISTENING', etc.)
          details: 'Idle in BobbaRP', // Detailed state of the activity
          state: 'Leveling up Jim', // Current status or action
          timestamps: {
            start: Date.now(), // Current timestamp for when activity started
          },
          assets: {
            largeImage: 'serverinvite', // Large image key from Discord Developer Portal
            largeText: 'BobbaRP Server', // Text shown when hovering over the large image
            smallImage: 'bobba-small', // Small image key if you have one
            smallText: 'Jim - Level 20', // Text shown when hovering over the small image
          },
          party: {
            id: 'ae488379-351d-4a4f-ad32-2b9b01c91657', // Optional: Party ID
            size: [1, 5], // Optional: Current and max size of party
          },
        },
      ],
    });
  });

  // Log in to Discord
  await client.login(config.TOKEN);
};
