require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Client, GatewayIntentBits, Collection, REST, Routes } = require('discord.js');

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  console.log('Current Env Vars:', Object.keys(process.env));
  throw new Error('Missing DISCORD_TOKEN or CLIENT_ID in environment variables.');
}

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Dynamically load slash command modules
client.commands = new Collection();
const commandsPath = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsPath).filter((file) => file.endsWith('.js'));
const slashCommands = [];

for (const file of commandFiles) {
  const command = require(path.join(commandsPath, file));
  client.commands.set(command.data.name, command);
  slashCommands.push(command.data.toJSON());
}

// Register slash commands globally
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('Refreshing application (/) commands...');
    console.log('Commands to register:', slashCommands.map(c => c.name).join(', '));
    await rest.put(Routes.applicationCommands(process.env.CLIENT_ID), { body: slashCommands });
    console.log('Slash commands registered.');
  } catch (error) {
    console.error('Failed to register commands:', error);
  }
})();

client.once('ready', () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  const command = client.commands.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    console.error(error);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply('There was an error executing this command.');
    } else {
      await interaction.reply({
        content: 'There was an error executing this command.',
        ephemeral: true,
      });
    }
  }
});

client.login(process.env.DISCORD_TOKEN);


