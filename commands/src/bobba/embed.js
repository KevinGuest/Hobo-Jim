const { RichEmbed } = require('discord.js');
const { Command } = require('discord.js-commando');

module.exports = class EmbedCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'embed',
			group: 'bobba',
			memberName: 'embed',
			description: 'Embeds the text you provide.',
            examples: ['embed Embeds are cool.'],
			details: 'Only administrators may use this command.',
			guarded: true,
			args: [
                {
                    key: 'text',
                    prompt: 'What text would you like the bot to embed?',
                    type: 'string'
                }
            ]
		});
	}

	hasPermission(msg) {
		if(!msg.guild) return this.client.isOwner(msg.author);
		return msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author);
	}

	async run(msg, { text }) {
        const embed = new RichEmbed()
            .setDescription(text)
            .setAuthor(msg.author.username, msg.author.displayAvatarURL)
            .setColor(0x00AE86)
            .setTimestamp();
        return msg.embed(embed);
    }
};
