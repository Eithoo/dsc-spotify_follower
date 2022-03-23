const fs = require('fs');
const config = require('./config.js');
const { inspect } = require('util');
const { findSpotifyInPresence } = require('./utils.js');
const Discord = require('discord.js');
const bot = new Discord.Client({
    intents: [Discord.Intents.FLAGS.GUILDS, Discord.Intents.FLAGS.GUILD_MESSAGES, Discord.Intents.FLAGS.GUILD_INTEGRATIONS, Discord.Intents.FLAGS.GUILD_VOICE_STATES, Discord.Intents.FLAGS.DIRECT_MESSAGES, Discord.Intents.FLAGS.GUILD_PRESENCES,
	
	Discord.Intents.FLAGS.GUILD_MEMBERS], // <-- just for now, remove it later
    partials: ['CHANNEL'], // Required to receive DMs
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
let traditionalCommands;

process.on('uncaughtException', function(err) {
    console.log(err);
	const embed = embeds.jsError('uncaughtException', err, true);
	bot.supportServer.channels.errors.send({ embeds: [embed] })
	.catch(error => console.log('no teraz to się zjebało na amen', error));
});

const { Player, Utils: playerUtils } = require('discord-music-player');
const player = new Player(bot, {
    leaveOnEmpty: true,
	leaveOnEnd: false,
	leaveOnStop: false, //https://github.com/SushiBtw/discord-music-player/issues/248#issuecomment-974780715
});
bot.musicPlayer = player;
bot.musicPlayerUtils = playerUtils;

bot.specialFunctions = {};
bot.specialFunctions.sendCommandsToDiscord = async () => {
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

bot.specialFunctions.loadTraditionalCommands = () => {
	if (traditionalCommands !== undefined) 
		bot.removeListener('messageCreate', traditionalCommands);
	delete require.cache[require.resolve('./commands/traditional.js')];
	traditionalCommands = require('./commands/traditional.js');
	bot.on('messageCreate', traditionalCommands);
	console.log('✔ załadowano plik komend tradycyjnych: traditional.js');
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
			follow: supportServer.channels.cache.get(config.supportServer.followLogsChannel),
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
	bot.specialFunctions.sendCommandsToDiscord().then(commandsFileNames => {
		console.log('✔ Komendy załadowane.');
		const embed = embeds.commandsLoaded(commandsFileNames.global, commandsFileNames.supportServer);
		bot.supportServer.channels.logs.send({ embeds: [embed] });
	});
	bot.specialFunctions.loadTraditionalCommands();
	//const guilds = await bot.guilds.fetch();
	const guilds = bot.guilds.cache;
	guilds.each(guild => {
		console.log(guild);
		guild.me.setNickname(null)
		.catch(error => {
		//	console.log(error);
			bot.supportServer.channels.guildsErrors.send({ embeds: [embeds.noServerPermissions(guild, 'CHANGE_NICKNAME')] })
		});
	})
});

bot.on('interactionCreate', async interaction => {
	if ( !(interaction.isCommand() || interaction.isContextMenu() || interaction.isButton() || interaction.isSelectMenu() || interaction.isAutocomplete() ) ) return;
	if (!interaction.inGuild()) {
		const lang = {
			pl: ['Nie działam na DM!', 'Odpowiadanie na DM zostało celowo wyłączone. Jeśli chcesz  uzyskać pomocy, dołącz do serwera support - link jest w opisie bota.'],
			en: ['It won\'t work in here!', 'If you need help with the bot, join support server - invite is in **About Me**.']
		}
		const text = interaction.locale == 'pl' ? lang.pl : lang.en;
		const embed = embeds.error(text[0], text[1], config.colors.orange);
		return interaction.reply({ embeds: [embed] });
	}
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
		const content = interaction.locale == 'pl' ? 'Wystąpił nieznany błąd podczas wykonywania tej komendy. Jeśli błąd się powtarza, zgłoś to do twórcy bota.' : 'An unknown error occurred while executing this command. If the bug persists, please report it to the bot developer.'
		return interaction.reply({ content: content, ephemeral: true });
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
		bot.supportServer.channels.guildsErrors.send({ embeds: [embeds.noServerPermissions(guild, 'VIEW_AUDIT_LOGS')] })
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
});

bot.spotify_following = new Discord.Collection();
bot.on('presenceUpdate', async (oldPresence, newPresence) => {
	const following = bot.spotify_following.get(newPresence.guild.id);
	if (!following) return false;
	if (newPresence.userId != following.following.id) return false; // to usunac jesli ma lapac wszystkich na serwerze
	const oldspotify = oldPresence ? findSpotifyInPresence(oldPresence) : false;
	const spotify = findSpotifyInPresence(newPresence);
	if (oldspotify == spotify) {
		console.log('spotify nie zmienione');
		return false;
	}
	if (!spotify) {
		const embed = embeds.basic('PAUZA', `**Użytkownik:** ${newPresence.user}\n**Serwer:** ${newPresence.member.guild.name}\n**Kanał:** #${following.voiceChannel.name}`);
		bot.supportServer.channels.follow.send({ embeds: [embed] });
		console.log('zapauzowane, tu zrobic tez pauze muzyki');
		const queue = bot.musicPlayer.getQueue(newPresence.guild.id);
		if (queue && queue.isPlaying) {
			queue.setPaused(true);
			const currentNick = newPresence.guild.me.nickname;
			let nick = `⏸ ${currentNick}`;
			if (nick.length >= 29) nick = nick.substring(0, 29) + '...';
			if (currentNick) {
				newPresence.guild.me.setNickname(nick)
				.catch(error => bot.supportServer.channels.guildsErrors.send({ embeds: [embeds.noServerPermissions(newPresence.guild, 'CHANGE_NICKNAME')] }));
			}
			// tu jakis  timer ze za 3 minuty bez aktywnosci ma wylaczyc
		}
		return false;
	}
	console.log(newPresence);
	console.log('spotify zmienione');
	const embed = embeds.spotifyPresenceStart(newPresence.user, following.by, following.voiceChannel, spotify);
	const message = bot.supportServer.channels.follow.send({ embeds: [embed] });
	const currentSeconds = Math.floor((new Date() - spotify.timestamps.start)/1000);
	const title = spotify.details;
	const artists = spotify.state;
	const spotifyId = spotify.syncId;
	bot.forcePlaySongFromSpotify(following.voiceChannel, title, artists, currentSeconds, spotifyId, [message]);
});

bot.forcePlaySongFromSpotify = async (voiceChannel, title, artists, time, spotifyId, messagesPromise) => {
	try {
		const guildId = voiceChannel.guildId;
		// if is playing stop playing bo sie memory leak robi
		let queue = bot.musicPlayer.getQueue(guildId);
		//bot.musicPlayer.deleteQueue(guildId);
		if (queue) {// tu czyszczenie kolejki zamiast usuwac bo sie pierdoli
			const song = queue.nowPlaying;
			console.log(queue.data?.spotifySongId, '---', spotifyId);
			console.log(queue);
			if (queue.data?.spotifySongId == spotifyId) {
		//	if (song.name == title) {
				queue.seek(time > 3 ? (time-3)*1000 : time*1000);
				queue.setPaused(false);
				console.log('RESUMING');
				if (messagesPromise) {
					messagesPromise.map(async messagePromise => {
						const message = await messagePromise;
						const embed = message.embeds[0];
						embed.setDescription(
							embed.description
								.replace('[tu zaraz link]', Discord.Formatters.hyperlink('[link]', queue.data.URL, title)) 
								.replace('[link there but wait a second]', Discord.Formatters.hyperlink('[link]', queue.data.URL, title)) 
						);
						message.edit({ embeds: [embed] })
						.catch(error => bot.supportServer.channels.guildsErrors.send({ embeds: [embeds.noServerPermissions(voiceChannel.guild, 'SEND_MESSAGE')] }));
					});
				}
				let nick = `${title} - ${artists}`;
				if (nick.length >= 29) nick = nick.substring(0, 29) + '...';
				voiceChannel.guild.me.setNickname(nick)
				.catch(error => { console.log(error); bot.supportServer.channels.guildsErrors.send({ embeds: [embeds.noServerPermissions(voiceChannel.guild, 'CHANGE_NICKNAME')] }) });
				return;
			} else {
				console.log('QUEUE EXISTS, RECREATING NEW ONE')
				if (queue.isPlaying) queue.stop();
				queue = bot.musicPlayer.createQueue(guildId);
				console.log(queue);
			//	queue.clearQueue();
			//	queue.setPaused(false);
			}
		} else
			queue = bot.musicPlayer.createQueue(guildId);
		await queue.join(voiceChannel);
		const song = await bot.musicPlayerUtils.search(`${title} ${artists} - Topic`, undefined, queue, 5);
		if (!song || song.length == 0) {
			// log na kanal ze nie znaleziono danej piosenki
			return false;
		}
		console.log(song);
		const URL = time > 1 ? `${song[0].url}&t=${time+3}` : `${song[0].url}`;
		queue?.setData({spotifySongId: spotifyId, URL: URL});
		let nick = `${title} - ${artists}`;
		if (nick.length >= 29) nick = nick.substring(0, 29) + '...';
		voiceChannel.guild.me.setNickname(nick)
		.catch(error => { console.log(error); bot.supportServer.channels.guildsErrors.send({ embeds: [embeds.noServerPermissions(voiceChannel.guild, 'CHANGE_NICKNAME')] }) });
		await queue.play(URL, { timecode: true })
			.catch(error => {
				console.log(error);
				const embed = embeds.error('play', 'Nie można odtworzyć wybranego filmu. Prawdopodobne przyczyny: film jest prywatny, niepubliczny lub oznaczony jako +18')
					.addField('**Tytuł**', title, true)
					.addField('**Wykonawcy**', artists, true)
					.addField('**URL**', URL)
					.addField('**Serwer**', `${voiceChannel.guild.name} (${voiceChannel.guildId})`);
				bot.supportServer.channels.guildsErrors.send({ embeds: [embed]});
				voiceChannel.guild.me.setNickname(null)
				.catch(error => bot.supportServer.channels.guildsErrors.send({ embeds: [embeds.noServerPermissions(voiceChannel.guild, 'CHANGE_NICKNAME')] }));
			});
		if (messagesPromise) {
			messagesPromise.map(async messagePromise => {
				const message = await messagePromise;
				const embed = message.embeds[0];
				embed.setDescription(
					embed.description
					.replace('[tu zaraz link]', Discord.Formatters.hyperlink('[link]', URL, title)) 
					.replace('[link there but wait a second]', Discord.Formatters.hyperlink('[link]', queue.data.URL, title)) 
				);
				message.edit({ embeds: [embed] })
				.catch(error => bot.supportServer.channels.guildsErrors.send({ embeds: [embeds.noServerPermissions(voiceChannel.guild, 'SEND_MESSAGE')] }));
			});
		}
	} catch (error) {
		console.log(error);
		const embed = embeds.jsError('bot.forcePlaySongFromSpotify()', error, true);
		bot.supportServer.channels.errors.send({ embeds: [embed] });
		// tu jeszcze wysylanie na kanal z logami na poszczegolnym serwerze, ale bez parametru full
		bot.forcePlaySongFromSpotify(voiceChannel, title, artists, time, spotifyId, messagesPromise); // https://i.imgflip.com/52xeoo.png
	} 
}
// zapytania w bazie zrobic w osobnym module

bot.login(config.token);