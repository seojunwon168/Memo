const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json()); // JSON 형태의 데이터 처리
app.use(express.static('public')); // 프론트엔드 파일 제공

// 1. 저장 API (Create)
app.post('/api/memos', (req, res) => {
    const { content } = req.body;
    db.run("INSERT INTO memos (content) VALUES (?)", [content], function (err) {
        if (err) return res.status(500).send(err.message);
        res.json({ id: this.lastID, content });
    });
});

// 2. 불러오기 API (Read) - 모든 메모 가져오기
app.get('/api/memos', (req, res) => {
    db.all("SELECT * FROM memos ORDER BY id DESC", (err, rows) => {
        if (err) return res.status(500).send(err.message);
        res.json(rows || []);
    });
});

// 3. 삭제 API (Delete) - 특정 메모 삭제
app.delete('/api/memos/:id', (req, res) => {
    const id = req.params.id;
    db.run("DELETE FROM memos WHERE id = ?", [id], function (err) {
        if (err) return res.status(500).send(err.message);
        res.json({ success: true, changes: this.changes });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
});
