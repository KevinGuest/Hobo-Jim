const { Command } = require('discord.js-commando');
const request = require('snekfetch');

const util = require('../../../util');

module.exports = class MemeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'meme',
			group: 'fun',
			memberName: 'meme',
			aliases: [],
			description: 'Displays a random dank meme.',
			examples: ['meme']
		});
	}

	async run(msg, args) {
		try {
			const memeMsg = await msg.reply('Fetching a dank meme...');
			const JSONEmpty = obj => !obj.length || !obj.filter(a => Object.keys(a).length).length;
			const links = [
				'https://www.reddit.com/r/dankmemes/top/.json?sort=top&t=day&limit=500',
				'https://www.reddit.com/r/memes/top/.json?sort=top&t=day&limit=500',
				'https://www.reddit.com/r/MemeEconomy/top/.json?sort=top&t=day&limit=500',
				'https://www.reddit.com/r/BlackPeopleTwitter/top/.json?sort=top&t=day&limit=500'
			];

			const res = await request.get(links[Math.random() * links.length | 0]);
			if (!JSONEmpty(res.body.data.children)) {
				const memes = res.body.data.children.filter(post => post.data.preview);
				const meme = memes[Math.random() * memes.length | 0];

				return memeMsg.edit(`${msg.author}, Fetching a dank meme took **${memeMsg.createdTimestamp - msg.createdTimestamp}ms**.`, {embed: {
					color: util.randomColor(),
					title: meme.data.title,
					url: meme.data.url,
					description: meme.data.url,
					image: {
						url: meme.data.preview.images[0].source.url
					},
					footer: {
						text: `Posted by ${meme.data.author}`
					}
				}});
			} else {
				return memeMsg.edit(`${msg.author}, We couldn't find a dank meme. Please try again. :shrug:`);
			}
		} catch (e) {
			return msg.reply("A server error occurred while trying to find a dank meme. Please try again. :shrug:");
		}
	}
};
