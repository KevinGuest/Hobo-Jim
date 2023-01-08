const { RichEmbed } = require('discord.js');
const { Command } = require('discord.js-commando');

module.exports = class PurgeCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'purge',
			group: 'bobba',
			memberName: 'purge',
			aliases: ['purge', 'delete'],
			description: 'Embeds the text you provide.',
			details: 'Only administrators may use this command.',
			userPermissions: ['ADMINISTRATOR'],
			args: [
                {
                    key: 'amount',
                    prompt: 'How many messages do you want the bot to delete?',
                    type: 'integer'
                }
            ]
		});
	}

	hasPermission(msg) {
		if(!msg.guild) return this.client.isOwner(msg.author);
		return msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author); //MANAGE_MESSAGES
	}

	async run(msg, { amount }) {
		await msg.channel.fetchMessages({limit: amount + 1}).then(messages => msg.channel.bulkDelete(messages));
		return null;
	}
};
