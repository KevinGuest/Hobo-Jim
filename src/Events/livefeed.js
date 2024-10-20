const { Client, GatewayIntentBits, TextChannel, EmbedBuilder } = require('discord.js');
const WebSocket = require('ws');

// Ensure you have these intents enabled
const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages] });

// Event when the bot is ready
client.once('ready', async () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // 'YOUR_CHANNEL_ID' with channel ID for feed
    const channelId = '1297385881295917088';
    const channel = client.channels.cache.get(channelId);

    if (!channel || !(channel instanceof TextChannel)) {
        console.error("Invalid channel ID or the channel is not a text channel.");
        return;
    }

    let websocket;
    function initSocket() {
        // Establish WebSocket connection
        websocket = new WebSocket('wss://ws.bobba.ca:8443/LiveFeed');

        websocket.onopen = () => {
            const msg = {
                EventName: "livefeed", 
                Bypass: false, 
                ExtraData: null, 
                JSON: true
            };
            websocket.send(JSON.stringify(msg));
            console.log("[WEBSOCKET] Successfully established WebSocket connection...");
        };

        websocket.onmessage = async (event) => {
            try {
                const data = JSON.parse(event.data);
                if (!data || data.length === 0) {
                    return;
                }

                for (const value of data) {
                    const { userName: Name, targetName: Target, liveAction: Action } = value;
                    let description = '';

                    if (Target === "Nobody") {
                        description = `**${Name}** ${getType(Action)}`;
                    } else {
                        description = `**${Name}** ${getType(Action)} **${Target}**`;
                    }

                    // Construct the embed with specific color based on action type
                    const embed = new EmbedBuilder()
                        .setColor(getColor(Action))
                        .setDescription(description);

                    // Send the embed to the specified Discord channel
                    await channel.send({ embeds: [embed] });
                }
            } catch (error) {
                console.error("[WEBSOCKET] Error processing live feed message:", error);
            }
        };

        websocket.onclose = () => {
            console.log('[WEBSOCKET] Disconnected from WebSocket... Attempting to reconnect in 5 seconds...');
            setTimeout(initSocket, 5000);
        };

        websocket.onerror = (error) => {
            console.error("[WEBSOCKET] Error occurred:", error);
        };
    }

    initSocket();
});

function getType(type) {
    switch (type) {
        case "kill":
            return "has killed";
        case "arrest":
            return "has arrested";
        case "escort":
            return "escorted";
        case "marry":
            return "has married";
        case "divorce":
            return "has divorced";
        case "evade":
            return "has evaded the authorities";
        case "surrender":
            return "has surrendered to the authorities";
        default:
            return "performed an unknown action";
    }
}

function getColor(type) {
    switch (type) {
        case "kill":
            return "#FF0000"; // Red for kill
        case "arrest":
            return "#5DCBF0"; // Blue for Police Related
        case "escort":
            return "#5DCBF0"; // Blue for Police Related
        case "evade":
            return "#5DCBF0"; // Blue for Police Related
        case "surrender":
            return "#5DCBF0"; // Blue for Police Related
        case "marry":
            return "#FFFFFF"; // White for marry
        case "divorce":
            return "#000000"; // Black for divorce    
    }
}
// Replace with your bot's token
client.login('NTg4NTQxNTI5NTIyNzAwMzAx.GXG-Pw.3Pua78SsdbYRgyRPsLKiZRb3jhPryGHQv4cAhQ');
