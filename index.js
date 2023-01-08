const { RichEmbed } = require('discord.js');
const { CommandoClient } = require('discord.js-commando');
const request = require('request');
const snekfetch = require('snekfetch');
const path = require('path');
const util = require('./util');
const cleverbot = require('cleverbot.io');
const holoapi = require('./extensions/holoapi')

let bot = new cleverbot('ODU5NzA5Mjk3ODk3NzY2OTEz.YNworQ.cLOc0M3r4cKu3mZStwOdPC86yCI');

const client = new CommandoClient({
    commandPrefix: '.',
    defaultCooldown: 10000,
    unknownCommandResponse: false,
    owner: '281212872220999682',
    disableEveryone: true,
    fetchAllMembers: true
});

async function updateBotStatus() {
    try {
        client.user.setStatus('dnd');
    	client.user.setActivity(`${client.users.size} members | bobba.ca`, { type: 'WATCHING' });
    } catch (e) {

    }
}

async function checkMembers() {
    try {
        const users = await holoapi.getMembers();

        Object.keys(users).forEach(async(user) => {
            if (client.users.exists('id', users[user].discord_user_id)) {
                const member = await holoapi.getMember('281212872220999682', users[user].discord_user_id);
                let roles = member.roles;

                /*Object.keys(users[user].ranks).forEach((k) => {
                    if (users[user].ranks[k].id >= 2 && users[user].ranks[k].id <= 8) {
                        if (roles.filter(e => e === '340232627246202880').length <= 0) {
                            roles.push('340232627246202880');
                        }
                    }
                });*/

                // Give VIP role to those who are currently subscribed.
                if (users[user].is_vip) {
                    if (roles.filter(e => e === '864957362770411520').length <= 0) {
                        roles.push('864957362770411520');
                    }
                }

                //if (users[user].has_beta) {
                //    if (roles.filter(e => e === '340171013583142913').length <= 0) {
                //        roles.push('340171013583142913');
                //    }
                //}

                // Give 'holo' role to all users who linked their account.
                if (roles.filter(e => e === '864141506108456970').length <= 0) {
                    roles.push('864141506108456970');
                }

                const options = {
                    method: 'PATCH',
                    url: `https://discordapp.com/api/guilds/857134668770705438/members/${users[user].discord_user_id}`,
                    headers: {
                        'Authorization' : 'Bot ODU5NzA5Mjk3ODk3NzY2OTEz.YNworQ.cLOc0M3r4cKu3mZStwOdPC86yCI',
                        'User-Agent'    : 'DiscordBot (Bobba, v2)',
                        'Content-Type'  : 'application/json'
                    },
                    json: { nick: users[user].name, roles: roles }
                };

                request(options, (error, response, body) => {
                    if (error) throw new Error(error);
                    return body;
                });
            }
        });

        console.log(`[INFO] Successfully updated ${users.length} users - nicknames and roles.`);
    } catch (e) {
        console.error(e);
        //console.error(`[ERROR] Updating members nicknames and roles failed.`);
    }
}

client.registry
    .registerDefaultTypes()
    .registerGroups([
        ['admin', 'Administrator Commands'],
        ['generic', 'Generic Commands'],
        ['fun', 'Fun Commands'],
        ['bobba', 'BobbaRP Related Commands'],
        ['music', 'Music Commands']
    ])
    .registerDefaultGroups()
    .registerDefaultCommands({
        help: false
    })
    .registerCommandsIn(path.join(__dirname, 'commands/src'));

client.on('ready', () => {
	updateBotStatus();
    checkMembers();

    setInterval(checkMembers, 1800000);
    setInterval(updateBotStatus, 1800000);
    console.info(`[INFO] Ready to serve on ${client.guilds.size} servers for ${client.users.size} users!`);
});

client.on("error", (e) => console.error(e));
client.on("warn", (e) => console.warn(e));
//client.on("debug", (e) => console.info(e));

client.on('guildMemberAdd', (member) => {
    const embed = new RichEmbed()
    .setColor(65280)
    .setTimestamp()
    .setAuthor(member.user.tag, member.user.displayAvatarURL)
    .setFooter('User joined');

    member.guild.channels.find(x => x.name === 'member-log').send({embed});

    try {
        member.user.send({embed: {
            color: util.randomColor(),
            title: "Welcome!",
            description: "Hi! Welcome to the BobbaRP Discord server! Please link your Discord account with BobbaRP by going to this link on BobbaRP. https://bobba.ca/account/discord",
            thumbnail: {
                url: 'https://i.imgur.com/ZbkxBKY.png'
            },
            fields: [
                {
                    name: 'BobbaRP',
                    value: '[bobba.ca](https://bobba.ca)',
                    inline: true
                },
                {
                    name: 'BobbaRP Server Status',
                    value: '[status.bobba.ca](https://status.bobba.ca)',
                    inline: true
                },
                {
                    name: 'Extra Info',
                    value: 'We\'re multilingual. :heart:',
                    inline: true
                }
            ]
        }});
    } catch (err) {

    }

    console.log(`[INFO] New User '${member.user.username}' has joined the server '${member.guild.name}'.`);
});

client.on('guildMemberRemove', (member) => {
    const embed = new RichEmbed()
    .setColor(16250241)
    .setTimestamp()
    .setAuthor(member.user.tag, member.user.displayAvatarURL)
    .setFooter('User left');

    member.guild.channels.find(x => x.name === 'member-log').send({embed});
    console.log(`[INFO] User '${member.user.username}' left the server '${member.guild.name}'.`);
});

client.on('message', message => {
    if (message.author.bot) {
        return;
    }

    if (message.channel.name === 'bobbabot') {
        try {
            bot.setNick(message.author.username);
            bot.create((err, session) => {
                message.channel.startTyping();
                bot.ask(message.content.toString(), (err, response) => {
                    message.channel.send(response);
                    message.channel.stopTyping();
                });
            });
        } catch (e) {
            console.log(e);
            message.channel.send('Huh?');
            message.channel.stopTyping();
        }
    }
});

client.on('messageDelete', (messageDelete) => {
    try {
        let embed = new RichEmbed()
        .setColor(15743312)
        .setTimestamp()
        .setAuthor(messageDelete.author.tag, messageDelete.author.displayAvatarURL)
        .setDescription(`**Message sent by ${messageDelete.author} deleted in <#${messageDelete.channel.id}>**\n${messageDelete.content}`)
        .setFooter(`ID: ${messageDelete.id}`);

        if (messageDelete.attachments.size > 0) {
            let Attachment = (messageDelete.attachments).array();
            embed.setImage(Attachment[0].proxyURL);
        }

        messageDelete.guild.channels.find(x => x.name === 'message-log').send({embed});
    } catch (e) {
        console.log(e);
    }
});

client.on('messageUpdate', (oldMessage, newMessage) => {
    if (oldMessage.author.bot || newMessage.author.bot) {
        return;
    }

    if (oldMessage.content.toString() === newMessage.content.toString()) {
        return;
    }

    try {
        const embed = new RichEmbed()
        .setColor(4687826)
        .setTimestamp()
        .setAuthor(oldMessage.author.tag, oldMessage.author.displayAvatarURL)
        .setDescription(`**Message sent by ${oldMessage.author} edited in <#${oldMessage.channel.id}>**`)
        .addField('Before', `${oldMessage.content.toString()}`)
        .addField('After', `${newMessage.content.toString()}`)
        .setFooter(`ID: ${oldMessage.id}`);

        oldMessage.guild.channels.find(x => x.name === 'message-log').send({embed});
    } catch (e) {
        console.log(e);
    }
});

client.login('ODU5NzA5Mjk3ODk3NzY2OTEz.YNworQ.cLOc0M3r4cKu3mZStwOdPC86yCI');
//client.login('NDAzMzQ2NzM1MjQ3NjU0OTEy.DUF9hg.V7E-Iuc7Wic3pFRdBdip1RLjmmQ'); //dev
