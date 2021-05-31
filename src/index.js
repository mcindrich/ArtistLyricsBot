const https = require('https')
const azlyrics = require('../lib/azlyrics')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

const MAX_LINES = 4
const MIN_LINES = 1
var DISCORD_WEBHOOK = ''

function postToDiscord(data) {
    const dataStr = JSON.stringify(data)
    console.log(`Sending post request with given data: ${dataStr}`)

    const options = {
        hostname: 'discord.com',
        port: 443,
        path: DISCORD_WEBHOOK,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': dataStr.length
        }
    }

    console.log(`Post request: ${JSON.stringify(options)}`)

    let dataString = ''

    const req = https.request(options, res => {
        console.log(`statusCode: ${res.statusCode}`)

        res.on('data', function (d) {
            dataString += d.toString()
        })

        res.on('end', function () {
            console.log(dataString)
        })
    })

    req.on('error', error => {
        console.error(error)
    })

    req.write(dataStr)
    req.end()
}

function getLyricsCallback(songLyrics) {
    // post to discord using discord API
    const lines = songLyrics.lyrics.split('\n')

    const randLines = Math.floor(Math.random() * MAX_LINES) + MIN_LINES
    let startIndex = Math.floor(Math.random() * lines.length)

    let output = ''
    if (startIndex + randLines >= lines.length) {
        const diff = startIndex + randLines - lines.length
        startIndex -= diff - randLines
    }

    for (let i = 0; i < randLines; i++) {
        output += lines[startIndex + i] + '\n'
    }

    postToDiscord({
        embeds: [
            {
                title: songLyrics.title,
                description: output
            }
        ]
    })
}

function getAlbumsCallback(albums) {
    const randAlbum = Math.floor(Math.random() * albums.length)
    const chosenAlbum = albums[randAlbum]

    const randSong = Math.floor(Math.random() * chosenAlbum.songs.length)
    const chosenSong = chosenAlbum.songs[randSong]

    console.log(`Chosen song: ${JSON.stringify(chosenSong)}`)

    const songLyrics = azlyrics.getSongLyrics(chosenSong, getLyricsCallback)
}


const argv = yargs(hideBin(process.argv))
    .option('webhook', {
        alias: 'w',
        type: 'string',
        description: 'Sets the discord webhook path'
    }).option('artist', {
        alias: 'a',
        type: 'string',
        description: 'Sets the artist to search for'
    }).option('interval', {
        alias: 'i',
        type: 'number',
        description: 'Sets the number of miliseconds to wait before another search and post'
    }).demandOption(['a', 'w'])
    .argv

let programOptions = {
    artist: argv.artist,
    interval: argv.interval ? argv.interval : 1000 * 60 * 20,
    webhook: argv.webhook
}

// set the webhook for later use
DISCORD_WEBHOOK = programOptions.webhook

azlyrics.getAlbumsFromArtist(programOptions.artist, getAlbumsCallback)

setInterval(function () {
    azlyrics.getAlbumsFromArtist(programOptions.artist, getAlbumsCallback)
}, programOptions.interval)