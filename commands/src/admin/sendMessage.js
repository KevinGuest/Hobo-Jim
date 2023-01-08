const { RichEmbed } = require('discord.js');
const { Command } = require('discord.js-commando');

module.exports = class SendMessage extends Command {
	constructor(client) {
		super(client, {
			name: 'send',
			group: 'admin',
			memberName: 'send',
			aliases: ['sendmessage', 'sendm'],
			description: 'Makes a bot send a message to a channel.',
			details: 'Only administrators may use this command.',
			userPermissions: ['ADMINISTRATOR'],
			args: [
                {
                    key: 'name',
                    prompt: 'Which channel do you want to the bot to send the message in?',
                    type: 'string'
                },
								{
                    key: 'message',
                    prompt: 'Type a message for the bot to say.',
                    type: 'string'
                }
            ]
		});
	}

	hasPermission(msg) {
		if(!msg.guild) return this.client.isOwner(msg.author);
		return msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author); //MANAGE_MESSAGES
	}

	async run(msg, { name, message }) {
		const channel = msg.guild.channels.find(x => x.name === name);
		if (channel !== null) {
			channel.send(message)
			return msg.reply(`You have successfully sent a message to the #${name} text channel. :thumbsup:`);
		} else {
			return msg.channel.send(`Oh no! The text channel '${name}' does not exist. :shrug:`);
		}
	}
};
