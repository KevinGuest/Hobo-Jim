const { EmbedBuilder, PermissionsBitField } = require("discord.js");

module.exports = {
  data: {
    name: "avatar",
    description: "Show your and other users' avatars",
    dm_permissions: "0",
    options: [
      {
        name: "user",
        description: "Choose a user",
        type: 6, // User type
        required: false,
      },
    ],
  },
  async execute(interaction) {
    // Check if the user has "View Audit Log" permission
    if (!interaction.member.permissions.has(PermissionsBitField.Flags.ViewAuditLog)) {
      return interaction.reply({
        content: "You need to be a Moderator to use this command.",
        ephemeral: true,
      });
    }

    const user = interaction.options.getUser("user") || interaction.user;

    const image = user.avatarURL({
      dynamic: true,
      format: "png",
      size: 4096,
    });

    const embed = new EmbedBuilder()
      .setTitle(user.tag)
      .setImage(image)
      .setFooter({
        text: `Requested by ${interaction.user.tag}`,
        iconURL: interaction.user.avatarURL({ format: "png" }),
      })
      .setColor("#00FFAA");

    await interaction.reply({ embeds: [embed] });
  },
};
