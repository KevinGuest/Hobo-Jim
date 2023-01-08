const { Command } = require('discord.js-commando');
const request = require('snekfetch');

module.exports = class GifCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'gif',
			group: 'fun',
			memberName: 'gif',
			aliases: [],
			description: 'Displays a random GIF with a specified query.',
			examples: ['gif'],
			args: [
                {
                    key: 'text',
                    prompt: 'What text would you like the bot to show?',
                    type: 'string'
                }
            ]
		});
	}

	async run(msg, { text }) {
		try {
			const res = await request.get('https://api.giphy.com/v1/gifs/random?api_key=dc6zaTOxFJmzC&tag=' + text);
			const JSONEmpty = obj => !obj.length || !obj.filter(a => Object.keys(a).length).length;

			if (!JSONEmpty([res.body.data]))
			{
				return msg.channel.send({embed: {
						color: 7869695,
						title: "GIPHY - Search all the GIFs",
						description: `Tags: ${text}`,
						image: {
							url: res.body.data.image_original_url
						}
					}});
		  } else {
				return msg.reply("I couldn't find any GIF with your query, try being less specific? :thinking:");
			}
		} catch (e) {
			return msg.reply("A server error occurred while trying to find a GIF. Please try again. :shrug:");
		}
	}
};
