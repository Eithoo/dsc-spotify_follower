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