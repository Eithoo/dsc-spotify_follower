const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../../config.js');
const colors = config.colors;
const embeds = require('../../embeds.js');
const { findSpotifyInPresence, chunk } = require('../../utils.js');

const commandName = 'getspotifyusers';

function createEmbeds(spotifyUsers, interaction, async, currentIndex, membersCount, guildName) {
	const interactionGuildId = interaction.options.getString('guild');
	const guildId = interactionGuildId || interaction.guild.id;
	const theSameGuild = guildId == interaction.guild.id;
	const processingEmoji = interaction.client.supportServer.guild.emojis.cache.find(emoji => emoji.name == 'processing');
	if (spotifyUsers.length == 0) {
		const text = [
			['Lista osób używających Spotify', 'Nikt z tego serwera nie używa w tej chwili Spotify.\n(*a przynajmniej nikt nie udostępnia swojej aktywności Spotify na Discordzie*)'],
			['Spotify users list', 'No one from this server is using Spotify right now.\n(*at least no one shares their Spotify activity on Discord*)']
		];
		const translation = interaction.locale == 'pl' ? text[0] : text[1];
		let description = translation[1];
		let color = colors.red;
		if (async && currentIndex+1 < membersCount) {
			description += `\n${processingEmoji} ${currentIndex+1}/${membersCount} (${Math.round(currentIndex/membersCount*100)}%)`;
			color = colors.pastelBrown;
		}
		const embed = embeds.error(translation[0], description, color);
		return { success: false, embeds: [embed] };
	}
	const musicEmoji = interaction.client.supportServer.guild.emojis.cache.find(emoji => emoji.name == 'music');
	let description = spotifyUsers.map(member => {
		const memberText = theSameGuild ? member.member : `**${member.member.user.tag}**`;
		return `${musicEmoji} ${memberText}: **${member.title}** - ${member.artists}`;
	});
	const text = [
		['Lista osób używających Spotify', 'Lista osób używających Spotify w tym serwerze:', `Lista osób używających Spotify w serwerze **${guildName}**:`],
		['Spotify users list', 'Spotify users list in this server:', `Spotify users list in server **${guildName}**:`]
	];
	const translation = interaction.locale == 'pl' ? text[0] : text[1];
	const chunked = chunk(description, 250);
	if (chunked.length == 1) {
		let content = (theSameGuild ? translation[1] : translation[2]) + '\n\n' + description.join('\n');
		let color = colors.green;
		if (async && currentIndex+1 < membersCount) {
			content = `${processingEmoji} ${currentIndex+1}/${membersCount} (${Math.round(currentIndex/membersCount*100)}%)\n\n${content}`;
			color = colors.pastelBrown;
		}
		const embed = embeds.success(translation[0], content, color);
		return { success: true, embeds: [embed] };
	} else {
		const embedsM = chunked.map((chunk, index) => {
			const title = `${translation[0]} (${index + 1}/${chunked.length})`;
			let firstContent = theSameGuild ? translation[1] : translation[2];
			let color = index == 0 && async ? colors.pastelBrown : colors.green;
			if (async && currentIndex+1 < membersCount) {
				firstContent = `${processingEmoji} ${currentIndex+1}/${membersCount} (${Math.round(currentIndex/membersCount*100)}%)\n\n${firstContent}`;
			}
			const content = index == 0 ? firstContent + '\n\n' + chunk.join('\n') : chunk.join('\n');
			embeds.success(title, content, color);
		});
		return { success: true, embeds: embedsM };
	}
}

module.exports = {
	data: new SlashCommandBuilder()
		.setName(commandName)
		.setDescription('Shows who is using Spotify right now in this guild.')
		.addStringOption(option =>
			option.setName('guild')
				.setDescription('You can select different guild than current.')
				.setAutocomplete(true)
		)
	,
	async execute(interaction) {
		await interaction.deferReply();
		const interactionGuildId = interaction.options.getString('guild');
		const guildId = interactionGuildId || interaction.guild.id;
		const guild = await interaction.client.guilds.cache.get(guildId).fetch();
		const guildMembers = await guild.members.fetch();
		const bigGuild =  guild.memberCount >= 30;
		const refreshInterval = guild.memberCount >= 200 ? guild.memberCount / 100 : 50;
		let currentSpotifyUsersArray = [];
		let index = -1;
		let spotifyUsers = await Promise.all(
			guildMembers
			.map(async member => {
				member = await member.fetch(false);
				const spotify = findSpotifyInPresence(member.presence);
				if (bigGuild) {
					index++;
				//	console.log('ASYNC MODE, '+ (index+1) + '/' + guild.memberCount);
					if (!spotify && index % refreshInterval == 0) {
						const embeds = createEmbeds(currentSpotifyUsersArray, interaction, true, index, guild.memberCount, guild.name);
						interaction.editReply({ embeds: embeds.embeds });
					}
				}
				if (spotify) {
					const title = spotify.details;
					const artists = spotify.state;
					if (bigGuild) {
						currentSpotifyUsersArray.push({ member, title, artists });
						const embeds = createEmbeds(currentSpotifyUsersArray, interaction, true, index, guild.memberCount, guild.name);
						interaction.editReply({ embeds: embeds.embeds });
					}
					return { member, title, artists };
				}
			})
		);
		spotifyUsers = spotifyUsers.filter(member => member != undefined);
		const embeds = createEmbeds(spotifyUsers, interaction, false, false, false, guild.name);
		interaction.editReply({ embeds: embeds.embeds });
	},
	async executeAutocomplete(interaction) {
		let data = interaction.options.getString('guild') || '';
		const guilds = interaction.client.guilds.cache;
		const searchedGuilds = guilds
			.filter(guild => guild.name.toLowerCase().includes(data.toLowerCase()))
			.map(guild => ({ name: guild.name, value: guild.id }));
		interaction.respond(searchedGuilds);
	},
	async executeAction(interaction) {
	
	}
};