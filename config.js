const secret = require('./config-secret.js');
const config = {
	...secret,
	prefix: '!', // disabled
	creators: ['358259479525195776'],
	colors: {
		blue: '#1E90FF',
		green: '#32CD32',
		green2: '#369078',
		orange: '#C75C22',
		orange2: '#FF5700',
		red: '#C72222',
		paleRed: '#CD5C5C',
		white: '#FFFFFE',
		yellow: '#FFFF00',
		discord: '#2f3136'
	},
	embedImages: {
		success: 'https://i.imgur.com/ATS5JiO.png',
		error: 'https://i.imgur.com/Q4sN7mB.png',
		hourGlass: 'https://i.imgur.com/RAmE2kg.png',
		questionOrange: 'https://i.imgur.com/MKLEdVO.png',
		questionBlue: 'https://i.imgur.com/7sn8t99.png',
		pollGif: 'https://i.imgur.com/vZRvG5N.gif'
	},
	supportServer: {
		server: '943239225841700894',
		logsChannel: '943549793039421572',
		guildsErrorsChannel: '943999794991472650',
		errorsChannel: '944306320612417566',
		followLogsChannel: '954107775426916352',
		invite: 'https://discord.gg/4YYd3NASjv',
	}
}

module.exports = config;