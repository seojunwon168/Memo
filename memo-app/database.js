const sqlite3 = require('sqlite3').verbose();
const db = new sqlite3.Database('./memo.db');

db.serialize(() => {
    // memos라는 테이블 생성 (id와 content 컬럼)
    db.run("CREATE TABLE IF NOT EXISTS memos (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT)");
});

module.exports = db;
