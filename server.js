const express = require('express');
const { spawn } = require('child_process');
const app = express();
const PORT = process.env.PORT || 10000;

const TOTAL_EPISODES = 20; // Твои 20 серий для теста
let globalEpisode = 1;     // Глобальный счетчик, чтобы серии шли по очереди

app.get('/', (req, res) => {
    res.send('<h1>Барбоскины ТВ работает 24/7!</h1><p>Ссылка на плейлист: <a href="/playlist.m3u">/playlist.m3u</a></p>');
});

app.get('/playlist.m3u', (req, res) => {
    res.setHeader('Content-Type', 'audio/x-mpegurl');
    res.send(`#EXTM3U\n#EXTINF:-1,Барбоскины ТВ 24/7\nhttp://${req.headers.host}/live`);
});

app.get('/live', (req, res) => {
    res.setHeader('Content-Type', 'video/mp2t');

    function playNext() {
        if (req.destroyed) return;

        const videoUrl = `https://archive.org/download/barboskiny/part${globalEpisode}.mp4`;
        console.log(`[ТВ] Запуск серии: part${globalEpisode}.mp4`);

        // Чистый запуск без лишних настроек, нагрузка 0%
        const ffmpeg = spawn('ffmpeg', [
            '-re',
            '-i', videoUrl,
            '-c', 'copy',
            '-f', 'mpegts',
            'pipe:1'
        ]);

        // Перенаправляем видео зрителю
        ffmpeg.stdout.pipe(res, { end: false });

        ffmpeg.on('close', () => {
            if (req.destroyed) return;

            // Как только серия кончилась ИЛИ оборвалась — строго переходим к СЛЕДУЮЩЕЙ
            globalEpisode++;
            if (globalEpisode > TOTAL_EPISODES) {
                globalEpisode = 1; // Возврат к первой, если дошли до конца
            }

            console.log(`[ТВ] Поток закрылся. Переключаю на серию №${globalEpisode}`);
            playNext(); // Запускаем следующую серию в этот же поток
        });
    }

    playNext();
});

app.listen(PORT, () => {
    console.log(`Сервер запущен на порту ${PORT}`);
});
