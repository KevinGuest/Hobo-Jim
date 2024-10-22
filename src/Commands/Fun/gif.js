const fetch = (...args) => import('node-fetch').then(({ default: fetch }) => fetch(...args));
const { EmbedBuilder } = require('discord.js');

module.exports = {
    data: {
        name: 'gif',
        description: 'Displays a random GIF with a specified query.',
        options: [
            {
                type: 3, // STRING type
                name: 'text',
                description: 'The text for which to search for a GIF',
                required: true
            }
        ],
        dm_permission: false,
    },
    async execute(interaction) {
        const text = interaction.options.getString('text');
        await interaction.deferReply();

        const apiKey = '4cmtYLfLf7NlZcLbVO1d35V99jxsA8LG'; // Replace with your new API key

        try {
            const res = await fetch(`https://api.giphy.com/v1/gifs/random?api_key=${apiKey}&tag=${encodeURIComponent(text)}&rating=pg`);
            const data = await res.json();

            if (data && data.data && data.data.images && data.data.images.original) {
                const gifUrl = data.data.images.original.url;
                const embed = new EmbedBuilder()
                    .setColor('#43BA55')
                    .setTitle("Here's your GIF!")
                    .setDescription(`Query: ${text}`)
                    .setImage(gifUrl)
                    .setFooter({ text: 'Powered by GIPHY' });
                
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply("I couldn't find any GIF with your query, try being less specific? 🤔");
            }
        } catch (e) {
            console.error('Error fetching GIF:', e);
            await interaction.editReply("A server error occurred while trying to find a GIF. Please try again. 🤷");
        }
    }
};
