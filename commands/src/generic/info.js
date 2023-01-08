const _ = require('lodash');
const { Command } = require('discord.js-commando');

module.exports = class InfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'info',
			group: 'generic',
			memberName: 'info',
			aliases: ['about', 'uptime'],
			description: 'Displays information about the bot.',
			examples: ['info', 'about', 'uptime']
		});
	}

	async run(msg, args) {
		// Uptime
		let message = '';
		const totalSeconds = process.uptime();
		const days = Math.floor((totalSeconds % 31536000) / 86400);
		const hours = _.parseInt(totalSeconds / 3600) % 24;
		const minutes = _.parseInt(totalSeconds / 60) % 60;
		const seconds = Math.floor(totalSeconds % 60);
		message += days >= 1 ? `${days}d ` : '';
	  	message += hours < 10 ? `0${hours}:` : `${hours}:`;
	  	message += minutes < 10 ? `0${minutes}:` : `${minutes}:`;
	  	message += seconds < 10 ? `0${seconds}` : `${seconds}`;

    	return msg.channel.send({embed: {
			color: 3447003,
			description: "bobbaBot is crafted with :heart: in discord.js by jer.",
			author: {
			  "name": "bobbaBot (dev)",
			  "url": "https://bobba.ca",
			  "icon_url": "https://i.imgur.com/GN0C3aa.png"
			},

			fields: [
				{
					name: "Library",
					value: "discord.js",
					inline: true
				},
				{
					name: "Creator",
					value: "jer",
					inline: true
				},
				{
					name: "Uptime",
					value: message,
					inline: true
				},
				{
					name: "Servers",
					value: this.client.guilds.size.toLocaleString(),
					inline: true
				},
				{
					name: "Channels",
					value: this.client.channels.size.toLocaleString(),
					inline: true
				},
				{
					name: "Users",
					value: `${this.client.users.size.toLocaleString()}`,
					inline: true
					//(${msg.channel.type !== 'dm' ? msg.guild.memberCount.toLocaleString() : 0} here)
				},
				{
					name: "BobbaRP",
					value: "[bobba.ca](https://bobba.ca)",
					inline: true
				},
				{
					name: "Discord",
					value: "[discord.gg/bobbarp](https://discord.gg/jXxgQbf79e)",
					inline: true
				}
			]
			}});
    	}
};
