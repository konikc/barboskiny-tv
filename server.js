const express = require('express');
const { spawn } = require('child_process');
const app = express();
const PORT = process.env.PORT || 3000;

const TOTAL_EPISODES = 20;
const ARCHIVE_BASE = 'https://archive.org/download/barboskiny'; // Ссылка на твой архив
const EPISODE_DURATION_MINS = 6; // Длина одной серии в минутах

function getCurrentEpisode() {
    const epochMinutes = Math.floor(Date.now() / 1000 / 60);
    const currentIndex = Math.floor(epochMinutes / EPISODE_DURATION_MINS) % TOTAL_EPISODES;
    return currentIndex + 1; 
}

app.get('/playlist.m3u', (req, res) => {
    const host = req.get('host');
    const protocol = req.protocol;
    const m3u = `#EXTM3U\n#EXTINF:-1,Барбоскины ТВ\n${protocol}://${host}/live\n`;
    
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.send(m3u);
});

app.get('/live', (req, res) => {
    res.setHeader('Content-Type', 'video/mp2t');
    
    const ep = getCurrentEpisode();
    const videoUrl = `${ARCHIVE_BASE}/part${ep}.mp4`;

   console.log(`Запуск трансляции с логотипом: part${ep}.mp4`);

    // Запускаем FFmpeg с наложением водяного знака
    const ffmpeg = spawn('ffmpeg', [
        '-re', 
        '-i', videoUrl,
        '-i', 'logo.png', // Подключаем твой логотип
        '-filter_complex', 'overlay=main_w-overlay_w-20:20', // Правый верхний угол с отступом 20px
        '-c:v', 'libx264', // Кодек для сжатия видео
        '-preset', 'ultrafast', // Максимально быстрая скорость (чтобы Render не тормозил)
        '-crf', '28', // Оптимальное качество для экономии ресурсов
        '-c:a', 'copy', // Звук оставляем без изменений (0% нагрузки)
        '-f', 'mpegts', 
        'pipe:1'
    ]);
    ffmpeg.stdout.pipe(res);

    req.on('close', () => {
        ffmpeg.kill();
    });
});

app.get('/', (req, res) => {
    res.send('<h1>Барбоскины ТВ работает 24/7!</h1><p>Ссылка на твой IPTV плейлист: <a href="/playlist.m3u">/playlist.m3u</a></p>');
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
