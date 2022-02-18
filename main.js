const fs = require('fs');
const config = require('./config.js');
const { inspect } = require('util');
const Discord = require('discord.js');
const bot = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_INTEGRATIONS, Discord.Intents.FLAGS.GUILD_VOICE_STATES],
	ws: {
		properties: {
			$browser: 'Discord iOS'
		}
	}
});
let commands;
const embeds = require('./embeds.js');
const sqlite3 = require('sqlite3');
const sqlite = require('sqlite');

const { Player } = require('discord-music-player');
const player = new Player(bot, {
    leaveOnEmpty: true,
});
bot.musicPlayer = player;

async function sendCommandsToDiscord() {
	const globalCommandsAPI = [];
	const globalCommandsFileNames = [];
	const supportServerCommandsAPI = [];
	const supportServerFileNames = [];
	commands = new Discord.Collection();
	const globalCommandFiles = fs.readdirSync('./commands/global').filter(file => file.endsWith('.js'));
	for (const file of globalCommandFiles) {
		delete require.cache[require.resolve(`./commands/global/${file}`)];
		const commandFile = require(`./commands/global/${file}`);
		const data = commandFile?.data;
		if (!data) continue; // pusty lub nieprawidlowy plik komend
		commands.set(commandFile.data.name, commandFile);
		globalCommandsAPI.push(data.toJSON());
		console.log(`✔ załadowano plik komend globalnych: ${file}`);
		globalCommandsFileNames.push(file);
	}
	bot.application?.commands.set(globalCommandsAPI);
	// uprawnien nie robie do globalnych bo tam będą i tak tylko komendy ktorych kazdy moze uzywac

	const supportServerCommandFiles = fs.readdirSync('./commands/supportServer').filter(file => file.endsWith('.js'));
	for (const file of supportServerCommandFiles) {
		delete require.cache[require.resolve(`./commands/supportServer/${file}`)];
		const commandFile = require(`./commands/supportServer/${file}`);
		const data = commandFile?.data;
		if (!data) continue; // pusty lub nieprawidlowy plik komend
		commands.set(commandFile.data.name, commandFile);
		supportServerCommandsAPI.push(data.toJSON());
		console.log(`✔ załadowano plik komend serwera support: ${file}`);
		supportServerFileNames.push(file);
	}
	const supportServerCommands = await bot.supportServer.guild?.commands.set(supportServerCommandsAPI);
//	console.log(supportServerCommands);
	for (const [commandID, command] of supportServerCommands) {
		const permissions = commands.get(command.name)?.permissions;
		if (permissions) {
			command.permissions.set({permissions});
		}
	}
	return { global: globalCommandsFileNames, supportServer: supportServerFileNames };
}

function updateActivity() {
	const guildsCount = bot.guilds.cache.size;
	const totalMembersCount = bot.guilds.cache.reduce((accumulator, guild) => accumulator + guild.memberCount, 0);
	bot.user.setActivity(`${guildsCount} servers | ${totalMembersCount} users`, { type: 'LISTENING' });
}

bot.on('ready', async () => {
	console.log(bot);
	console.log(`${bot.user.username} uruchomił się!`);
	updateActivity();
	const supportServer = bot.guilds.cache.get(config.supportServer.server);
	if (!supportServer) {
		console.log('nie znaleziono serwera support');
		bot.user.setActivity('CRITICAL ERROR SUPPORT_SERVER_MISSING', { type: 'WATCHING' });
		return false;
	}
	const supportServerData = {
		guild: supportServer,
		channels: {
			logs: supportServer.channels.cache.get(config.supportServer.logsChannel),
			errors: supportServer.channels.cache.get(config.supportServer.errorsChannel),
			guildsErrors: supportServer.channels.cache.get(config.supportServer.guildsErrorsChannel),
		}
	}
	bot.supportServer = supportServerData;
	await bot.supportServer.channels.logs.send({ embeds: [embeds.basic('STARTUP', 'Proces został uruchomiony.', config.colors.white)] });
	const DB = await sqlite.open({
		filename: './database.db',
		driver: sqlite3.Database
	});
	// napisać domyślną stukture tabel i robić CREATE TABLE IF NOT EXISTS, ale to juz bedzie w module odpowiedzialnym za baze
	if (!DB) {
		console.log('✖ Nie można połączyć się z SQLite');
		const embed = embeds.error('SQLite', 'Nie można połączyć się z bazą danych.');
		bot.supportServer.channels.errors.send({ embeds: [embed]});
		return false;
	}
	sendCommandsToDiscord().then(commandsFileNames => {
		console.log('✔ Komendy załadowane.');
		const embed = embeds.commandsLoaded(commandsFileNames.global, commandsFileNames.supportServer);
		bot.supportServer.channels.logs.send({ embeds: [embed] });
	})
});

bot.on('interactionCreate', async interaction => {
	if ( !(interaction.isCommand() || interaction.isContextMenu() || interaction.isButton() || interaction.isSelectMenu() || interaction.isAutocomplete() ) ) return;
	let commandName = interaction.commandName;
	if (interaction.isButton() || interaction.isSelectMenu()) {
		commandName = interaction.customId.split('__')[0];
	}
	const command = commands.get(commandName);
	if (!command) return;
	try {
		if (interaction.isButton() || interaction.isSelectMenu()) {
			await command.executeAction(interaction);
		} else if (interaction.isAutocomplete()) {
			await command.executeAutocomplete(interaction);
		} else {
			await command.execute(interaction);
		}
	} catch (error) {
		console.error(error);
		return interaction.reply({ content: 'Wystąpił nieznany błąd podczas wykonywania tej komendy. Jeśli błąd się powtarza, zgłoś to do twórcy bota.', ephemeral: true });
		// tutaj zobaczyc w dokumentacji jak działają te locales i zrobić polską wersje (dla locale PL) i angielską (dla kazdego innego)
	}
});

function checkPermissionsOnGuild(guild) {
	// sprawdzanie uprawnien jak czegos  brakluje to DM do ownera serwera + widomosc na serwerze support kanal errors
}

bot.on('guildCreate', async guild => {
	let user;
	if (guild.me.permissions.has('VIEW_AUDIT_LOG')) {
		const audit = await guild.fetchAuditLogs({
			limit: 1,
			type: 'BOT_ADD'
		});
		const log = audit.entries.first();
		if (log) {
			user = log.executor;
		} else {
			user = await guild.fetchOwner();
		}
	} else {
		user = await guild.fetchOwner();
		bot.supportServer.channels.guildsErrors.send({ embeds: [embeds.noPermissions(guild, 'VIEW_AUDIT_LOGS')] })
	}

	console.log(`✔ Bot został dodany do nowego serwera: ${guild.name} przez ${user.tag}`);
	const embed = await embeds.guildCreate(guild, user);
	bot.supportServer.channels.logs.send({ embeds: [embed] });
	updateActivity();
});

bot.on('guildDelete', async guild => {
	console.log(`✖ Bot został wyrzucony z serwera: ${guild.name}`);
	const embed = await embeds.guildDelete(guild);
	bot.supportServer.channels.logs.send({ embeds: [embed] });
	updateActivity();
});

bot.on('guildMemberAdd', updateActivity);
bot.on('guildMemberRemove', updateActivity);

bot.on('guildUpdate', async (oldGuild, newGuild) => {
	if (oldGuild.name != newGuild.name)
		bot.supportServer.channels.logs.send({ embeds: [embeds.guildNameChange(oldGuild, newGuild)] });
	if (oldGuild.icon != newGuild.icon)
		bot.supportServer.channels.logs.send({ embeds: [embeds.guildAvatarChange(oldGuild, newGuild)] });
})
// zapytania w bazie zrobic w osobnym module

bot.login(config.token);