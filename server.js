const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;
const DB_PATH = path.join(__dirname, 'stats.db');

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

function getDb() {
  return new sqlite3.Database(DB_PATH);
}

// ─── API: 전체 국가 목록 + 선수 수 + 집계 스탯 ───────────────────────────────
app.get('/api/nations', (req, res) => {
  const db = getDb();
  const sql = `
    SELECT
      n.*,
      COUNT(p.id) AS player_count,
      COALESCE(SUM(p.goals), 0) AS total_goals,
      COALESCE(SUM(p.assists), 0) AS total_assists,
      COALESCE(SUM(p.matches), 0) AS total_matches,
      COALESCE(ROUND(AVG(p.rating), 2), 0) AS avg_rating
    FROM nations n
    LEFT JOIN players p ON p.nation_code = n.code
    GROUP BY n.id
    ORDER BY total_goals DESC
  `;
  db.all(sql, [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ─── API: 선수 목록 (국가 필터, 포지션 필터, 정렬 지원) ───────────────────────
app.get('/api/players', (req, res) => {
  const db = getDb();
  const { nation, position, sort = 'goals', limit = 50 } = req.query;

  let where = [];
  let params = [];

  if (nation && nation !== 'ALL') {
    where.push('p.nation_code = ?');
    params.push(nation);
  }
  if (position && position !== 'ALL') {
    where.push('p.position = ?');
    params.push(position);
  }

  const validSorts = ['goals', 'assists', 'matches', 'rating', 'clean_sheets'];
  const sortCol = validSorts.includes(sort) ? sort : 'goals';

  const sql = `
    SELECT p.*, n.name_ko AS nation_name, n.flag_emoji, n.color AS nation_color
    FROM players p
    JOIN nations n ON p.nation_code = n.code
    ${where.length ? 'WHERE ' + where.join(' AND ') : ''}
    ORDER BY p.${sortCol} DESC
    LIMIT ?
  `;
  params.push(parseInt(limit));

  db.all(sql, params, (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ─── API: 선수 상세 ──────────────────────────────────────────────────────────
app.get('/api/players/:id', (req, res) => {
  const db = getDb();
  const sql = `
    SELECT p.*, n.name_ko AS nation_name, n.flag_emoji, n.color AS nation_color, n.continent
    FROM players p
    JOIN nations n ON p.nation_code = n.code
    WHERE p.id = ?
  `;
  db.get(sql, [req.params.id], (err, row) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    if (!row) return res.status(404).json({ error: '선수를 찾을 수 없습니다.' });
    res.json(row);
  });
});

// ─── API: 랭킹 (득점/도움/클린시트/평점) ─────────────────────────────────────
app.get('/api/rankings', (req, res) => {
  const db = getDb();
  const { type = 'goals', limit = 10 } = req.query;
  const validTypes = ['goals', 'assists', 'clean_sheets', 'rating'];
  const col = validTypes.includes(type) ? type : 'goals';

  const sql = `
    SELECT p.*, n.name_ko AS nation_name, n.flag_emoji, n.color AS nation_color
    FROM players p
    JOIN nations n ON p.nation_code = n.code
    ORDER BY p.${col} DESC
    LIMIT ?
  `;
  db.all(sql, [parseInt(limit)], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ─── API: 국가별 통합 랭킹 ───────────────────────────────────────────────────
app.get('/api/nation-rankings', (req, res) => {
  const db = getDb();
  const sql = `
    SELECT
      n.code, n.name_ko, n.flag_emoji, n.color,
      COUNT(p.id) AS player_count,
      SUM(p.goals) AS total_goals,
      SUM(p.assists) AS total_assists,
      ROUND(AVG(p.rating), 2) AS avg_rating
    FROM nations n
    LEFT JOIN players p ON p.nation_code = n.code
    GROUP BY n.code
    ORDER BY total_goals DESC
  `;
  db.all(sql, [], (err, rows) => {
    db.close();
    if (err) return res.status(500).json({ error: err.message });
    res.json(rows);
  });
});

// ─── SPA fallback ────────────────────────────────────────────────────────────
app.get('/{*path}', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 서버 실행 중: http://localhost:${PORT}`);
  console.log(`📡 API 엔드포인트:`);
  console.log(`   GET /api/nations`);
  console.log(`   GET /api/players?nation=KOR&position=FW&sort=goals`);
  console.log(`   GET /api/players/:id`);
  console.log(`   GET /api/rankings?type=goals&limit=10`);
  console.log(`   GET /api/nation-rankings`);
});
