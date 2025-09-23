"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const discord_js_1 = require("discord.js");
const fs_1 = require("fs");
const path_1 = require("path");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client = new discord_js_1.Client({
    intents: [
        discord_js_1.GatewayIntentBits.Guilds,
        discord_js_1.GatewayIntentBits.GuildMessages,
        discord_js_1.GatewayIntentBits.MessageContent,
    ],
});
client.commands = new discord_js_1.Collection();
const commandsPath = (0, path_1.join)(__dirname, 'commands');
const commandFiles = (0, fs_1.readdirSync)(commandsPath).filter((file) => file.endsWith('.js') || file.endsWith('.ts'));
for (const file of commandFiles) {
    const filePath = (0, path_1.join)(commandsPath, file);
    const command = require(filePath);
    if ('data' in command && 'execute' in command) {
        client.commands.set(command.data.name, command);
        console.log(`✅ Loaded command: ${command.data.name}`);
    }
    else {
        console.log(`⚠️  [WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
    }
}
const eventsPath = (0, path_1.join)(__dirname, 'events');
const eventFiles = (0, fs_1.readdirSync)(eventsPath).filter((file) => file.endsWith('.js') || file.endsWith('.ts'));
for (const file of eventFiles) {
    const filePath = (0, path_1.join)(eventsPath, file);
    const event = require(filePath);
    if (event.once) {
        client.once(event.name, (...args) => event.execute(...args));
    }
    else {
        client.on(event.name, (...args) => event.execute(...args));
    }
    console.log(`✅ Loaded event: ${event.name}`);
}
client
    .login(process.env.DISCORD_TOKEN)
    .then(() => {
    console.log('🤖 Discord bot logged in successfully!');
})
    .catch((error) => {
    console.error('❌ Failed to login to Discord:', error);
});
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
//# sourceMappingURL=index.js.map