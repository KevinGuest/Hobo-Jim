const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
  data: {
    name: 'map',
    description: 'Displays map-related information or sections.',
    options: [
      {
        name: 'type',
        description: 'The type of map information to display (city or sewers).',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: 'City', value: 'city' },
          { name: 'Sewers', value: 'sewers' },
        ],
      },
    ],
  },

  async execute(interaction) {
    const type = interaction.options.getString('type');

    const tamara = await interaction.client.users.fetch('278627940403773441');
    const avatarURL = tamara.displayAvatarURL({ dynamic: true, size: 32 });

    let embed;

    if (type === 'city') {
      embed = new EmbedBuilder()
        .setColor('#E87E2C')
        .setTitle('BobbaRP')
        .setDescription('City - Queens, New York')
        .setImage('https://game.bobba.ca/final.png')
        .setFooter({ text: 'Made by Zane', iconURL: avatarURL });
    } else if (type === 'sewers') {
      embed = new EmbedBuilder()
      .setColor('#43BA55')
      .setTitle('BobbaRP')
      .setDescription('Sewers - Queens, NY.')
      .setImage('https://game.bobba.ca/sewers.png')
      .setFooter({ text: 'Made by Zane', iconURL: avatarURL });
    } else {
      return interaction.reply({
        content: 'Invalid type specified. Please choose from city, or sewers',
        ephemeral: true,
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
