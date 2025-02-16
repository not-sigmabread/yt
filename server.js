const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const axios = require('axios');
const fs = require('fs');
const app = express();

const YOUTUBE_API_KEY = 'AIzaSyBhJKFNt5ohNZVuQf-GihCLIBcN1w_hQY4'; // Replace with your YouTube Data API key

app.use(express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json());

const videoMappings = {};
const processingClients = {};
let currentShortVideoIds = [];

app.post('/createSafeView', (req, res) => {
    const videoUrl = req.body.videoUrl;
    const videoId = generateVideoId();
    const videoPath = path.join(__dirname, 'videos', `${videoId}.mp4`);

    // Respond immediately and process the video in the background
    res.json({ message: 'Video processing started', videoId });

    downloadVideo(videoUrl, videoPath)
        .then(() => {
            videoMappings[videoId] = videoPath;
            console.log(`Video processed: ${videoId}`);
            if (processingClients[videoId]) {
                processingClients[videoId].forEach(client => client.res.write(`data: done\n\n`));
                delete processingClients[videoId];
            }
        })
        .catch(error => {
            console.error('Error downloading video:', error);
        });
});

app.post('/createShortView', (req, res) => {
    const videoUrl = req.body.videoUrl;
    const videoId = generateVideoId();
    const videoPath = path.join(__dirname, 'videos', `${videoId}.mp4`);

    // Respond immediately and process the video in the background
    res.json({ message: 'Short processing started', videoId });
    currentShortVideoIds.push(videoId);

    downloadVideo(videoUrl, videoPath)
        .then(() => {
            videoMappings[videoId] = videoPath;
            console.log(`Short processed: ${videoId}`);
            if (processingClients[videoId]) {
                processingClients[videoId].forEach(client => client.res.write(`data: done\n\n`));
                delete processingClients[videoId];
            }
        })
        .catch(error => {
            console.error('Error downloading short:', error);
        });
});

app.post('/createMultipleShortViews', async (req, res) => {
    const videoUrls = req.body.videoUrls;
    const videoIds = [];

    for (const videoUrl of videoUrls) {
        const videoId = generateVideoId();
        const videoPath = path.join(__dirname, 'videos', `${videoId}.mp4`);
        videoIds.push(videoId);

        await downloadVideo(videoUrl, videoPath)
            .then(() => {
                videoMappings[videoId] = videoPath;
                console.log(`Short processed: ${videoId}`);
            })
            .catch(error => {
                console.error('Error downloading short:', error);
            });
    }

    res.json({ message: 'Shorts processing started', videoIds });
});

app.get('/video/:id', (req, res) => {
    const videoId = req.params.id;
    const videoPath = videoMappings[videoId];

    if (videoPath) {
        res.send(generateVideoPage(videoId));
    } else {
        res.send(generateProcessingPage(videoId));
    }
});

app.get('/shorts/:id', (req, res) => {
    const videoId = req.params.id;
    const videoPath = videoMappings[videoId];

    if (videoPath) {
        res.send(generateShortPage(videoId));
    } else {
        res.send(generateProcessingPage(videoId));
    }
});

app.get('/videos/:id', (req, res) => {
    const videoId = req.params.id;
    const videoPath = videoMappings[videoId];

    if (videoPath) {
        console.log(`Serving video: ${videoPath}`);
        res.setHeader('Content-Type', 'video/mp4');
        res.sendFile(videoPath);
    } else {
        res.status(404).send('Video not found');
    }
});

app.get('/searchYouTube', async (req, res) => {
    const query = req.query.q;
    try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
            params: {
                part: 'snippet',
                q: query,
                type: 'video',
                key: YOUTUBE_API_KEY,
                maxResults: 50
            }
        });

        res.json(response.data.items);
    } catch (error) {
        console.error('Error searching YouTube:', error);
        res.status(500).json({ error: 'Failed to search YouTube. Please try again later.' });
    }
});

app.get('/getShorts', async (req, res) => {
    try {
        const response = await axios.get(`https://www.googleapis.com/youtube/v3/search`, {
            params: {
                part: 'snippet',
                q: 'shorts',
                type: 'video',
                videoDuration: 'short',
                key: YOUTUBE_API_KEY,
                maxResults: 7,
                order: 'date'
            }
        });

        res.json(response.data.items);
    } catch (error) {
        console.error('Error fetching YouTube Shorts:', error);
        res.status(500).json({ error: 'Failed to fetch YouTube Shorts. Please try again later.' });
    }
});

// Serve the shorts.html file
app.get('/shorts', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'shorts.html'));
});

app.get('/events/:id', (req, res) => {
    const videoId = req.params.id;
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');

    if (!processingClients[videoId]) {
        processingClients[videoId] = [];
    }

    processingClients[videoId].push({ res });

    req.on('close', () => {
        if (processingClients[videoId]) {
            processingClients[videoId] = processingClients[videoId].filter(client => client.res !== res);
        }
    });
});

function generateVideoId() {
    return Math.random().toString(36).substr(2, 9);
}

function generateVideoPage(videoId) {
    const videoUrl = `/videos/${videoId}`;
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SafeView</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f9f9f9;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .video-container {
                    text-align: center;
                    background-color: #fff;
                    padding: 20px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    border-radius: 8px;
                }
                video {
                    width: 100%;
                    max-width: 800px;
                    height: auto;
                    border: none;
                    border-radius: 8px;
                    margin-top: 20px;
                }
                .header {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 20px;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 14px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="video-container">
                <div class="header">SafeView Video Player</div>
                <video controls>
                    <source src="${videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div class="footer">Powered by SafeShare Clone</div>
            </div>
        </body>
        </html>
    `;
}

function generateShortPage(videoId) {
    const videoUrl = `/videos/${videoId}`;
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SafeView Shorts</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f9f9f9;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .video-container {
                    text-align: center;
                    background-color: #fff;
                    padding: 20px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    border-radius: 8px;
                }
                video {
                    width: 100%;
                    max-width: 400px;
                    height: auto;
                    border: none;
                    border-radius: 8px;
                    margin-top: 20px;
                }
                .header {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 20px;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 14px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="video-container">
                <div class="header">SafeView Shorts Player</div>
                <video autoplay controls>
                    <source src="${videoUrl}" type="video/mp4">
                    Your browser does not support the video tag.
                </video>
                <div class="footer">Powered by SafeShare Clone</div>
            </div>
        </body>
        </html>
    `;
}

function generateProcessingPage(videoId) {
    return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>SafeView</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    background-color: #f9f9f9;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    height: 100vh;
                    margin: 0;
                }
                .processing-container {
                    text-align: center;
                    background-color: #fff;
                    padding: 20px;
                    box-shadow: 0 0 10px rgba(0,0,0,0.1);
                    border-radius: 8px;
                }
                .header {
                    font-size: 24px;
                    font-weight: bold;
                    margin-bottom: 20px;
                }
                .footer {
                    margin-top: 20px;
                    font-size: 14px;
                    color: #666;
                }
            </style>
        </head>
        <body>
            <div class="processing-container">
                <div class="header">SafeView Video Processing</div>
                <p>Your video is currently being processed. Please wait...</p>
                <div class="footer">Powered by SafeShare Clone</div>
            </div>
            <script>
                const eventSource = new EventSource('/events/${videoId}');
                eventSource.onmessage = function(event) {
                    if (event.data === 'done') {
                        window.location.reload();
                    }
                };
            </script>
        </body>
        </html>
    `;
}

function downloadVideo(url, outputPath) {
    return new Promise((resolve, reject) => {
        exec(`./run-yt-dlp.sh yt-dlp -f 'best[ext=mp4]' --no-part -o "${outputPath}" ${url}`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error downloading video: ${stderr}`);
                return reject(error);
            }
            console.log(`Video downloaded: ${stdout}`);
            resolve();
        });
    });
}

function clearVideosFolder() {
    const directory = path.join(__dirname, 'videos');
    fs.readdir(directory, (err, files) => {
        if (err) throw err;

        for (const file of files) {
            fs.unlink(path.join(directory, file), err => {
                if (err) throw err;
            });
        }
    });
}

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
