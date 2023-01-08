const { Command } = require('discord.js-commando');
const request = require('snekfetch');

const util = require('../../../util');

module.exports = class BobbaInfoCommand extends Command {
	constructor(client) {
		super(client, {
			name: 'bobba-info',
			group: 'bobba',
			memberName: 'bobba-info',
			aliases: [],
			description: 'Displays BobbaRP information on a specific user.',
			examples: ['bobba-info %username%'],
			args: [
                {
                    key: 'text',
                    prompt: 'Enter a BobbaRP username for the bot to show.',
                    type: 'string'
                }
            ]
		});
	}

	async run(msg, { text }) {
		try {
			const userMsg = await msg.reply(`Fetching information on ${text}...`);

			const res = await request.get('https://bobba.ca/api/public/users/' + text);
			if (res.body.hasOwnProperty('error')) {
				return userMsg.edit(`:no_entry: ${msg.author} The user '${text}' was not found.`);
			} else {
				return userMsg.edit(`${msg.author}`, {embed: {
					color: util.randomColor(),
					title: res.body.name,
					description: `BobbaRP information on ${res.body.name}:`,
					thumbnail: {
						url: `https://game.bobba.ca/habbo-imaging/avatarimage?figure=${res.body.figureString}&gesture=sml&direction=4&head_direction=3&headonly=1&size=l`
					},

					fields: [
						{
							name: "Username",
							value: `[${res.body.name}](https://bobba.ca/character/${res.body.name})`,
							inline: true
						},
						{
							name: "Created At",
							value: res.body.memberSince,
							inline: true
						},
						{
							name: "Last Seen",
							value: res.body.lastSeen,
							inline: true
						},
						{
							name: "Motto",
							value: res.body.motto,
							inline: true
						},
						{
							name: "Gender",
							value: res.body.gender == "M" ? "Male" : "Female",
							inline: true
						},
						{
							name: "Online",
							value: res.body.online,
							inline: true
						},
						{
							name: "Gang",
							value: res.body.roleplay.gang !== null ? res.body.roleplay.gang : "No Gang",
							inline: true
						},
						{
							name: "Job",
							value: res.body.roleplay.job !== null ? res.body.roleplay.job : "No Job",
							inline: true
						},
						{
							name: "Kills",
							value: res.body.roleplay.kills.toLocaleString(),
							inline: true
						},
						{
							name: "Deaths",
							value: res.body.roleplay.deaths.toLocaleString(),
							inline: true
						},
						{
							name: "Punches Thrown",
							value: res.body.roleplay.punchesThrown.toLocaleString(),
							inline: true
						},
						{
							name: "Punches Received",
							value: 0,
							inline: true
						},
						{
							name: "Melee Hits",
							value: res.body.roleplay.meleeHits.toLocaleString(),
							inline: true
						},
						{
							name: "Bombs Thrown",
							value: res.body.roleplay.bombsThrown.toLocaleString(),
							inline: true
						},
						{
							name: "Damage Dealt",
							value: res.body.roleplay.damageDealt.toLocaleString(),
							inline: true
						},
						{
							name: "Damage Received",
							value: res.body.roleplay.damageReceived.toLocaleString(),
							inline: true
						},
						{
							name: "Married To",
							value: res.body.roleplay.married.spouse,
							inline: true
						},
						{
							name: "Married Since",
							value: res.body.roleplay.married.date,
							inline: true
						},
						{
							name: "City Visits",
							value: res.body.roomVisits.toLocaleString(),
							inline: true
						},
						{
							name: "Online Time",
							value: res.body.onlineTime,
							inline: true
						}
					]
				}});
			}
		} catch (e) {
			return msg.reply(`A server error occurred while trying to find '${text}'. Please try again. :shrug:`);
		}
	}
};
