const config = require('./config.js');
const colors = config.colors;
const Discord = require('discord.js');
const { formatTime, toHHMMSS } = require('./utils.js');
const { inspect } = require('util');

let embeds = {};
embeds.basic = (title, content, color, authorimage) => {
	let embed = new Discord.MessageEmbed()
		.setColor(color || colors.blue)
		.setDescription(content)
	if (authorimage)
		embed.setAuthor({ name: title, iconURL: authorimage });
	else
		embed.setTitle(title);
	return embed;
}

embeds.error = (title, content, color) => {
	let embed = new Discord.MessageEmbed()
		.setColor(color || colors.red)
		.setAuthor({ name: title, iconURL: config.embedImages.error })
		.setDescription(content);
	return embed;
}

embeds.success = (title, content, color) => {
	let embed = new Discord.MessageEmbed()
		.setColor(color || colors.green)
		.setAuthor({ name: title, iconURL: config.embedImages.success })
		.setDescription(content);
	return embed;
}

embeds.question = (title, content, color, icon = 'orange') => {
	let embed = new Discord.MessageEmbed()
		.setColor(color || colors.yellow)
		.setAuthor({ name: title, iconURL: icon == 'orange' ? config.embedImages.questionOrange : config.embedImages.questionBlue })
		.setDescription(content);
	return embed;
}

embeds.noPermissions = (command, args) => {
	let embed = new Discord.MessageEmbed()
		.setColor(colors.red)
		.setAuthor({ name: 'Brak uprawnień', iconURL: config.embedImages.error })
		.setDescription(`Nie posiadasz uprawnień do wykonania komendy \`${command}${args ? ' ' + args : ''}\`.`)
		.setTimestamp()
	return embed;
}

embeds.syntaxError = (command, ...usage) => {
	const usageArr = usage.map(elem => `${config.prefix}${command} \`${elem}\``);
	let embed = new Discord.MessageEmbed()
		.setColor(colors.red)
		.setAuthor({ name: 'Błąd składni', iconURL: config.embedImages.error })
		.setDescription(`Składnia komendy: \n${usageArr.join('\n')}`)
		.setTimestamp();
	return embed;
}

embeds.commandsLoaded = (global, supportServer) => {
	let embed = embeds.success('Slash commands', 'Załadowano pliki komend.')
		.addField('**GLOBALNE**', global.join('\n'), true)
		.addField('**SUPPORT SERVER**', supportServer.join('\n'), true)
	return embed;
}

embeds.guildCreate = async (guild, user) => {
	const owner = await guild.fetchOwner();
	let embed = new Discord.MessageEmbed()
		.setColor(colors.green2)
		.setAuthor({ name: 'Nowy serwer', iconURL: config.embedImages.success })

		.addField('**Nazwa serwera**', guild.name, true)
		.addField('**ID**', guild.id, true)
		.addField('**Data utworzenia serwera**', Discord.Formatters.time(guild.createdAt, 'f'), true)

		.addField('**Poziom**', guild.premiumTier, true)
		.addField('**Język**', guild.preferredLocale, true)
		.addField('**Liczba użytkowników**', guild.memberCount.toString(), true)

		.addField('**Dodane przez**', `${user} (${user.tag}) (${user.id})`)
		.addField('**Właściciel serwera**', `${owner} (${owner.user.tag}) (${owner.id})`)
		.addField('**Opis serwera**', guild.description || 'nie podano')

		.setImage(guild.iconURL({ dynamic: true, size: 4096 }))
		.setTimestamp();
	return embed;
}

embeds.guildDelete = async guild => {
	let embed = new Discord.MessageEmbed()
		.setColor(colors.paleRed)
		.setAuthor({ name: 'Usunięto bota z serwera', iconURL: config.embedImages.error })

		.addField('**Nazwa serwera**', guild.name, true)
		.addField('**ID**', guild.id, true)
		.addField('**Data utworzenia serwera**', Discord.Formatters.time(guild.createdAt, 'f'), true)

		.addField('**Poziom**', guild.premiumTier, true)
		.addField('**Język**', guild.preferredLocale, true)
		.addField('**Liczba użytkowników**', guild.memberCount.toString(), true)

		.addField('**Data dołączenia bota na serwer**', Discord.Formatters.time(guild.jointedAt, 'f'))
		.addField('**Właściciel serwera**', `<@${guild.ownerId}> (${guild.ownerId})`)
		.addField('**Opis serwera**', guild.description || 'nie podano')

		.setImage(guild.iconURL({ dynamic: true, size: 4096 }))
		.setTimestamp();
	return embed;
}

embeds.noServerPermissions = (guild, permission) => {
	let embed = new Discord.MessageEmbed()
		.setColor(colors.paleRed)
		.setAuthor({ name: 'Brak uprawnień', iconURL: config.embedImages.error })
		.addField('**Nazwa serwera**', guild.name, true)
		.addField('**ID**', guild.id, true)
		.addField('**Brakujące uprawnienie**', permission);
	return embed;
}

embeds.guildNameChange = (oldGuild, newGuild) => {
	let embed = new Discord.MessageEmbed()
		.setColor(colors.white)
		.setAuthor({ name: 'Serwer zmienił nazwę'})
		.addField('**Poprzednia nazwa**', oldGuild.name, true)
		.addField('**Nowa nazwa**', newGuild.name, true)
		.addField('**ID**', newGuild.id);
	return embed;
}

embeds.guildAvatarChange = (oldGuild, newGuild) => {
	let embed = new Discord.MessageEmbed()
		.setColor(colors.white)
		.setAuthor({ name: 'Serwer zmienił avatar'})
		.addField('**Poprzedni avatar**', oldGuild.iconURL({ dynamic: false, size: 4096 }), true)
		.addField('**Nowy avatar**', newGuild.iconURL({ dynamic: true, size: 4096 }), true)
		.addField('**ID**', newGuild.id)
		.setImage(newGuild.iconURL({ dynamic: true, size: 4096 }));
	return embed;
}

embeds.spotifyPresenceStart = (followedUser, commandUser, voiceChannel, spotify, forsingleserver) => {
	const emojis = voiceChannel.client.supportServer.guild.emojis.cache;
	const musicEmoji = emojis.find(emoji => emoji.name == 'music');
	const timeEmoji = emojis.find(emoji => emoji.name == 'time');
	const spotifyEmoji = emojis.find(emoji => emoji.name == 'spotify');
	const youtubeEmoji = emojis.find(emoji => emoji.name == 'youtube');
	const totalSeconds = Math.floor((spotify.timestamps.end - spotify.timestamps.start)/1000);
	let currentSeconds = Math.floor((new Date() - spotify.timestamps.start)/1000);
	if (currentSeconds < 0 || currentSeconds > totalSeconds) currentSeconds = 0;
	const currentTime = toHHMMSS(currentSeconds);
	const totalTime = toHHMMSS(totalSeconds);
	const imageID = spotify.assets.largeImage?.split(':')[1];
	const imageURL = imageID ? `https://i.scdn.co/image/${imageID}` : false;
	const album = spotify.details != spotify.assets?.largeText ? `\n${musicEmoji} **Album:** ${spotify.assets?.largeText}` : '';
	const texts = [
		{user: 'Użytkownik', commandedby: 'Komenda wpisana przez', guild: 'Serwer', link: 'tu zaraz link'},
		{user: 'User', commandedby: 'Command entered by', guild: 'Guild', link: 'link there but wait a second'}
	];
	const text = forsingleserver ? texts[1] : texts[0];
	let embed = new Discord.MessageEmbed()
		.setAuthor({ name: 'SPOTIFY', iconURL: followedUser.displayAvatarURL() })
		.setColor(colors.blue)
		.setDescription(`${musicEmoji} ${spotify.details} - ${spotify.state}${album}\n${timeEmoji} ${currentTime} / ${totalTime}\n${spotifyEmoji} ${Discord.Formatters.hyperlink('[link]', 'https://open.spotify.com/track/'+spotify.syncId, spotify.details)}\n${youtubeEmoji} [${text.link}]`);
	if (imageURL) 
		embed.setImage(imageURL);
	if (!forsingleserver || (forsingleserver && forsingleserver == 'logs')) {
		embed
			.addField(`**${text.user}**`, `<@${followedUser.id}> (${followedUser.tag})`)
			.addField(`**${text.commandedby}**`, `<@${commandUser.id}> (${commandUser.user.tag})`);
	}
	if (!forsingleserver) embed.addField(`**${text.guild}**`, `${voiceChannel.guild.name}, \`#${voiceChannel.name}\``);
	return embed;
}

embeds.followTimeoutEnd = (following, forSupportServer, final) => {
	const texts = [
		{
			title: 'Following stopped',
			desc: `Looks like you hit ${final ? 'max '+config.followTimeoutMAX/3_600_000+' hours continous usage' :  config.followTimeout/60000+ ' minutes inactivity'} limit.`,
			channel: 'Channel',
			user: 'User'
		},
		{
			title: 'Śledzenie zatrzymane',
			desc: `Wygląda na to, że przekroczono limit ${final ? 'max '+config.followTimeoutMAX/3_600_000+' godzin ciągłego używania' :  config.followTimeout/60000+ ' minut nieaktywności'}.`,
			channel: 'Kanał',
			user: 'Użytkownik'
		}
	];
	const text = following.lang == 'pl' ? texts[1] : texts[0];
	const guild = following.textChannel.guild;
	let embed = new Discord.MessageEmbed()
		.setColor(colors.discord)
		.setAuthor({ name: text.title })
		.setDescription(text.desc);
	if (forSupportServer === true) {
		embed.addField('**Serwer**', `${guild.name}, \`#${following.voiceChannel.name}\``);
		embed.addField('**Użytkownik**',  `<@${following.following.id}> (${following.following.user.tag})`);
	} else if (forSupportServer == 'guild') {
		embed.addField(`**${text.channel}**`, `\`#${following.voiceChannel.name}\``);
		embed.addField(`**${text.user}**`, `<@${following.following.id}> (${following.following.user.tag})`);
	}
	return embed;
}

embeds.jsError = (title = 'error', error, full) => {
	if (full) { // nie pokazujemy całego błędu zwykłemu użytkownikowi
		error = inspect(error);
		if (error.length > 3700)
			error = error.substr(0, 3700) + '...\n\n...wiadomość przekroczyła maksymalną ilość znaków i została ucięta...'
	}
	let embed = new Discord.MessageEmbed()
		.setAuthor(title, config.embedImages.error)
		.setTitle('Error')
		.setColor(colors.paleRed)
		.setDescription(`${Discord.Formatters.codeBlock('js', error)}${!full ? '\nFull error was sent to Support server.' : ''}`)
		.setTimestamp()
	return embed;
}

embeds.ping = {};
embeds.ping.firstCall = async message => {
	if (!message) return false;
	return await message.reply({ embeds: [embeds.basic('Ping', ':clock3: Trwa sprawdzanie pingu...', colors.white, config.embedImages.hourGlass)] });
}

embeds.ping.result = (userMessage, botMessage) => {
	if (!userMessage || !botMessage) return false;
	const bot = userMessage.client;
	let embed = botMessage.embeds[0];
	embed.setColor(colors.blue);
	embed.setDescription('Pomyślnie sprawdzono ping');
	embed.addField(':desktop: Ty ➦ Discord ➦ Bot', botMessage.createdAt - userMessage.createdAt + ' ms', true);
	embed.addField(':gear: Bot ➦ Discord', Math.round(bot.ws.ping) + ' ms', true);
	embed.addField(':hourglass: Uptime', formatTime(Math.ceil(bot.uptime / 60000), true));
	const currentRAM = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2);
	const totalRAM = 2048;
	embed.addField(':file_cabinet: RAM', `${currentRAM} MB`, true);
	return embed;
}

module.exports = embeds;