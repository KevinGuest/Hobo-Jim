const { EmbedBuilder } = require('discord.js');
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

module.exports = {
    data: {
        name: 'stats',
        description: 'Displays user stats information on a specific user.',
        options: [
            {
                type: 3, // STRING type
                name: 'username',
                description: 'The username for the bot to show.',
                required: true
            }
        ],
        dm_permission: false,
    },
    async execute(interaction) {
        const username = interaction.options.getString('username');

        await interaction.reply(`Fetching information on ${username}...`);

        try {
            // Fetch data using node-fetch
            const res = await fetch(`https://bobba.ca/api/public/users/${username}`);
            const userData = await res.json();

            // Check if the user was found
            if (userData.hasOwnProperty('error')) {
                return interaction.editReply(`:no_entry: The user '${username}' was not found.`);
            }

            // Construct the embed with the user data
            const embed = new EmbedBuilder()
                .setColor('#1DC249')  // Box Color
                .setTitle(userData.name)
                .setDescription(`Bobba information on ${userData.name}:`)
                .setThumbnail(`https://habbo.com/habbo-imaging/avatarimage?figure=${userData.figureString}&gesture=sml&direction=4&head_direction=3&headonly=1&size=l`)
                .addFields(
                    { name: "Username", value: `[${userData.name}](https://bobba.ca/character/${userData.name})`, inline: true },
                    { name: "Created At", value: userData.memberSince, inline: true },
                    { name: "Last Seen", value: userData.lastSeen, inline: true },
                    { name: "Motto", value: userData.motto, inline: true },
                    { name: "Gender", value: userData.gender === "M" ? "Male" : "Female", inline: true },
                    { name: "Online", value: userData.online.toString(), inline: true },
                    { name: "Gang", value: userData.roleplay.gang !== null ? userData.roleplay.gang : "No Gang", inline: true },
                    { name: "Job", value: userData.roleplay.job !== null ? userData.roleplay.job : "No Job", inline: true },
                    { name: "Kills", value: userData.roleplay.kills.toLocaleString(), inline: true },
                    { name: "Deaths", value: userData.roleplay.deaths.toLocaleString(), inline: true },
                    { name: "Punches Thrown", value: userData.roleplay.punchesThrown.toLocaleString(), inline: true },
                    { name: "Punches Received", value: userData.roleplay.punchesReceived.toLocaleString(), inline: true },
                    { name: "Melee Hits", value: userData.roleplay.meleeHits.toLocaleString(), inline: true },
                    { name: "Bombs Thrown", value: userData.roleplay.bombsThrown.toLocaleString(), inline: true },
                    { name: "Damage Dealt", value: userData.roleplay.damageDealt.toLocaleString(), inline: true },
                    { name: "Damage Received", value: userData.roleplay.damageReceived.toLocaleString(), inline: true },
                    { name: "Married To", value: userData.roleplay.married?.spouse || "Not Married", inline: true },
                    { name: "Married Since", value: userData.roleplay.married?.date === 0 ? "Never" : userData.roleplay.married?.date || "N/A", inline: true },
                    { name: "City Visits", value: userData.roomVisits.toLocaleString(), inline: true },
                    { name: "Online Time", value: userData.onlineTime, inline: true }
                );

            await interaction.editReply({ content: '', embeds: [embed] });
        } catch (e) {
            // Handle specific error scenarios
            if (e.response && e.response.status === 404) {
                await interaction.editReply(`:no_entry: The user '${username}' was not found.`);
            } else {
                console.error(e);
                await interaction.editReply(`A server error occurred while trying to find '${username}'. Please try again. :shrug:`);
            }
        }
    }
};
