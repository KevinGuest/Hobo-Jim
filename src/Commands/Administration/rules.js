const { EmbedBuilder, PermissionsBitField } = require('discord.js');

module.exports = {
  data: {
    name: 'rules',
    description: 'Displays the server rules.',
  },

  async execute(interaction) {
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.Administrator)) {
      return interaction.reply({
        content: "You do not have permission to use this command.",
        ephemeral: true,
      });
    }

    const rules = [
      "**Server Rules & Information**\n*Last updated: November 30th, 2024*",
      "1. **No spamming**: Avoid spamming text channels, including command spamming.",
      "2. **No trolling**: Trolling and disruptive behavior is not allowed.",
      "3. **No advertising**: Promoting other servers or sites not affiliated with BobbaRP is prohibited.",
      "4. **Respectful interactions**: Arguments are allowed, but drama, racism, homophobia, and hate speech are strictly prohibited.",
      "5. **Privacy respect**: Do not share others' personal information, including IP addresses.",
      "6. **No doxing or DDoS talk**: Discussing doxing or DDoS will result in an immediate ban without warning.",
      "7. **Nicknames**: Avoid setting disruptive nicknames; non-compliance may result in losing nickname privileges.",
      "8. **No NSFW content**: Posting NSFW images in any channel outside of its designated #nsfw channel is forbidden.",
      "9. **No posting personal information or photos of others**: Posting any personal information or images of another person is strictly prohibited.",
      "10. **Third-party program usage**: Using third-party programs for unfair advantage is not allowed. *XMouse is an exception.*",
      "11. **Macros policy**: Simple macros (BMT/AHK) are allowed, but in-game macros are preferred.",
      "12. **Alts**: Only one alt account may be logged in at a time. Transferring items or currency between alts or by a man in the middle is prohibited.",
      "13. **No selling Bobba Coins**: Selling Bobba Coins in-game or outside the platform for real-world currency or other assets is strictly prohibited. All transactions must go through the official Bobba system. Violations may result in bans or account restrictions.",
      "**Consequences**\nViolations may result in mutes, kicks, bans, or other punishments, including IP bans or stat/economy resets."
  ];
  
    const colors = ['#FF5733', '#33FF57', '#3357FF', '#FF33A8', '#FFC300', '#C70039', '#581845', '#900C3F', '#DAF7A6', '#FF6F61'];

    await interaction.channel.send({ content: "Here are the server rules:" });
    
    for (let i = 0; i < rules.length; i++) {
      const embed = new EmbedBuilder()
        .setColor(colors[i % colors.length])
        .setDescription(rules[i]);
      
      await interaction.channel.send({ embeds: [embed] });
    }

    // Add links at the end
    const linksEmbed = new EmbedBuilder()
      .setColor('#5DCBF0')
      .setDescription("**Links**\n[Discord](https://discord.gg/bobbarp) | [Website](https://bobba.ca/)\n\n**Terms of Service**: [bobba.ca/terms-of-service](https://bobba.ca/terms-of-service)\n**Privacy Policy**: [bobba.ca/privacy](https://bobba.ca/privacy)\n**Refund Policy**: [bobba.ca/refund](https://bobba.ca/refund)");
      
    await interaction.channel.send({ embeds: [linksEmbed] });
  },
};
