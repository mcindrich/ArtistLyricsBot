import { parse } from 'node-html-parser'
import * as https from 'https'

export interface Song {
    title: string
    path: string
}

export interface SongLyrics {
    title: string
    lyrics: string
}

export interface Album {
    name: string
    type: string
    songs: Song[]
}

function isAlbum(el: HTMLElement): boolean {
    for (let cl of el.classList.values()) {
        if (cl == 'album') {
            return true
        }
    }
    return false
}

function isSong(el: HTMLElement): boolean {
    for (let cl of el.classList.values()) {
        if (cl == 'listalbum-item') {
            return true
        }
    }
    return false
}

function parseAlbumNode(node: HTMLElement): Album {
    return {
        name: node.innerText,
        type: node.innerText,
        songs: []
    }
}

function parseSongNode(node: HTMLElement): Song {
    const innerLinkNode = node.firstChild as any as HTMLElement
    return {
        title: node.innerText,
        path: innerLinkNode.getAttribute('href')
    }
}

function parseAlbums(data: string): Album[] {
    const root = parse(data)
    const albumsDiv = root.querySelector('#listAlbum')
    const albums: Album[] = []

    if (albumsDiv) {
        for (let ch of albumsDiv.childNodes) {

            if (ch.nodeType == 1) {
                const el = ch as any as HTMLElement;

                if (isAlbum(el)) {
                    const album = parseAlbumNode(el)
                    albums.push(album)
                } else if (isSong(el)) {
                    const song = parseSongNode(el)
                    albums[albums.length - 1].songs.push(song)
                } else {
                    // idk
                }
            }
        }
    }
    return albums
}

function removeUTF8(str: string) {
    var output = "";
    for (var i = 0; i < str.length; i++) {
        if (str.charCodeAt(i) <= 127) {
            output += str.charAt(i)
        }
    }
    return output
}

function htmlToText(str: string) {
    return str.replace(/&#x27;/g, '\'').replace(/&amp;/g, '&').replace(/&quot;/g, '\"')
}

function parseSongLyrics(data: string): SongLyrics {
    const root = parse(data)
    const div = root.querySelector('.ringtone')
    let next = div.nextElementSibling
    while (next) {
        if (next.tagName == 'DIV') {
            break
        }
        next = next.nextElementSibling
    }

    const lyrics = removeUTF8(htmlToText(next.innerText)).trim()
    return {
        title: '',
        lyrics: lyrics
    }
}

export function getSongLyrics(song: Song, cb) {
    const path = song.path.substring(2, song.path.length)

    const options = {
        hostname: 'www.azlyrics.com',
        port: 443,
        path: path,
        method: 'GET'
    }

    let data = ''

    const req = https.request(options, (res) => {
        // console.log(res.statusCode)

        res.on('data', (d) => {
            data += d.toString()
        })

        res.on('end', function () {
            // console.log(data)
            const lyrics = parseSongLyrics(data)
            lyrics.title = song.title
            cb(lyrics)
        })
    })

    req.on('error', function (err) {
        console.error(err)
    })

    req.end()
}

export function getAlbumsFromArtist(artistName: string, cb) {
    const artistLower = artistName.toLowerCase()

    const options = {
        hostname: 'www.azlyrics.com',
        port: 443,
        path: `/${artistLower[0]}/${artistLower}.html`,
        method: 'GET'
    }

    let data = ''

    const req = https.request(options, (res) => {
        // console.log(res.statusCode)

        res.on('data', (d) => {
            data += d.toString()
        })

        res.on('end', function () {
            // console.log(data)
            const albums = parseAlbums(data)
            cb(albums)
        })
    })

    req.on('error', function (err) {
        console.error(err)
    })

    req.end()
}