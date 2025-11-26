const { SlashCommandBuilder } = require('discord.js');
const storage = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setavatar')
    .setDescription('Set your profile picture for the PNL card')
    .addStringOption((option) =>
      option
        .setName('url')
        .setDescription('URL of the image (square recommended)')
        .setRequired(true),
    ),
  async execute(interaction) {
    const url = interaction.options.getString('url');
    // Basic validation could be added here
    storage.updateUserSettings(interaction.user.id, { avatarUrl: url });

    await interaction.reply({
      content: `Avatar updated!`,
      ephemeral: true,
    });
  },
};

