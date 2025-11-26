const { SlashCommandBuilder, EmbedBuilder } = require('discord.js');
const storage = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('viewsettings')
    .setDescription('View your current PNL card settings'),
  async execute(interaction) {
    const settings = storage.getUserSettings(interaction.user.id);

    const embed = new EmbedBuilder()
      .setTitle('Your PNL Card Settings')
      .addFields(
        { name: 'Background URL', value: settings.backgroundUrl || 'None', inline: false },
        { name: 'Background Color', value: settings.backgroundColor, inline: true },
        { name: 'Text Color', value: settings.textColor, inline: true },
        { name: 'Accent Color', value: settings.accentColor, inline: true },
      )
      .setColor(settings.accentColor || '#00ff88');

    await interaction.reply({ embeds: [embed], ephemeral: true });
  },
};


