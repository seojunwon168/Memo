간단한 메모장 웹사이트를 만드는 과정은 크게 **프론트엔드(화면)**, **백엔드(서버)**, **데이터베이스(저장소)** 세 부분으로 나뉩니다. 초보자가 접근하기 가장 쉬운 **HTML/JS + Node.js + SQLite** 조합으로 설명해 드릴게요.

---

## 1. 프로젝트 구조 및 디자인
화면은 직관적이고 단순하게 구성합니다.

* **입력창:** `textarea` (2~3줄 분량)
* **버튼 영역:** `button` (저장, 불러오기, 삭제)
* **목록 영역:** 저장된 메모들이 나타나는 공간



---

## 2. 프론트엔드 (HTML/CSS)
`index.html` 파일을 생성하여 화면을 구성합니다.

```html
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <title>심플 메모장</title>
    <style>
        body { font-family: sans-serif; display: flex; flex-direction: column; align-items: center; padding: 20px; }
        #memoInput { width: 300px; height: 80px; margin-bottom: 10px; padding: 10px; }
        .btn-group { margin-bottom: 20px; }
        button { cursor: pointer; margin: 0 5px; padding: 5px 15px; }
        #memoList { width: 320px; border-top: 1px solid #ccc; padding-top: 10px; }
        .memo-item { background: #f9f9f9; border: 1px solid #ddd; padding: 10px; margin-bottom: 5px; border-radius: 4px; }
    </style>
</head>
<body>
    <h2>My Notepad</h2>
    <textarea id="memoInput" placeholder="메모를 입력하세요..."></textarea>
    <div class="btn-group">
        <button onclick="saveMemo()">저장</button>
        <button onclick="loadMemos()">불러오기</button>
        <button onclick="clearInput()">초기화</button>
    </div>
    <div id="memoList"></div>

    <script>
        // 백엔드 API와 통신하는 JavaScript 로직이 이곳에 들어갑니다.
    </script>
</body>
</html>
```

---

## 3. 백엔드 및 DB 설정 (Node.js & SQLite)
데이터베이스는 별도의 설치가 필요 없는 파일 기반의 **SQLite**를 추천합니다.

### 1) 환경 구축
터미널에서 아래 명령어를 입력하여 필요한 라이브러리를 설치합니다.
```bash
npm init -y
npm install express sqlite3 body-parser
```

### 2) 서버 코드 (`server.js`)
데이터베이스를 생성하고 메모를 저장/조회하는 API를 만듭니다.

```javascript
const express = require('express');
const sqlite3 = require('sqlite3').verbose();
const bodyParser = require('body-parser');
const app = express();

app.use(bodyParser.json());
app.use(express.static('.')); // HTML 파일 제공

// DB 초기화
const db = new sqlite3.Database('./memo.db');
db.run("CREATE TABLE IF NOT EXISTS memos (id INTEGER PRIMARY KEY AUTOINCREMENT, content TEXT)");

// 메모 저장 API
app.post('/memos', (req, res) => {
    const { content } = req.body;
    db.run("INSERT INTO memos (content) VALUES (?)", [content], function(err) {
        res.json({ id: this.lastID });
    });
});

// 메모 불러오기 API
app.get('/memos', (req, res) => {
    db.all("SELECT * FROM memos ORDER BY id DESC", [], (err, rows) => {
        res.json(rows);
    });
});

// 메모 전체 삭제 API
app.delete('/memos', (req, res) => {
    db.run("DELETE FROM memos", () => {
        res.json({ message: "Deleted all" });
    });
});

app.listen(3000, () => console.log('서버가 http://localhost:3000 에서 실행 중입니다.'));
```

---

## 4. 개발 프로세스 요약

1.  **환경 준비:** Node.js 설치 후 프로젝트 폴더 생성.
2.  **DB 설계:** `memos` 테이블 생성 (ID와 텍스트 내용 컬럼).
3.  **API 개발:** * `POST /memos`: 입력받은 텍스트를 DB에 `INSERT`.
    * `GET /memos`: DB의 내용을 `SELECT`하여 화면에 전달.
    * `DELETE /memos`: 필요 시 `DELETE` 쿼리 실행.
4.  **연결:** HTML의 "저장" 버튼 클릭 시 `fetch()` 함수를 사용하여 서버 API를 호출하도록 작성.

---

이 구조대로라면 한 시간 내에 로컬 환경에서 작동하는 메모장을 완성하실 수 있습니다. 혹시 **특정 프로그래밍 언어(예: 파이썬의 Flask 등)**를 선호하시나요? 원하시는 언어가 있다면 그에 맞춰 코드를 다시 짜드릴 수 있습니다.