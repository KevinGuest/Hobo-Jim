const { Command } = require('discord.js-commando');

const request = require('request');
const snekfetch = require('snekfetch');
const idk = require('../../../index');
const util = require('../../../util');

module.exports = class HoloUpdateCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'bobba-update',
			group: 'admin',
			memberName: 'bobba-update',
			aliases: [],
			description: 'Update everyone who linked their account\'s nickname and roles.',
			details: 'Only administrators may use this command.',
			userPermissions: ['ADMINISTRATOR']
		});
	}

	hasPermission(msg) {
		if(!msg.guild) return this.client.isOwner(msg.author);
		return msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author); //MANAGE_MESSAGES
	}

	async run(msg, args) {
		try {
	    await idk.checkForUsers();

			return msg.channel.send({embed: {
				color: util.randomColor(),
				title: "Task completed!",
				description: `:white_check_mark: Successfully updated users - nicknames and roles.`
			}});
	  } catch (e) {
			msg.reply('Updating members nicknames and roles failed.');
			console.error(`[ERROR] Updating members nicknames and roles failed. ${e}`);
	  }
	}
};
