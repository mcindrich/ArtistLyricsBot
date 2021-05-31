const https = require('https')
const azlyrics = require('../lib/azlyrics')
const yargs = require('yargs/yargs')
const { hideBin } = require('yargs/helpers')

var MAX_LINES = 4
var MIN_LINES = 1
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

    console.log(`Post request: ${dataStr}`)

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
        description: 'Webhook path'
    }).option('artist', {
        alias: 'a',
        type: 'string',
        description: 'Artist to search'
    }).option('interval', {
        alias: 'i',
        default: 60 * 1000 * 15,
        type: 'number',
        description: 'Number of ms in between posts'
    }).option('max', {
        alias: 'M',
        type: 'number',
        default: 4,
        description: 'Max number of lines to post'
    }).option('min', {
        alias: 'm',
        type: 'number',
        default: 1,
        description: 'Min number of lines to post'
    }).demandOption(['a', 'w'])
    .argv

// set the webhook for later use
DISCORD_WEBHOOK = argv.webhook
MAX_LINES = argv.max
MIN_LINES = argv.min

azlyrics.getAlbumsFromArtist(argv.artist, getAlbumsCallback)

setInterval(function () {
    azlyrics.getAlbumsFromArtist(argv.artist, getAlbumsCallback)
}, argv.interval)