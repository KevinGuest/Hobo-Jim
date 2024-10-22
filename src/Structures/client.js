const { Client, GatewayIntentBits, Collection } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
  presence: {
    activities: [
      {
        name: "BobbaRP", // Name of the activity
        type: 0, // 0 is for "Playing"
        state: "Playing Solo", // Custom state
        details: "Idle", // Details about the activity
        timestamps: {
          start: 1507665886, // Start timestamp (in epoch time)
          end: 1507665886, // End timestamp (in epoch time)
        },
        assets: {
          largeImage: "serverinvite", // Large image key (from the developer portal)
          largeText: "bobba.ca", // Tooltip for large image
          smallImage: "bobba-large", // Small image key (if you have one)
          smallText: "Jim - Level 20", // Tooltip for small image
        },
      },
    ],
    status: "dnd", // Bot status (can be "online", "idle", "dnd")
  },
});

client.commands = new Collection();

module.exports.start = async (config) => {
  client.config = config;

  console.log("loading commands...");
  await require("./commands.js").execute(client);
  console.log("loading handler...");
  await require("./handler.js").execute(client);
  console.log("loading events...");
  await require("./events.js").execute(client);
  await client.login(config.TOKEN);
};
