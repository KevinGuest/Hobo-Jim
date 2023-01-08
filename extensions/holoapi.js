const { Structures } = require('discord.js');
const Command = require('../commands/base');

const promise = require('promise');
const request = require('request');
const snekfetch = require('snekfetch');

async function getMembers() {
	const res = await snekfetch.get('https://bobba.ca/api/private/misc/discord');
	return res.body;
}

function getMember(guildId, memberId) {
	const options = {
		method: 'GET',
		url: `https://discordapp.com/api/guilds/${guildId}/members/${memberId}`,
		headers: {
			'Authorization' : 'Bot ODU5NzA5Mjk3ODk3NzY2OTEz.YNworQ.cLOc0M3r4cKu3mZStwOdPC86yCI',
			'User-Agent'    : 'DiscordBot (bobba, v2)',
			'Content-Type'  : 'application/json'
		}
	};

	return new Promise(resolve => {
		request(options, function (error, response, body) {
			if (error) throw new Error(error);
			resolve(JSON.parse(body));
		});
	});
}

function updateMember(guildId, memberId, nickname, roles) {
	const options = {
		method: 'PATCH',
		url: `https://discordapp.com/api/guilds/${guildId}/members/${memberId}`,
		headers: {
			'Authorization' : 'Bot ODU5NzA5Mjk3ODk3NzY2OTEz.YNworQ.cLOc0M3r4cKu3mZStwOdPC86yCI',
			'User-Agent'    : 'DiscordBot (bobba, v2)',
			'Content-Type'  : 'application/json'
		},
		json: { nick: nickname, roles: roles }
	};

	request(options, function (error, response, body) {
		if (error) throw new Error(error);
		return body;
	});
}

module.exports = {
	getMembers,
	getMember,
	updateMember
};