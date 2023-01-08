const { Command } = require('discord.js-commando');
const request = require('snekfetch');

const util = require('../../../util');

module.exports = class JokeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'joke',
			group: 'fun',
			memberName: 'joke',
			aliases: [],
			description: 'Displays a random (corny) joke.',
			examples: ['joke']
		});
	}

	async run(msg, args) {
		try {
			const jokeMsg = await msg.reply('Searching for a joke...');
			const JSONEmpty = obj => !obj.length || !obj.filter(a => Object.keys(a).length).length;
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

			const res = await request.get(links[Math.random() * links.length | 0]);
			if (!JSONEmpty(res.body.data.children)) {
				const joke = res.body.data.children[Math.random() * res.body.data.children.length | 0];

				return jokeMsg.edit(`${msg.author}, Searching for a joke took **${jokeMsg.createdTimestamp - msg.createdTimestamp}ms**.`, {embed: {
					color: util.randomColor(),
					title: joke.data.title,
					description: joke.data.selftext.toString().length > 2048 ? joke.data.selftext.toString().substring(0, 2048) : joke.data.selftext,
					footer: {
						text: `Posted by ${joke.data.author}`
					}
				}});
			} else {
				return jokeMsg.edit(`${msg.author}, We couldn't search for a joke. Please try again. :shrug:`);
			}
		} catch (e) {
			console.log(e);
			return msg.reply("A server error occurred while trying to search for a joke. Please try again. :shrug:");
		}
	}
};
