const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));
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
        
        try {
            const res = await fetch(`https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=${encodeURIComponent(text)}`);
            const data = await res.json();
            const gifData = data.data;

            if (gifData && gifData.image_original_url) {
                const embed = new EmbedBuilder()
                    .setColor(7869695)
                    .setTitle("GIPHY - Search all the GIFs")
                    .setDescription(`Tags: ${text}`)
                    .setImage(gifData.image_original_url);
                
                await interaction.editReply({ embeds: [embed] });
            } else {
                await interaction.editReply("I couldn't find any GIF with your query, try being less specific? 🤔");
            }
        } catch (e) {
            console.error(e);
            await interaction.editReply("A server error occurred while trying to find a GIF. Please try again. 🤷");
        }
    }
};
