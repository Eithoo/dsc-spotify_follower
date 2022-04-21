# dsc-spotify_follower

## What is it?
**Spotify Follower** is a Discord music bot. How is it different from other music bots? It can be controlled via Spotify (web, phone app, PC app). Basically it imitates "Listen Along" function, but you don't need to have Spotify Premium, or, in fact, Spotify at all.

## Project status
**DISCONTINUED**  
I realised that opus is not good enough to play music and therefore using voice channels on Discord to listen to music through a bot isn't particullary pleasant.

## How can I run this?
1. Install [ffmpeg](https://ffmpeg.org)
2. Install dependencies `npm install`
3. Create `config-secret.js` file with following contents:
```js
module.exports = {
	token: 'your discord bot token',
	genius_token: 'your genius token'
}
```
4. Run! `node main.js`


## Known bugs
- [ ] Genius lyrics won't work when bot is hosted outside your PC - Cloudflare is blocking the scraper. There were plans to use Puppeteer to avoid detection, before project status was changed to **discontinued**
- [ ] Sometimes lyrics are from different song - again, it's Genius' fault, more specifically: their search API. It's easy fix - bot just need to compare titles from Spotify and Genius, if not the same then take next element from search
- [ ] Sometimes bot plays different music than it should - it's YouTube search thing, there should be added some sort of check too
- [ ] Songs that are marked +18 in YT won't work (luckily there are very few of them, e.g. **I Got Bitches** by **A2M**)

---

## Plans
(well, **former plans**)
- [ ] TRANSLATIONS. Parts of texts are in English, parts in Polish. Some of them are translated to both languages (depending on user's locale), but not all.
- [ ] refactor `bot.forcePlaySongFromSpotify` and `embeds.spotifyPresenceStart`
- [ ] add logs in text channel for each guild, settings - there were plans to use SQLite for that
- [ ] **/lyrics** command, lyrics from Genius with annotations
- [ ] displaying lyrics but from particulatar point time in song *(e.g. 1:30/3:00 - lyrics would be displayed between 40% and 60% of all)*
- [ ] regular music bot commands like `/play <song name>`
- [ ] detecting Spotify links in messages and giving user option to quickly play that song in voice channel or just get link for the same song in YouTube + lyrics

## Discord
https://discord.gg/4YYd3NASjv
