const { EmbedBuilder } = require('discord.js');
const https = require('https');

module.exports = {
  data: {
    name: 'meme',
    description: 'Displays a random dank meme.',
    dm_permission: false,
  },
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const links = [
        'https://www.reddit.com/r/dankmemes/top/.json?sort=top&t=day&limit=500',
        'https://www.reddit.com/r/memes/top/.json?sort=top&t=day&limit=500',
        'https://www.reddit.com/r/MemeEconomy/top/.json?sort=top&t=day&limit=500',
        'https://www.reddit.com/r/BlackPeopleTwitter/top/.json?sort=top&t=day&limit=500'
      ];

      const url = links[Math.floor(Math.random() * links.length)];

      // Set custom headers, including User-Agent
      const options = {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; MemeBot/1.0; +http://localhost)',
        },
      };

      https.get(url, options, (res) => {
        let data = '';

        res.on('data', (chunk) => {
          data += chunk;
        });

        res.on('end', async () => {
          try {
            // Check if the response is HTML (error page) instead of JSON
            if (data.trim().startsWith('<')) {
              throw new Error('Received an HTML response instead of JSON. Reddit might be blocking this request.');
            }

            const result = JSON.parse(data);

            if (result && result.data && result.data.children && result.data.children.length > 0) {
              const memes = result.data.children.filter(
                (post) => post.data.preview && post.data.preview.images && post.data.preview.images.length > 0
              );

              if (memes.length > 0) {
                const meme = memes[Math.floor(Math.random() * memes.length)];
                const memeData = meme.data;

                const embed = new EmbedBuilder()
                  .setColor('#E33232')
                  .setTitle(memeData.title || 'Untitled')
                  .setURL(`https://reddit.com${memeData.permalink}`)
                  .setDescription(memeData.selftext || memeData.url)
                  .setImage(memeData.preview.images[0].source.url.replace(/&amp;/g, '&'))
                  .setFooter({ text: `Posted by ${memeData.author || 'Unknown'}` });

                await interaction.editReply({ embeds: [embed] });
              } else {
                await interaction.editReply({ content: 'We couldn\'t find a dank meme. Please try again. :shrug:' });
              }
            } else {
              await interaction.editReply({ content: 'We couldn\'t find a dank meme. Please try again. :shrug:' });
            }
          } catch (parseError) {
            console.error('Error parsing JSON response:', parseError);
            await interaction.editReply({ content: 'There was an error processing the response. Please try again. :shrug:' });
          }
        });
      }).on('error', async (error) => {
        console.error('HTTPS Request Error:', error);
        await interaction.editReply({ content: 'A server error occurred while trying to find a dank meme. Please try again. :shrug:' });
      });
    } catch (error) {
      console.error('Unexpected error:', error);
      await interaction.editReply({ content: 'A server error occurred while trying to find a dank meme. Please try again. :shrug:' });
    }
  },
};
