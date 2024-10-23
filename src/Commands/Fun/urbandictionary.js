const { EmbedBuilder } = require('discord.js');
const https = require('https');

module.exports = {
  data: {
    name: 'define',
    description: 'Displays a definition of a word from the Urban Dictionary.',
    options: [
      {
        type: 3, // STRING type for the argument
        name: 'word',
        description: 'The word you want to define.',
        required: true // This ensures the word argument is mandatory
      }
    ],
    dm_permission: false,
  },
  async execute(interaction) {
    const word = interaction.options.getString('word'); // This should fetch the word

    if (!word) {
      await interaction.reply({ content: 'You must provide a word to define.', ephemeral: true });
      return;
    }

    await interaction.deferReply();

    const url = `https://api.urbandictionary.com/v0/define?term=${encodeURIComponent(word)}`;

    https.get(url, (res) => {
      let data = '';

      res.on('data', (chunk) => {
        data += chunk;
      });

      res.on('end', async () => {
        try {
          const result = JSON.parse(data);

          if (result && result.list && result.list.length > 0) {
            const entry = result.list[Math.floor(Math.random() * result.list.length)];

            const cleanDefinition = entry.definition.replace(/\[|\]/g, '');
            const cleanExample = entry.example.replace(/\[|\]/g, '');

            const embed = new EmbedBuilder()
              .setColor('#E33232')
              .setTitle(`Word: ${entry.word}`)
              .setDescription(`**Definition**:\n${cleanDefinition}\n\n**Example**:\n${cleanExample}`)
              .setFooter({ text: `Posted by ${entry.author}` });

            await interaction.editReply({ embeds: [embed] });
          } else {
            await interaction.editReply({ content: `No definition found for '${word}'. Try another word! 🤷‍♂️` });
          }
        } catch (parseError) {
          console.error('Error parsing JSON response:', parseError);
          await interaction.editReply({ content: 'There was an error processing the response. Please try again. 🤷‍♂️' });
        }
      });
    }).on('error', async (error) => {
      console.error('HTTPS Request Error:', error);
      await interaction.editReply({ content: 'A server error occurred while trying to find the definition. Please try again. 🤷‍♂️' });
    });
  },
};
