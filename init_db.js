const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'stats.db');
const db = new sqlite3.Database(DB_PATH);

db.serialize(() => {
  // 테이블 생성
  db.run(`DROP TABLE IF EXISTS players`);
  db.run(`DROP TABLE IF EXISTS nations`);

  db.run(`
    CREATE TABLE IF NOT EXISTS nations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      name_ko TEXT NOT NULL,
      name_en TEXT NOT NULL,
      continent TEXT NOT NULL,
      flag_emoji TEXT NOT NULL,
      fifa_rank INTEGER,
      color TEXT NOT NULL
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      name_ko TEXT NOT NULL,
      nation_code TEXT NOT NULL,
      club TEXT NOT NULL,
      club_short TEXT NOT NULL,
      position TEXT NOT NULL,
      age INTEGER,
      matches INTEGER DEFAULT 0,
      goals INTEGER DEFAULT 0,
      assists INTEGER DEFAULT 0,
      clean_sheets INTEGER DEFAULT 0,
      yellow_cards INTEGER DEFAULT 0,
      red_cards INTEGER DEFAULT 0,
      rating REAL DEFAULT 0.0,
      season TEXT NOT NULL DEFAULT '2023-24',
      image_initial TEXT,
      FOREIGN KEY (nation_code) REFERENCES nations(code)
    )
  `);

  // 국가 데이터
  const nations = [
    { code: 'KOR', name_ko: '대한민국', name_en: 'South Korea', continent: '아시아', flag: '🇰🇷', rank: 23, color: '#CD2E3A' },
    { code: 'ENG', name_ko: '잉글랜드', name_en: 'England', continent: '유럽', flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', rank: 4, color: '#003399' },
    { code: 'NOR', name_ko: '노르웨이', name_en: 'Norway', continent: '유럽', flag: '🇳🇴', rank: 21, color: '#EF2B2D' },
    { code: 'BRA', name_ko: '브라질', name_en: 'Brazil', continent: '남미', flag: '🇧🇷', rank: 5, color: '#009C3B' },
    { code: 'ARG', name_ko: '아르헨티나', name_en: 'Argentina', continent: '남미', flag: '🇦🇷', rank: 1, color: '#74ACDF' },
    { code: 'FRA', name_ko: '프랑스', name_en: 'France', continent: '유럽', flag: '🇫🇷', rank: 2, color: '#002395' },
    { code: 'POR', name_ko: '포르투갈', name_en: 'Portugal', continent: '유럽', flag: '🇵🇹', rank: 6, color: '#006600' },
    { code: 'ESP', name_ko: '스페인', name_en: 'Spain', continent: '유럽', flag: '🇪🇸', rank: 7, color: '#AA151B' },
    { code: 'NED', name_ko: '네덜란드', name_en: 'Netherlands', continent: '유럽', flag: '🇳🇱', rank: 7, color: '#FF6600' },
    { code: 'GER', name_ko: '독일', name_en: 'Germany', continent: '유럽', flag: '🇩🇪', rank: 16, color: '#000000' },
    { code: 'BEL', name_ko: '벨기에', name_en: 'Belgium', continent: '유럽', flag: '🇧🇪', rank: 3, color: '#EF3340' },
    { code: 'SEN', name_ko: '세네갈', name_en: 'Senegal', continent: '아프리카', flag: '🇸🇳', rank: 20, color: '#00853F' },
    { code: 'GHA', name_ko: '가나', name_en: 'Ghana', continent: '아프리카', flag: '🇬🇭', rank: 65, color: '#006B3F' },
    { code: 'CIV', name_ko: '코트디부아르', name_en: "Côte d'Ivoire", continent: '아프리카', flag: '🇨🇮', rank: 50, color: '#FF8000' },
    { code: 'JPN', name_ko: '일본', name_en: 'Japan', continent: '아시아', flag: '🇯🇵', rank: 18, color: '#BC002D' },
  ];

  const insertNation = db.prepare(`
    INSERT INTO nations (code, name_ko, name_en, continent, flag_emoji, fifa_rank, color)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  nations.forEach(n => {
    insertNation.run(n.code, n.name_ko, n.name_en, n.continent, n.flag, n.rank, n.color);
  });
  insertNation.finalize();

  // 선수 데이터 (2023-24 시즌 실제 기록)
  const players = [
    // 대한민국
    { name: 'Son Heung-min', name_ko: '손흥민', nation: 'KOR', club: 'Tottenham Hotspur', club_short: 'TOT', pos: 'FW', age: 31, matches: 33, goals: 17, assists: 10, cs: 0, yc: 1, rc: 0, rating: 7.42, initial: 'SH' },
    { name: 'Hwang Hee-chan', name_ko: '황희찬', nation: 'KOR', club: 'Wolverhampton', club_short: 'WOL', pos: 'FW', age: 27, matches: 30, goals: 12, assists: 3, cs: 0, yc: 2, rc: 0, rating: 7.05, initial: 'HH' },
    { name: 'Kim Min-jae', name_ko: '김민재', nation: 'KOR', club: 'Bayern Munich', club_short: 'BAY', pos: 'DF', age: 27, matches: 24, goals: 1, assists: 0, cs: 8, yc: 3, rc: 0, rating: 6.95, initial: 'KM' },

    // 잉글랜드
    { name: 'Cole Palmer', name_ko: '콜 팔머', nation: 'ENG', club: 'Chelsea', club_short: 'CHE', pos: 'MF', age: 21, matches: 34, goals: 22, assists: 11, cs: 0, yc: 2, rc: 0, rating: 7.98, initial: 'CP' },
    { name: 'Phil Foden', name_ko: '필 포든', nation: 'ENG', club: 'Manchester City', club_short: 'MCI', pos: 'MF', age: 23, matches: 35, goals: 19, assists: 8, cs: 0, yc: 1, rc: 0, rating: 7.85, initial: 'PF' },
    { name: 'Bukayo Saka', name_ko: '부카요 사카', nation: 'ENG', club: 'Arsenal', club_short: 'ARS', pos: 'FW', age: 22, matches: 35, goals: 16, assists: 9, cs: 0, yc: 3, rc: 0, rating: 7.80, initial: 'BS' },
    { name: 'Ollie Watkins', name_ko: '올리 왓킨스', nation: 'ENG', club: 'Aston Villa', club_short: 'AVL', pos: 'FW', age: 28, matches: 37, goals: 19, assists: 13, cs: 0, yc: 3, rc: 0, rating: 7.75, initial: 'OW' },
    { name: 'Jarrod Bowen', name_ko: '재러드 보웬', nation: 'ENG', club: 'West Ham United', club_short: 'WHU', pos: 'FW', age: 27, matches: 38, goals: 16, assists: 7, cs: 0, yc: 4, rc: 0, rating: 7.30, initial: 'JB' },

    // 노르웨이
    { name: 'Erling Haaland', name_ko: '얼링 홀란드', nation: 'NOR', club: 'Manchester City', club_short: 'MCI', pos: 'FW', age: 23, matches: 31, goals: 27, assists: 5, cs: 0, yc: 0, rc: 0, rating: 8.05, initial: 'EH' },
    { name: 'Martin Ødegaard', name_ko: '마르틴 외데고르', nation: 'NOR', club: 'Arsenal', club_short: 'ARS', pos: 'MF', age: 25, matches: 23, goals: 8, assists: 7, cs: 0, yc: 4, rc: 0, rating: 7.60, initial: 'MO' },

    // 브라질
    { name: 'Bruno Guimarães', name_ko: '브루누 기마랑이스', nation: 'BRA', club: 'Newcastle United', club_short: 'NEW', pos: 'MF', age: 26, matches: 30, goals: 7, assists: 6, cs: 0, yc: 8, rc: 0, rating: 7.45, initial: 'BG' },
    { name: 'Matheus Cunha', name_ko: '마테우스 쿠냐', nation: 'BRA', club: 'Wolverhampton', club_short: 'WOL', pos: 'FW', age: 25, matches: 35, goals: 14, assists: 9, cs: 0, yc: 5, rc: 0, rating: 7.50, initial: 'MC' },
    { name: 'Gabriel Magalhães', name_ko: '가브리엘 마갈량이스', nation: 'BRA', club: 'Arsenal', club_short: 'ARS', pos: 'DF', age: 26, matches: 35, goals: 8, assists: 1, cs: 14, yc: 6, rc: 0, rating: 7.40, initial: 'GM' },
    { name: 'Douglas Luiz', name_ko: '더글라스 루이스', nation: 'BRA', club: 'Aston Villa', club_short: 'AVL', pos: 'MF', age: 26, matches: 33, goals: 8, assists: 5, cs: 0, yc: 7, rc: 1, rating: 7.20, initial: 'DL' },

    // 아르헨티나
    { name: 'Enzo Fernández', name_ko: '엔조 페르난데스', nation: 'ARG', club: 'Chelsea', club_short: 'CHE', pos: 'MF', age: 23, matches: 32, goals: 3, assists: 5, cs: 0, yc: 9, rc: 1, rating: 6.85, initial: 'EF' },
    { name: 'Emiliano Martínez', name_ko: '에밀리아노 마르티네스', nation: 'ARG', club: 'Aston Villa', club_short: 'AVL', pos: 'GK', age: 31, matches: 35, goals: 0, assists: 0, cs: 12, yc: 1, rc: 0, rating: 7.55, initial: 'EM' },
    { name: 'Alejandro Garnacho', name_ko: '알레한드로 가르나초', nation: 'ARG', club: 'Manchester United', club_short: 'MUN', pos: 'FW', age: 19, matches: 35, goals: 9, assists: 4, cs: 0, yc: 3, rc: 0, rating: 7.10, initial: 'AG' },

    // 프랑스
    { name: 'William Saliba', name_ko: '윌리암 살리바', nation: 'FRA', club: 'Arsenal', club_short: 'ARS', pos: 'DF', age: 23, matches: 38, goals: 2, assists: 1, cs: 16, yc: 3, rc: 0, rating: 7.78, initial: 'WS' },
    { name: 'Ibrahima Konaté', name_ko: '이브라이마 코나테', nation: 'FRA', club: 'Liverpool', club_short: 'LIV', pos: 'DF', age: 25, matches: 28, goals: 1, assists: 0, cs: 11, yc: 2, rc: 0, rating: 7.30, initial: 'IK' },
    { name: 'Yves Bissouma', name_ko: '이브 비수마', nation: 'FRA', club: 'Tottenham Hotspur', club_short: 'TOT', pos: 'MF', age: 27, matches: 30, goals: 2, assists: 3, cs: 0, yc: 6, rc: 0, rating: 6.90, initial: 'YB' },

    // 포르투갈
    { name: 'Bruno Fernandes', name_ko: '브루노 페르난데스', nation: 'POR', club: 'Manchester United', club_short: 'MUN', pos: 'MF', age: 29, matches: 35, goals: 10, assists: 8, cs: 0, yc: 8, rc: 1, rating: 7.00, initial: 'BF' },
    { name: 'Rúben Neves', name_ko: '루벤 네베스', nation: 'POR', club: 'Al-Hilal', club_short: 'ALH', pos: 'MF', age: 27, matches: 28, goals: 3, assists: 2, cs: 0, yc: 5, rc: 0, rating: 6.85, initial: 'RN' },
    { name: 'Diogo Jota', name_ko: '디오구 조타', nation: 'POR', club: 'Liverpool', club_short: 'LIV', pos: 'FW', age: 27, matches: 21, goals: 9, assists: 2, cs: 0, yc: 1, rc: 0, rating: 7.15, initial: 'DJ' },

    // 스페인
    { name: 'Rodri', name_ko: '로드리', nation: 'ESP', club: 'Manchester City', club_short: 'MCI', pos: 'MF', age: 27, matches: 35, goals: 8, assists: 9, cs: 0, yc: 3, rc: 0, rating: 7.92, initial: 'RO' },
    { name: 'David Raya', name_ko: '다비드 라야', nation: 'ESP', club: 'Arsenal', club_short: 'ARS', pos: 'GK', age: 28, matches: 30, goals: 0, assists: 0, cs: 14, yc: 0, rc: 0, rating: 7.65, initial: 'DR' },
    { name: 'Pedro Porro', name_ko: '페드로 포로', nation: 'ESP', club: 'Tottenham Hotspur', club_short: 'TOT', pos: 'DF', age: 24, matches: 35, goals: 3, assists: 6, cs: 0, yc: 7, rc: 0, rating: 7.05, initial: 'PP' },

    // 네덜란드
    { name: 'Virgil van Dijk', name_ko: '버질 판 다이크', nation: 'NED', club: 'Liverpool', club_short: 'LIV', pos: 'DF', age: 32, matches: 37, goals: 4, assists: 3, cs: 14, yc: 3, rc: 0, rating: 7.50, initial: 'VD' },
    { name: 'Ryan Gravenberch', name_ko: '라이언 흐라번베르흐', nation: 'NED', club: 'Liverpool', club_short: 'LIV', pos: 'MF', age: 22, matches: 35, goals: 3, assists: 4, cs: 0, yc: 3, rc: 0, rating: 7.30, initial: 'RG' },
    { name: 'Wout Faes', name_ko: '바우트 파스', nation: 'NED', club: 'Leicester City', club_short: 'LEI', pos: 'DF', age: 26, matches: 30, goals: 2, assists: 0, cs: 5, yc: 8, rc: 1, rating: 6.50, initial: 'WF' },

    // 독일
    { name: 'Kai Havertz', name_ko: '카이 하베르츠', nation: 'GER', club: 'Arsenal', club_short: 'ARS', pos: 'FW', age: 24, matches: 36, goals: 13, assists: 7, cs: 0, yc: 3, rc: 0, rating: 7.35, initial: 'KH' },
    { name: 'Timo Werner', name_ko: '티모 베르너', nation: 'GER', club: 'Tottenham Hotspur', club_short: 'TOT', pos: 'FW', age: 28, matches: 15, goals: 3, assists: 2, cs: 0, yc: 0, rc: 0, rating: 6.70, initial: 'TW' },

    // 벨기에
    { name: 'Kevin De Bruyne', name_ko: '케빈 더 브라위너', nation: 'BEL', club: 'Manchester City', club_short: 'MCI', pos: 'MF', age: 32, matches: 17, goals: 3, assists: 10, cs: 0, yc: 2, rc: 0, rating: 7.60, initial: 'KD' },
    { name: 'Leandro Trossard', name_ko: '레안드로 트로사르', nation: 'BEL', club: 'Arsenal', club_short: 'ARS', pos: 'FW', age: 29, matches: 34, goals: 12, assists: 6, cs: 0, yc: 2, rc: 0, rating: 7.25, initial: 'LT' },

    // 세네갈
    { name: 'Sadio Mané', name_ko: '사디오 마네', nation: 'SEN', club: 'Al-Nassr', club_short: 'ALN', pos: 'FW', age: 32, matches: 18, goals: 4, assists: 2, cs: 0, yc: 1, rc: 0, rating: 6.60, initial: 'SM' },
    { name: 'Edouard Mendy', name_ko: '에두아르 멘디', nation: 'SEN', club: 'Al-Ahli', club_short: 'ALA', pos: 'GK', age: 32, matches: 10, goals: 0, assists: 0, cs: 3, yc: 0, rc: 0, rating: 6.50, initial: 'EM' },

    // 코트디부아르
    { name: 'Nicolas Pépé', name_ko: '니콜라 페페', nation: 'CIV', club: 'OGC Nice', club_short: 'NIC', pos: 'FW', age: 29, matches: 12, goals: 2, assists: 1, cs: 0, yc: 1, rc: 0, rating: 6.40, initial: 'NP' },
    { name: 'Wilfried Zaha', name_ko: '윌프레드 자하', nation: 'CIV', club: 'Crystal Palace', club_short: 'CRY', pos: 'FW', age: 31, matches: 10, goals: 1, assists: 2, cs: 0, yc: 1, rc: 0, rating: 6.55, initial: 'WZ' },

    // 일본
    { name: 'Wataru Endō', name_ko: '엔도 와타루', nation: 'JPN', club: 'Liverpool', club_short: 'LIV', pos: 'MF', age: 30, matches: 28, goals: 2, assists: 1, cs: 0, yc: 4, rc: 0, rating: 6.90, initial: 'WE' },
    { name: 'Takehiro Tomiyasu', name_ko: '도미야스 다케히로', nation: 'JPN', club: 'Arsenal', club_short: 'ARS', pos: 'DF', age: 25, matches: 14, goals: 0, assists: 1, cs: 6, yc: 1, rc: 0, rating: 6.80, initial: 'TT' },
  ];

  const insertPlayer = db.prepare(`
    INSERT INTO players (name, name_ko, nation_code, club, club_short, position, age, matches, goals, assists, clean_sheets, yellow_cards, red_cards, rating, image_initial)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  players.forEach(p => {
    insertPlayer.run(p.name, p.name_ko, p.nation, p.club, p.club_short, p.pos, p.age, p.matches, p.goals, p.assists, p.cs, p.yc, p.rc, p.rating, p.initial);
  });
  insertPlayer.finalize();

  console.log('✅ 데이터베이스 초기화 완료!');
  console.log(`📊 ${nations.length}개 국가, ${players.length}명 선수 데이터 입력 완료`);
});

db.close();
