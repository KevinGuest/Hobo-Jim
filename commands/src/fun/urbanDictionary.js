const { Command } = require('discord.js-commando');
const request = require('snekfetch');

const util = require('../../../util');

module.exports = class UrbanDictionaryCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'define',
			group: 'fun',
			memberName: 'define',
			aliases: [],
			description: 'Displays a definition of a word from the urban dictionary.',
			examples: ['define']
		});
	}

	async run(msg, args) {
		try {
			const defineMsg = await msg.reply(`Defining ${args}...`);
			const JSONEmpty = obj => !obj.length || !obj.filter(a => Object.keys(a).length).length;

			const res = await request.get('https://api.urbandictionary.com/v0/define?term=' + args);
			if (!JSONEmpty(res.body.list)) {
				const word = res.body.list[Math.random() * res.body.list.length | 0];

				return defineMsg.edit(`${msg.author}, Finding the definition for '${args}' took **${defineMsg.createdTimestamp - msg.createdTimestamp}ms**.`, {embed: {
					color: util.randomColor(),
					title: `Word: ${word.word}`,
					description: `**Definition**:\n${word.definition}\n\n**Example**:\n${word.example}`,
					footer: {
						text: `Posted by ${word.author}`
					}
				}});
			} else {
				return defineMsg.edit(`${msg.author}, We couldn't find the definition for ${args}. Please try again. :shrug:`);
			}
		} catch (e) {
			console.log(e);
			return msg.reply(`A server error occurred while trying to find the definition for ${args}. Please try again. :shrug:`);
		}
	}
};
