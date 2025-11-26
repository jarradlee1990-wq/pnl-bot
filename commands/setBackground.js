const { SlashCommandBuilder } = require('discord.js');
const storage = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setbackground')
    .setDescription('Set the background for your PNL card')
    .addStringOption((option) =>
      option
        .setName('url')
        .setDescription('Image URL or "none" for solid color')
        .setRequired(true),
    ),
  async execute(interaction) {
    const url = interaction.options.getString('url');
    const backgroundUrl = url.toLowerCase() === 'none' ? null : url;

    storage.updateUserSettings(interaction.user.id, { backgroundUrl });

    await interaction.reply({
      content: backgroundUrl
        ? `Background updated to ${backgroundUrl}`
        : 'Background cleared. Using solid color.',
      ephemeral: true,
    });
  },
};


