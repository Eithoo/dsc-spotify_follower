const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../../config.js');
const embeds = require('../../embeds.js');
const { findSpotifyInPresence } = require('../../utils.js');

const commandName = 'follow';

module.exports = {
	data: new SlashCommandBuilder()
		.setName(commandName)
		.setDescription('Tracks what the selected user is listening to.')
		.addUserOption(option =>
			option.setName('user')
				.setDescription('user to follow')	
		)
	,
	async execute(interaction) {
		let member = interaction.options.getMember('user') || interaction.member;
		member = await member.fetch();
		const alreadyFollowing = interaction.client.spotify_following.get(interaction.guildId);
		if (alreadyFollowing) {
			const text = [
				['Nie rozdwoje sie mordo', `Bot jest już w użyciu na tym serwerze.\nObserwuję <@${alreadyFollowing.following.id}>, zlecono przez <@${alreadyFollowing.by.id}> ${Discord.Formatters.time(alreadyFollowing.on, 'f')}`],
				['Already in use', `Bot is already following someone on this guild.\nFollowing <@${alreadyFollowing.following.id}>, /follow command entered by <@${alreadyFollowing.by.id}> on ${Discord.Formatters.time(alreadyFollowing.on, 'f')}`]
			];
			const translation = interaction.locale == 'pl' ? text[0] : text[1];
			const embed = embeds.error(translation[0], translation[1], config.colors.yellow);
			return interaction.reply({ embeds: [embed] });
		}
		if (!interaction.member.voice?.channelId) {
			const text = [
				['Nie spełniono warunków', 'Musisz być na kanale głosowym, żeby użyć tej komendy.'],
				['Aren\'t you missing something?', 'You have to be in voice channel in order to use this command.']
			];
			const translation = interaction.locale == 'pl' ? text[0] : text[1];
			const embed = embeds.error(translation[0], translation[1], config.colors.yellow);
			return interaction.reply({ embeds: [embed] });
		}
		const presence = member.presence;
		const spotify = findSpotifyInPresence(presence);
		if (!presence || !spotify) {
			const text = [
				['Nima czego słuchać', 'Wygląda na to, że w tym momencie nie słuchasz niczego na Spotify. Na pewno masz podpięte Spotify do Discorda?', 'Wygląda na to, że w tym momencie użytkownik nie słucha niczego na Spotify.'],
				['User is not curretly listening to Spotify', 'It looks like you aren\'t listening to anything on Spotify right now. Are you sure you have Spotify connected to Discord?', 'It looks like the user is not listening to anything on Spotify right now.']
			];
			const me = member.id == interaction.member.id;
			const translation = interaction.locale == 'pl' ? text[0] : text[1];
			const embed = embeds.error(translation[0], me ? translation[1] : translation[2], config.colors.yellow);
			return interaction.reply({ embeds: [embed] });
		}
		const imageID = spotify.assets.largeImage.split(':')[1];
		const imageURL = `https://i.scdn.co/image/${imageID}`;
		const totalSeconds = Math.floor((spotify.timestamps.end - spotify.timestamps.start)/1000);
		let currentSeconds = Math.floor((new Date() - spotify.timestamps.start)/1000);
		if (currentSeconds < 0 || currentSeconds > totalSeconds) currentSeconds = 0;
	//	const Xembed = embeds.success('git', `test\n\ntytuł: ${spotify.details}\nalbum: ${spotify.assets?.largeText}\nwykonawcy: ${spotify.state}\n\nczas:\nstart: ${spotify.timestamps.start}\nkoniec: ${spotify.timestamps.end}\nodtwarzanie: ${currentSeconds}s / ${totalSeconds}s`, config.colors.discord)
	//	.setImage(imageURL);
		interaction.client.spotify_following.set(interaction.guildId, {
			following: member,
			by: interaction.member,
			on: new Date(),
			voiceChannel: interaction.member.voice.channel
		});

	//	await interaction.channel.send({ content: `${member} test komendy`, embeds: [Xembed] });

		const embed_support = embeds.spotifyPresenceStart(member.user, interaction.member, interaction.member.voice.channel, spotify);
		const embed_reply = embeds.spotifyPresenceStart(member.user, interaction.member, interaction.member.voice.channel, spotify, true);
	//	const embed_guild = embeds.spotifyPresenceStart(member.user, interaction.member, interaction.member.voice.channel, spotify, 'logs');
	// to do ogarniecia jeszcze, musi wysylac tez na serwerowy kanal z logami
		const msg_support = interaction.client.supportServer.channels.follow.send({ embeds: [embed_support] });
		const msg_reply = interaction.reply({ embeds: [embed_reply], fetchReply: true });
	//	const msg_guild = ...;
		interaction.client.forcePlaySongFromSpotify(interaction.member.voice.channel, spotify.details, spotify.state, currentSeconds, spotify.syncId, [msg_support, msg_reply]);


	},
	async executeAutocomplete(interaction) {

	},
	async executeAction(interaction) {
	
	}
};