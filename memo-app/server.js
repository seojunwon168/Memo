const express = require('express');
const cors = require('cors');
const db = require('./database');

const app = express();
app.use(cors());
app.use(express.json()); // JSON 형태의 데이터 처리
app.use(express.static('public')); // 프론트엔드 파일 제공

// 1. 저장 API (Create)
app.post('/api/memos', async (req, res) => {
    try {
        const { content } = req.body;
        const result = await db.query(
            "INSERT INTO memos (content) VALUES ($1) RETURNING id, content", 
            [content]
        );
        res.json(result.rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

// 2. 불러오기 API (Read) - 모든 메모 가져오기
app.get('/api/memos', async (req, res) => {
    try {
        const result = await db.query("SELECT * FROM memos ORDER BY id DESC");
        res.json(result.rows || []);
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

// 3. 삭제 API (Delete) - 특정 메모 삭제
app.delete('/api/memos/:id', async (req, res) => {
    try {
        const id = req.params.id;
        const result = await db.query("DELETE FROM memos WHERE id = $1", [id]);
        res.json({ success: true, changes: result.rowCount });
    } catch (err) {
        console.error(err);
        res.status(500).send("Database Error");
    }
});

const PORT = process.env.PORT || 3000;
if (process.env.NODE_ENV !== 'production') {
    app.listen(PORT, () => {
        console.log(`서버가 http://localhost:${PORT} 에서 실행 중입니다.`);
    });
}

// Vercel Serverless Function을 위한 export
module.exports = app;
