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

  client.once('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    client.user.setPresence({
      status: 'dnd',
      activities: [
        {
          name: 'BobbaRP',
          type: 'PLAYING',
          details: 'Idle in BobbaRP',
          state: 'Leveling up Jim',
          timestamps: {
            start: Date.now(),
          },
          assets: {
            largeImage: 'serverinvite',
            largeText: 'BobbaRP Server',
            smallImage: 'bobba-small',
            smallText: 'Jim - Level 20',
          },
          party: {
            id: 'ae488379-351d-4a4f-ad32-2b9b01c91657',
            size: [1, 5],
          },
        },
      ],
    });
  });

  await client.login(config.TOKEN);
};
