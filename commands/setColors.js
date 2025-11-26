const { SlashCommandBuilder } = require('discord.js');
const storage = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setcolors')
    .setDescription('Set the color scheme for your PNL card')
    .addStringOption((option) =>
      option
        .setName('background')
        .setDescription('Background color hex, e.g. #1a1a2e')
        .setRequired(false),
    )
    .addStringOption((option) =>
      option.setName('text').setDescription('Text color hex').setRequired(false),
    )
    .addStringOption((option) =>
      option.setName('accent').setDescription('Accent color hex').setRequired(false),
    ),
  async execute(interaction) {
    const backgroundColor = interaction.options.getString('background');
    const textColor = interaction.options.getString('text');
    const accentColor = interaction.options.getString('accent');

    if (!backgroundColor && !textColor && !accentColor) {
      await interaction.reply({
        content: 'Provide at least one color to update.',
        ephemeral: true,
      });
      return;
    }

    const updates = {};
    if (backgroundColor) updates.backgroundColor = backgroundColor;
    if (textColor) updates.textColor = textColor;
    if (accentColor) updates.accentColor = accentColor;

    storage.updateUserSettings(interaction.user.id, updates);

    await interaction.reply({ content: 'Colors updated.', ephemeral: true });
  },
};


