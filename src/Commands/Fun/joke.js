const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'joke',
        description: 'Displays a random (corny) joke.',
        dm_permission: false,
    },
    async execute(interaction) {
        await interaction.deferReply();
        try {
            const links = [
                'https://www.reddit.com/r/Jokes/top/.json?sort=top&t=day&limit=500',
                'https://www.reddit.com/r/darkjokes/top/.json?sort=top&t=day&limit=500',
                'https://www.reddit.com/r/MeanJokes/top/.json?sort=top&t=day&limit=500',
                'https://www.reddit.com/r/dadjokes/top/.json?sort=top&t=day&limit=500',
                'https://www.reddit.com/r/DirtyJokes/top/.json?sort=top&t=day&limit=500',
                'https://www.reddit.com/r/cleanjokes/top/.json?sort=top&t=day&limit=500',
                'https://www.reddit.com/r/badjokes/top/.json?sort=top&t=day&limit=500',
                'https://www.reddit.com/r/AntiJokes/top/.json?sort=top&t=day&limit=500'
            ];

            const res = await fetch(links[Math.floor(Math.random() * links.length)]);
            const data = await res.json();
            const jokes = data.data.children;

            if (jokes && jokes.length > 0) {
                const joke = jokes[Math.floor(Math.random() * jokes.length)].data;

                const embed = new EmbedBuilder()
                    .setColor(0x00FF00)
                    .setTitle(joke.title)
                    .setDescription(joke.selftext.length > 2048 ? joke.selftext.substring(0, 2045) + '...' : joke.selftext)
                    .setFooter({ text: `Posted by ${joke.author}` });

                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply("I couldn't find a joke. Please try again. 🤷");
            }
        } catch (e) {
            console.error(e);
            await interaction.editReply("A server error occurred while trying to search for a joke. Please try again. 🤷");
        }
    }
};
