const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { EmbedBuilder } = require('discord.js');

module.exports = {
  data: {
    name: 'copypasta',
    description: 'Displays a random copypasta.',
    dm_permission: false,
  },
  async execute(interaction) {
    await interaction.deferReply();

    try {
      const res = await fetch('https://www.reddit.com/r/copypasta/top/.json?sort=top&t=day&limit=500');
      const data = await res.json();
      if (data.data && data.data.children.length > 0) {
        const randomPost = data.data.children[Math.floor(Math.random() * data.data.children.length)];
        const copypastaText = randomPost.data.selftext;

        const embed = new EmbedBuilder()
          .setColor(0x00FF00)
          .setTitle(randomPost.data.title)
          .setDescription(copypastaText.length > 2048 ? copypastaText.substring(0, 2045) + '...' : copypastaText)
          .setFooter({ text: `Posted by ${randomPost.data.author}` });

        await interaction.editReply({ embeds: [embed] });
      } else {
        await interaction.editReply('We couldn\'t find a copypasta at this time. Please try again later. :shrug:');
      }
    } catch (error) {
      console.error(error);
      await interaction.editReply('A server error occurred while trying to fetch a copypasta. Please try again. :shrug:');
    }
  },
};
