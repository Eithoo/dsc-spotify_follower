const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../../config.js');
const embeds = require('../../embeds.js');

const commandName = 'test_local';

module.exports = {
	data: new SlashCommandBuilder()
		.setName(commandName)
		.setDescription('qwerty')
	,
	async execute(interaction) {
		interaction.reply({ content: 'test komendy dostepnej tylko na serwerze support' });

	},
	async executeAutocomplete(interaction) {

	},
	async executeAction(interaction) {
	
	}
};