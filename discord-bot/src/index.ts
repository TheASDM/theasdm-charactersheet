import { Client, Collection, GatewayIntentBits } from 'discord.js';
import { readdirSync } from 'fs';
import { join } from 'path';
import dotenv from 'dotenv';

dotenv.config();

// Extend the Client class to include our commands collection
declare module 'discord.js' {
  export interface Client {
    commands: Collection<string, any>;
  }
}

// Create a new client instance
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Create a collection to store commands
client.commands = new Collection();

// Load command files
const commandsPath = join(__dirname, 'commands');
const commandFiles = readdirSync(commandsPath).filter(
  (file) => file.endsWith('.js') || file.endsWith('.ts')
);

for (const file of commandFiles) {
  const filePath = join(commandsPath, file);
  const command = require(filePath);

  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
    console.log(`✅ Loaded command: ${command.data.name}`);
  } else {
    console.log(
      `⚠️  [WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`
    );
  }
}

// Load event files
const eventsPath = join(__dirname, 'events');
const eventFiles = readdirSync(eventsPath).filter(
  (file) => file.endsWith('.js') || file.endsWith('.ts')
);

for (const file of eventFiles) {
  const filePath = join(eventsPath, file);
  const event = require(filePath);

  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }

  console.log(`✅ Loaded event: ${event.name}`);
}

// Login to Discord
client
  .login(process.env.DISCORD_TOKEN)
  .then(() => {
    console.log('🤖 Discord bot logged in successfully!');
  })
  .catch((error) => {
    console.error('❌ Failed to login to Discord:', error);
  });

// Handle process termination
process.on('SIGINT', () => {
  console.log('👋 Received SIGINT, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('👋 Received SIGTERM, shutting down gracefully...');
  client.destroy();
  process.exit(0);
});
