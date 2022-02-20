function hasAdminPermissions(guildMember) {
	if (guildMember.id == '358259479525195776')
		return true;
	return false;
}

function dli(x,a,b,c){ // original author: AFX / Wielebny
	if (x == 1) return a;
	if ((x%10 > 1) && (x%10 < 5) && (!((x%100 >= 10) && (x%100 <=21)))) return b;
	return c;
}

function formatTime(min, comma, withoutdays, lang = 'pl') {
	let days = Math.floor(min/1440);
	if (withoutdays)
		days = 0;
	else
		min %= 1440;
	const hours = Math.floor(min/60);
	const minutes = Math.floor(min%60);
	if (comma)
		var separatingString = ', ';
	else
		var separatingString = ' ';

	var response = '';
	if (lang == 'pl') {
		if (days > 0)
			response += `${days} ${dli(days, 'dzień', 'dni', 'dni')}${(hours || minutes) ? separatingString : ''}`;
		if (hours > 0)
			response += `${hours} ${dli(hours, 'godzina', 'godziny', 'godzin')}${minutes ? separatingString : ''}`;
		if (minutes > 0)
			response += `${minutes} ${dli(minutes, 'minuta', 'minuty', 'minut')}`;
	} else {
		if (days > 0)
			response = `${days} ${days > 1 ? 'days' : 'day'}${(hours || minutes) ? separatingString : ''}`;
		if (hours > 0)
			response += `${hours} ${hours > 1 ? 'hours' : 'hour'}${minutes ? separatingString : ''}`;
		if (minutes > 0)
			response += `${minutes} ${minutes > 1 ? 'minutes' : 'minute'}`;
	}
	return response;
}

module.exports = {
	hasAdminPermissions,
	dli,
	formatTime,
}