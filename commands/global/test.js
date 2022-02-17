const Discord = require('discord.js');
const { SlashCommandBuilder } = require('@discordjs/builders');
const config = require('../../config.js');
const embeds = require('../../embeds.js');

const commandName = 'test_global';

module.exports = {
	data: new SlashCommandBuilder()
		.setName(commandName)
		.setDescription('asdfgh')
	,
	async execute(interaction) {
		interaction.reply({ content: 'test komendy dostepnej globalnie' });

	},
	async executeAutocomplete(interaction) {

	},
	async executeAction(interaction) {
	
	}
};