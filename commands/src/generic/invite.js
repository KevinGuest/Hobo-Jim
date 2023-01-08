const { Command } = require('discord.js-commando');

module.exports = class InviteCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'invite',
			group: 'generic',
			memberName: 'invite',
			aliases: [],
			description: 'Displays the links affiliated with the bot.',
			examples: ['invite']
		});
	}

	async run(msg, args) {
		return msg.channel.send({embed: {
			color: 3447003,
			thumbnail: {
				url: 'https://i.imgur.com/GN0C3aa.png'
			},

			fields: [
				{
					name: "holoBot Links",
					value: "[Add holoBot to your server](https://google.com)\n[Join Holo's server](https://discord.gg/011a6oe0IMIGxB5lT)\n[Holo's website](https://holorp.com)"
				}
			]
			}});
    }
};
