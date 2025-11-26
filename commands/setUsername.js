const { SlashCommandBuilder } = require('discord.js');
const storage = require('../utils/storage');

module.exports = {
  data: new SlashCommandBuilder()
    .setName('setusername')
    .setDescription('Set the username to display on your PNL card')
    .addStringOption((option) =>
      option
        .setName('name')
        .setDescription('The name to display')
        .setRequired(true),
    ),
  async execute(interaction) {
    const name = interaction.options.getString('name');
    storage.updateUserSettings(interaction.user.id, { username: name });

    await interaction.reply({
      content: `Username updated to: **${name}**`,
      ephemeral: true,
    });
  },
};

