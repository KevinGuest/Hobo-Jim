const { Command } = require('discord.js-commando');
const request = require('snekfetch');

const util = require('../../../util');

module.exports = class CopypastaCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'copypasta',
			group: 'fun',
			memberName: 'copypasta',
			aliases: [],
			description: 'Displays a random copypasta.',
			examples: ['copypasta']
		});
	}

	async run(msg, args) {
		try {
			const copypastaMsg = await msg.reply('Searching for a copypasta...');
			const JSONEmpty = obj => !obj.length || !obj.filter(a => Object.keys(a).length).length;
			const links = [
				'https://www.reddit.com/r/copypasta/top/.json?sort=top&t=day&limit=500'
			];

			const res = await request.get(links[Math.random() * links.length | 0]);
			if (!JSONEmpty(res.body.data.children)) {
				const joke = res.body.data.children[Math.random() * res.body.data.children.length | 0];

				return copypastaMsg.edit(`${msg.author}, Searching for a copypasta took **${copypastaMsg.createdTimestamp - msg.createdTimestamp}ms**.`, {embed: {
					color: util.randomColor(),
					title: joke.data.title,
					description: joke.data.selftext.toString().length > 2048 ? joke.data.selftext.toString().substring(0, 2048) : joke.data.selftext,
					footer: {
						text: `Posted by ${joke.data.author}`
					}
				}});
			} else {
				return copypastaMsg.edit(`${msg.author}, We couldn't search for a copypasta. Please try again. :shrug:`);
			}
		} catch (e) {
			return msg.reply("A server error occurred while trying to search for a copypasta. Please try again. :shrug:");
		}
	}
};
