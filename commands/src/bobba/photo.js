const { Command } = require('discord.js-commando');
const request = require('snekfetch');

const util = require('../../../util');

module.exports = class PhotoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'photo',
			group: 'bobba',
			memberName: 'photo',
			aliases: [],
			description: 'Displays a random photo published on https://bobba.ca/community/photos.',
			examples: ['photo']
		});
	}

	async run(msg, args) {
		try {
			const photoMsg = await msg.reply('Fetching a random photo...');

			const res = await request.get('https://bobba.ca/api/extradata/photos');
			const photo = res.body[Math.random() * res.body.length | 0];

			const date = new Date(photo.time * 1000);
			const dateString = `${date.getDate()}-${date.getMonth()+1}-${date.getFullYear()}`

			return photoMsg.edit(`:white_check_mark: ${msg.author}, Fetching a random Bobba photo took **${photoMsg.createdTimestamp - msg.createdTimestamp}ms**.`, {embed: {
				color: util.randomColor(),
				description: `This photo was taken by ${photo.creator_name} on ${dateString}`,
				author: {
					name: photo.creator_name,
					url: `https://bobba.ca/character/${photo.creator_name}`,
					icon_url: `https://habbo.com/habbo-imaging/avatarimage?user=${photo.creator_name}&headonly=1&size=l`
				},
				image: {
					url: photo.url
				}
			}});
		} catch (e) {
			return msg.reply("A server error occurred while trying to find a random photo. Please try again. :shrug:");
		}
	}
};
