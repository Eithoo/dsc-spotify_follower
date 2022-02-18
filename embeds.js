const config = require('./config.js');
const colors = config.colors;
const Discord = require('discord.js');

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

embeds.noPermissions = (guild, permission) => {
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

embeds.ping = {};
embeds.ping.firstCall = async message => {
	if (!message) return false;
	const bot = message.client;
	return await embeds.send.basicInChannel(bot, message.channel.id, 'Ping', ':clock3: Trwa sprawdzanie pingu...', colors.white, config.embedImages.hourGlass);
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