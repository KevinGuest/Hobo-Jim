const { RichEmbed } = require('discord.js');
const { Command } = require('discord.js-commando');

module.exports = class RulesCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'rules',
			group: 'admin',
			memberName: 'rules',
			aliases: ['sendrules'],
			description: 'Outputs the rules in a text channel..',
			details: 'Only administrators may use this command.',
			userPermissions: ['ADMINISTRATOR']
		});
	}

	hasPermission(msg) {
		if (!msg.guild) return this.client.isOwner(msg.author);
		return msg.member.hasPermission('ADMINISTRATOR') || this.client.isOwner(msg.author); //MANAGE_MESSAGES
	}

	async run(msg, args) {
		const channel = msg.guild.channels.find(x => x.name === 'rules');
		if (channel !== null) {
			channel.send("", {embed: {
				color: 15743312,
				title: "Rule 1",
				description: "Do not spam the text channels (this goes for commands too)."
			}});

			channel.send("", {embed: {
				color: 16098851,
				title: "Rule 2",
				description: "Do not troll."
			}});

			channel.send("", {embed: {
				color: 16312092,
				title: "Rule 3",
				description: "Do not advertise for another Discord server or website that isn't associated, affiliated nor endorsed with HoloRP."
			}});

			channel.send("", {embed: {
				color: 4373294,
				title: "Rule 4",
				description: "You are allowed to argue/have beef with others as long it doesn't lead to racism, homophobia and hate speech."
			}});

			channel.send("", {embed: {
				color: 4687826,
				title: "Rule 5",
				description: "Do not share any personal information of another person. This includes posting IP addresses and pictures of another person."
			}});

			channel.send("", {embed: {
				color: 11225329,
				title: "Rule 6",
				description: "Do not discuss about doxing and booting/ddosing. You will be permanently banned from the Discord server if you break this rule without any warning."
			}});

			channel.send("", {embed: {
				color: 11957940,
				title: "Rule 7",
				description: "Do not set annoying nicknames in the Discord server. You will have your **/nick** permission removed if you do."
			}});

			channel.send("", {embed: {
				color: 9649546,
				title: "Rule 8",
				description: "Posting NSFW images is strictly prohibited in all channels."
			}});

			channel.send("", {embed: {
				color: 4949192,
				title: "More Information",
				description: "People who break the above rules will be muted or kicked, often without warning. Repeated or serious violations will lead to a ban.\n\n• Do not ask a staff member to unban your account on HoloRP, you can appeal it on the forums. [https://forum.holorp.com/forums/ban-appeals.21/](https://forum.holorp.com/forums/ban-appeals.21/)\n• If you have a suggestion, post them in <#353164535693312012> or on the forums. [https://forum.holorp.com/forums/suggestions-feedback.22/](https://forum.holorp.com/forums/suggestions-feedback.22/)\n• If you're experiencing any problems while playing HoloRP, post them in <#404945747541229578> or on the forums. [https://forum.holorp.com/forums/bug-reports.7/](https://forum.holorp.com/forums/bug-reports.7/)"
			}});
			return msg.reply(`Success. :thumbsup:`);
		} else {
			return msg.channel.send(`Oh no! The text channel 'rules' does not exist. :shrug:`);
		}
	}
};
