const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../../config.js');
const embeds = require('../../embeds.js');
const { findSpotifyInPresence } = require('../../utils.js');

const commandName = 'stopfollowing';

module.exports = {
	data: new SlashCommandBuilder()
		.setName(commandName)
		.setDescription('Opposite of /follow. Can be used by followed user, user that entered command before and admin.')
	,
	async execute(interaction) {
		const bot = interaction.client;
		const state = bot.spotify_following.get(interaction.guildId);
		if (!state) {
			const text = [
				['No one is followed..', 'Command not executed - followed users list for this guild returned no results.'],
				['Nikt nie jest przecież śledzony..', 'Komenda nie została wykonana - lista śledzonych użytkowników dla tego serwera jest pusta.']
			];
			const translation = interaction.locale == 'pl' ? text[1] : text[0];
			const embed = embeds.error(translation[0], translation[1], config.colors.yellow);
			return interaction.reply({ embeds: [embed] });
		}
		const followed = state.following;
		const commanded = state.by;
		const permission = interaction.member.permissions.has('MOVE_MEMBERS');
		if (interaction.member.id != followed.id && interaction.member.id != commanded.id && !permission) {
			const text = [
				['Woops you can\'t do that', 'You do not have permission to use this command.\nIt can be only used by the member who entered **/follow** command, member who is followed by that command or moderator with **MOVE_MEMBERS** permission.'],
				['Nie masz uprawnień do tej komendy', 'Nie możesz użyć tej komendy.\nMoże być ona użyta jedynie przez osobę, która wcześniej wpisała komendę **/follow**, osobę która jest tą komendą śledzona, lub moderatora z uprawnieniem **MOVE_MEMBERS**.']
			];
			const translation = interaction.locale == 'pl' ? text[1] : text[0];
			const embed = embeds.error(translation[0], translation[1], config.colors.orange);
			return interaction.reply({ embeds: [embed] });
		}
		
		const queue = bot.musicPlayer.getQueue(interaction.guildId);
		if (queue) {
			queue?.connection?.leave();
			queue.stop();
		}
		interaction.guild.me.setNickname(null)
		.catch(error => bot.supportServer.channels.guildsErrors.send({ embeds: [embeds.noServerPermissions(voiceChannel.guild, 'CHANGE_NICKNAME')] }));

		const text = [
			['Done', `Stopped following ${followed}`],
			['Śledzenie wyłączone', `Bot nie będzie już śledzić ${followed}`]
		];
		const translation = interaction.locale == 'pl' ? text[1] : text[0];
		const embed = embeds.success(translation[0], translation[1]);
		bot.spotify_following.delete(interaction.guildId); // na koncu
		return interaction.reply({ embeds: [embed] });


	},
	async executeAutocomplete(interaction) {

	},
	async executeAction(interaction) {
	
	}
};