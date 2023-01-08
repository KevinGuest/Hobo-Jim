const { Command } = require('discord.js-commando');
const request = require('snekfetch');

const util = require('../../../util');

module.exports = class Map extends Command {
	constructor(client) {
		super(client, {
			name: 'map',
			group: 'bobba',
			memberName: 'map',
			aliases: [],
			description: 'Displays a picture of BobbaRP\'s city map.',
		});
	}

	async run(msg, args) {
		return msg.channel.send('https://bobba.ca/map.png (Old Bobba map)');
	}
};
