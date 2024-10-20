const { EmbedBuilder } = require("discord.js");

module.exports = {
  data:{
    name: "invite",
    description:('Displays the links affiliated with the bot.'),
    dm_permissions: "0",
  },
  async execute(interaction) {
    try {
      await interaction.reply({
        embeds: [
          {
            color: 3447003,
            thumbnail: {
              url: 'https://sniped.gg/uploads/opWeBzeofYk121czJ101IJRAutqTlWToLW0Sj7iN.gif',
            },
            fields: [
              {
                name: 'Hobo Jim',
                value:
                  '[Add Hobo Jim to your server](https://google.com)\n[Join Bobba\'s Discord Server](https://discord.gg/bobbarp)\n[Bobba\'s website](https://bobba.ca)',
              },
            ],
          },
        ],
      });
    } catch (error) {
      console.error('Error executing invite command:', error);
      await interaction.reply({ content: 'There was an error while executing this command!', ephemeral: true });
    }
  },
};
