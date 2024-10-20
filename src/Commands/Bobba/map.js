const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'map',
    description: 'Displays a picture of BobbaRP\'s city map.',
    dm_permission: false,
  },
  async execute(interaction) {
    const embed = new EmbedBuilder()
      .setColor('#00FF00')
      .setTitle('BobbaRP City Map')
      .setDescription('This is the old Bobba map')
      .setImage('https://bobba.ca/map.png');

    await interaction.reply({ embeds: [embed] });
  },
};