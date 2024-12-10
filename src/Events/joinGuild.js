const { Events, EmbedBuilder, REST, Routes } = require('discord.js');
const fs = require('fs');
const path = require('path');

module.exports = {
  name: Events.GuildCreate,
  async execute(guild, client) {
    try {
      console.log(`Joined a new guild: ${guild.name} (ID: ${guild.id}) with ${guild.memberCount} members.`);

      // Register commands for the new guild
      const BOT_TOKEN = client.token; // Use the bot's token from the client
      const CLIENT_ID = client.user.id; // The bot's application/client ID

      const commandsPath = path.join(__dirname, '../Commands'); // Adjust path if needed
      const commands = [];
      const commandFiles = fs.readdirSync(commandsPath).filter(file => file.endsWith('.js'));

      for (const file of commandFiles) {
        const command = require(path.join(commandsPath, file));
        if (command.data) {
          commands.push(command.data);
        }
      }

      const rest = new REST({ version: '10' }).setToken(BOT_TOKEN);

      try {
        console.log(`Registering ${commands.length} commands for guild ${guild.id}...`);

        await rest.put(
          Routes.applicationGuildCommands(CLIENT_ID, guild.id),
          { body: commands }
        );

        console.log(`Successfully registered commands for guild ${guild.id}.`);
      } catch (error) {
        console.error(`Failed to register commands for guild ${guild.id}:`, error);
      }

      // Send welcome message
      const systemChannel = guild.systemChannel || guild.channels.cache.find(channel =>
        channel.type === 0 && // Text channels
        channel.permissionsFor(guild.members.me).has('SendMessages')
      );

      if (!systemChannel) {
        console.log('No suitable channel found to send a message.');
        return;
      }

      const welcomeEmbed = new EmbedBuilder()
        .setTitle(`🔥 Sheesh I'm moving on up in the world!`)
        .setDescription(`Good calling on adding me, **${guild.client.user.username}**.`)
        .setColor('#E07436')
        .addFields(
          { name: 'LiveFeed', value: 'Type `/setfeed` to set your livefeed channel.' },
          { name: 'Logging', value: 'Type `/setlogging` to set your logging channel.' },
          { name: 'Commands', value: 'Figure these out on your own loser!' },
          { name: 'Support', value: '[Need help? Join the main guild!](https://discord.gg/bobbarp)' }
        )
        .setThumbnail(guild.client.user.displayAvatarURL())
        .setFooter({ text: `Thank you for adding me to ${guild.name}!` })
        .setTimestamp();

      await systemChannel.send({ embeds: [welcomeEmbed] });

    } catch (error) {
      console.error(`Error sending welcome message to new guild: ${error}`);
    }
  },
};
