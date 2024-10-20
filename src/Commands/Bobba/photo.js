const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'photo',
    description: 'Displays a random photo published on https://bobba.ca/community/photos.',
    dm_permission: false,
  },
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const url = 'https://bobba.ca/api/extradata/photos';
      const res = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.3',
          'Accept': 'application/json',
        }
      });

      // Adjusting content-type check to be more flexible
      if (res.headers.get('content-type') && res.headers.get('content-type').includes('application/json')) {
        const photos = await res.json();

        if (photos && photos.length > 0) {
          const photo = photos[Math.floor(Math.random() * photos.length)];

          const date = new Date(photo.time * 1000);
          const dateString = `${date.getDate()}-${date.getMonth() + 1}-${date.getFullYear()}`;

          const embed = new EmbedBuilder()
            .setColor('#00FF00')
            .setDescription(`This photo was taken by ${photo.creator_name} on ${dateString}`)
            .setAuthor({
              name: photo.creator_name,
              url: `https://bobba.ca/character/${photo.creator_name}`,
              iconURL: `https://habbo.com/habbo-imaging/avatarimage?user=${photo.creator_name}&headonly=1&size=l`
            })
            .setImage(photo.url);

          await interaction.editReply({ embeds: [embed] });
        } else {
          await interaction.editReply({ content: 'We couldn\'t find a random photo. Please try again. :shrug:' });
        }
      } else {
        console.error('Unexpected response content type:', res.headers.get('content-type'));
        console.log('Server Response:', await res.text()); // Log response to see what's returned
        await interaction.editReply({ content: 'The server returned an unexpected response. Please try again later. :shrug:' });
      }
    } catch (error) {
      console.error('Unexpected error:', error);
      await interaction.editReply({ content: 'A server error occurred while trying to find a random photo. Please try again. :shrug:' });
    }
  },
};
