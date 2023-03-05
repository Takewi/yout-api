const fs = require('fs');
const ytdl = require('ytdl-core');
const ffmpeg = require('fluent-ffmpeg');
const pathToFfmpeg = require('ffmpeg-static');
const prompt = require('prompt-sync')()
ffmpeg.setFfmpegPath(pathToFfmpeg)

fs.stat('downloads', (err) => {
    if (!err) return
    fs.mkdir('downloads', (err) => {
        if (err) throw err;
        console.log('Created downloads folder to save downloaded data.')
    })
})

fs.stat('files', (err) => {
    if (!err) return
    fs.mkdir('files', (err) => {
        if (err) throw err;
        console.log('Created files folder to put processed data.')
    })
})

const videoUrl = prompt('Enter video url: ')

if (!ytdl.validateURL(videoUrl)) {
    console.error('Ivalid url!')
    return
}

console.log('Your video is being downloaded and processed, this process can take some time, please wait.')

const interval = setInterval(() => {
    console.log('Process in progress, please wait.')
}, 10 * 10 * 10 * 10)

ytdl.getInfo(ytdl.getURLVideoID(videoUrl)).then((info) => {
    const unixtime = new Date().valueOf()
    const donwloadFolderPath = `./downloads/${info.videoDetails.title}-${unixtime}/`
    const audioPath = `./downloads/${info.videoDetails.title}-${unixtime}/audio.mp3`
    const videoPath = `./downloads/${info.videoDetails.title}-${unixtime}/video.mp4`
    fs.mkdir(donwloadFolderPath, (err) => {
        if (err) throw err;
        console.log(`Created ${info.videoDetails.title}-${unixtime} in downloads folder`)
    })
    const highestAudio = new Promise((resolve) => {
        ytdl.downloadFromInfo(info, {
            quality: "highestaudio"
        }).pipe(fs.createWriteStream(audioPath)).addListener('finish', () => {
            resolve()
        })
    })
    const highestVideo = new Promise((resolve) => {
        ytdl.downloadFromInfo(info, {
            quality: "highest"
        }).pipe(fs.createWriteStream(videoPath)).addListener('finish', () => {
            resolve()
        })
    })

    Promise.all([highestAudio, highestVideo]).then(() => {
        const outputPath = `./files/${info.videoDetails.title}-${unixtime}.mp4`
        const command = ffmpeg()
        command.input(audioPath)
        command.input(videoPath)
        command.output(outputPath)
        command.on('end', () => {
            console.log('Finished video download and processing!')
            clearInterval(interval)
            console.log(`Check the ${info.videoDetails.title}-${unixtime} in files folder.`)
        }).run()
    })
})