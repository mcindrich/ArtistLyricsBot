# ArtistLyricsBot

Discord bot for sending random song lyrics from a given artist in an interval. Discord webhook is required. For more information visit https://support.discord.com/hc/en-us/articles/228383668-Intro-to-Webhooks.

## Install
```shell
$ npm i
$ npm run build
$ node build/src/index.js --help
Options:
      --help      Show help                                            [boolean]
      --version   Show version number                                  [boolean]
  -w, --webhook   Webhook path                               [string] [required]
  -a, --artist    Artist to search                           [string] [required]
  -i, --interval  Number of ms in between posts                         [number]
```

## Dependencies
 - typescript
 - yargs
 - node-html-parser