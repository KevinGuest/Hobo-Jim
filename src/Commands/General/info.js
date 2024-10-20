const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'info',
    description: 'Displays information about the bot.',
    dm_permission: false,
  },
  async execute(interaction) {
    try {
      const uptime = process.uptime();
      const days = Math.floor(uptime / (3600 * 24));
      const hours = Math.floor((uptime % (3600 * 24)) / 3600);
      const minutes = Math.floor((uptime % 3600) / 60);
      const seconds = Math.floor(uptime % 60);
      const formattedUptime = `${days}d ${hours}h ${minutes}m ${seconds}s`;

      const infoEmbed = new EmbedBuilder()
        .setColor(0x3498db) // Updated color to be within the valid range
        .setTitle('Bot Information')
        .setDescription('Hobo Jim is crafted with :heart: in discord.js by Ghost.')
        .addFields(
          { name: 'Version', value: '1.0.0', inline: true },
          { name: 'Library', value: 'discord.js', inline: true },
          { name: 'Creator', value: 'K', inline: true },
          { name: 'Uptime', value: formattedUptime, inline: true },
          { name: 'Servers', value: interaction.client.guilds.cache.size.toLocaleString(), inline: true },
          { name: 'Channels', value: interaction.client.channels.cache.size.toLocaleString(), inline: true },
          { name: 'Users', value: `${interaction.client.users.cache.size.toLocaleString()}`, inline: true },
          { name: 'BobbaRP', value: '[Website](https://bobba.ca)', inline: true },
          { name: 'Discord', value: '[Server Invite](https://discord.gg/bobbarp)', inline: true }
        )
        .setAuthor({
          name: 'Hobo Jim',
          url: 'https://bobba.ca',
          iconURL: 'https://sniped.gg/uploads/opWeBzeofYk121czJ101IJRAutqTlWToLW0Sj7iN.gif'
        });

      await interaction.reply({
        embeds: [infoEmbed],
      });
    } catch (error) {
      console.error('Error executing info command:', error);
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true }).catch(() => {
        interaction.followUp({ content: 'There was an error while executing this command!', ephemeral: true });
      });
    }
  },
};
