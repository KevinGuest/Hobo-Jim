const { EmbedBuilder, ApplicationCommandOptionType } = require('discord.js');

module.exports = {
  data: {
    name: 'map',
    description: 'Displays map-related information or sections.',
    options: [
      {
        name: 'type',
        description: 'The type of map information to display (image, turfs, corporations, miscellaneous).',
        type: ApplicationCommandOptionType.String,
        required: true,
        choices: [
          { name: 'Image', value: 'image' },
          { name: 'Turfs', value: 'turfs' },
          { name: 'Corporations', value: 'corporations' },
          { name: 'Miscellaneous', value: 'miscellaneous' },
        ],
      },
    ],
  },

  async execute(interaction) {
    const type = interaction.options.getString('type');

    const tamara = await interaction.client.users.fetch('977742507142156308');
    const avatarURL = tamara.displayAvatarURL({ dynamic: true, size: 32 });

    let embed;

    if (type === 'image') {
      embed = new EmbedBuilder()
        .setColor('#E87E2C')
        .setTitle('BobbaRP City Map')
        .setDescription('This is the old Bobba map.')
        .setImage('https://bobba.ca/map.png');
    } else if (type === 'turfs') {
      embed = new EmbedBuilder()
        .setColor('#E33232')
        .setTitle('Turfs')
        .setDescription(
          '- **Turf by Strip Club (9):** Taxi to 4 and go up  \n' +
          '- **Turf by Hospital (8):** Taxi to 8 and then go down  \n' +
          '- **Turf by Church (7):** Taxi to 5 and go down  \n' +
          '- **Turf by Court/Salon (24):** Taxi to 10 and go up'
        )
        .setFooter({ text: 'Tamara Maps', iconURL: avatarURL });
    } else if (type === 'corporations') {
      embed = new EmbedBuilder()
        .setColor('#5EB6D1')
        .setTitle('Corporations')
        .setDescription(
          '1. **Life Invader (1)**  \n2. **Hospital (2)**  \n3. **BBJ (20)**  \n' +
          '4. **Bank (21)**  \n5. **Factory (23)**  \n6. **LAPD (25)**  \n' +
          '7. **Casino (32)**  \n8. **Ammunation (33)**'
        )
        .setFooter({ text: 'Tamara Maps', iconURL: avatarURL });
    } else if (type === 'miscellaneous') {
      embed = new EmbedBuilder()
        .setColor('#43BA55')
        .setTitle('Miscellaneous')
        .setDescription(
          '1. **Clothing (3)**  \n2. **Strip Club (4)**  \n3. **Church (5)**  \n' +
          '4. **Job Center (6)**  \n5. **Farm (11)**  \n6. **Event Lobby (22)**  \n' +
          '7. **Salon (40)**  \n8. **Nuke Station (27)**  \n9. **Gym (31)**  \n' +
          '10. **Court Outside (10)**  \n11. **Court Inside (39)**'
        )
        .setFooter({ text: 'Tamara Maps', iconURL: avatarURL });
    } else {
      return interaction.reply({
        content: 'Invalid type specified. Please choose from image, turfs, corporations, or miscellaneous.',
        ephemeral: true,
      });
    }

    await interaction.reply({ embeds: [embed] });
  },
};
