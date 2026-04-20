/* ═══════════════════════════════════════════
   Premier League Global — Frontend Logic
   ═══════════════════════════════════════════ */

const API = '';  // 같은 서버에서 서빙

// ─── 상태 ────────────────────────────────────
let allNations = [];
let nationsChart = null;
let activeContinent = 'ALL';
let activeNationCode = 'ALL';
let activeRankTab = 'goals';

// ─── 초기화 ──────────────────────────────────
document.addEventListener('DOMContentLoaded', async () => {
  setupNavbar();
  setupNavLinks();
  await loadHeroStats();
  await loadNations();
  await loadPlayers();
  await loadRankings('goals');
  setupFilters();
  setupModal();
  setupMobileMenu();
});

// ─── 네비게이션 스크롤 효과 ──────────────────
function setupNavbar() {
  window.addEventListener('scroll', () => {
    const nav = document.getElementById('navbar');
    nav.classList.toggle('scrolled', window.scrollY > 50);
  });
}

// ─── Nav 링크 클릭 ───────────────────────────
function setupNavLinks() {
  document.querySelectorAll('.nav-link').forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const section = link.dataset.section;
      scrollToSection(section);
      document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
      link.classList.add('active');
    });
  });
}

function scrollToSection(id) {
  const el = document.getElementById(`section-${id}`);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// ─── 히어로 통계 ─────────────────────────────
async function loadHeroStats() {
  try {
    const [nations, players] = await Promise.all([
      fetch(`${API}/api/nations`).then(r => r.json()),
      fetch(`${API}/api/players?limit=999`).then(r => r.json()),
    ]);
    const totalGoals = players.reduce((s, p) => s + p.goals, 0);
    animateNumber('stat-nations', nations.length, '개국');
    animateNumber('stat-players', players.length, '명');
    animateNumber('stat-goals', totalGoals, '골');
  } catch (e) { console.error('히어로 스탯 로드 실패:', e); }
}

function animateNumber(id, target, suffix = '') {
  const el = document.getElementById(id);
  const duration = 1500;
  const start = performance.now();
  const update = (now) => {
    const p = Math.min((now - start) / duration, 1);
    const ease = 1 - Math.pow(1 - p, 3);
    el.textContent = Math.round(ease * target) + suffix;
    if (p < 1) requestAnimationFrame(update);
  };
  requestAnimationFrame(update);
}

// ─── 국가 탐색 ───────────────────────────────
async function loadNations() {
  try {
    allNations = await fetch(`${API}/api/nations`).then(r => r.json());
    renderNationCards(allNations);
    populateNationFilter(allNations);
    await drawNationsChart(allNations);
  } catch (e) {
    document.getElementById('nations-grid').innerHTML =
      '<p style="color:var(--red);grid-column:1/-1;text-align:center;">데이터 로드 실패. 서버를 확인하세요.</p>';
  }
}

function renderNationCards(nations) {
  const grid = document.getElementById('nations-grid');
  if (!nations.length) {
    grid.innerHTML = '<p style="color:var(--text-muted);grid-column:1/-1;text-align:center;">해당 대륙에 등록된 국가가 없습니다.</p>';
    return;
  }
  grid.innerHTML = nations.map(n => `
    <div class="nation-card" id="nation-card-${n.code}"
      style="--card-color:${n.color}"
      onclick="selectNation('${n.code}')">
      <span class="card-flag">${n.flag_emoji}</span>
      <div class="card-name">${n.name_ko}</div>
      <div class="card-continent">${n.continent} · FIFA ${n.fifa_rank}위</div>
      <div class="card-stats">
        <div class="card-stat">
          <span class="card-stat-num">${n.player_count}</span>
          <span class="card-stat-label">선수</span>
        </div>
        <div class="card-stat">
          <span class="card-stat-num">${n.total_goals}</span>
          <span class="card-stat-label">득점</span>
        </div>
        <div class="card-stat">
          <span class="card-stat-num">${n.avg_rating}</span>
          <span class="card-stat-label">평점</span>
        </div>
      </div>
    </div>
  `).join('');
}

function selectNation(code) {
  // 카드 활성화
  document.querySelectorAll('.nation-card').forEach(c => c.classList.remove('active'));
  const card = document.getElementById(`nation-card-${code}`);
  if (card) card.classList.add('active');

  // 국가 필터 동기화
  activeNationCode = code;
  const sel = document.getElementById('filter-nation');
  if (sel) sel.value = code;

  // 선수 목록 섹션으로 이동 & 로드
  scrollToSection('players');
  loadPlayers();
}

// 대륙 필터
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.filter-btn[data-continent]').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.filter-btn[data-continent]').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeContinent = btn.dataset.continent;
      const filtered = activeContinent === 'ALL'
        ? allNations
        : allNations.filter(n => n.continent === activeContinent);
      renderNationCards(filtered);
    });
  });
});

// ─── 국가 필터 셀렉트 채우기 ─────────────────
function populateNationFilter(nations) {
  const sel = document.getElementById('filter-nation');
  nations.forEach(n => {
    const opt = document.createElement('option');
    opt.value = n.code;
    opt.textContent = `${n.flag_emoji} ${n.name_ko}`;
    sel.appendChild(opt);
  });
}

// ─── 선수 목록 로드 ──────────────────────────
async function loadPlayers() {
  const tbody = document.getElementById('players-tbody');
  tbody.innerHTML = '<tr><td colspan="11" class="loading-cell"><div class="spinner"></div></td></tr>';

  const nation   = document.getElementById('filter-nation').value;
  const position = document.getElementById('filter-position').value;
  const sort     = document.getElementById('filter-sort').value;

  activeNationCode = nation;

  try {
    const params = new URLSearchParams({ nation, position, sort, limit: 50 });
    const players = await fetch(`${API}/api/players?${params}`).then(r => r.json());
    renderPlayersTable(players);
  } catch (e) {
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:var(--red);padding:2rem;">선수 데이터 로드 실패!</td></tr>';
  }
}

function renderPlayersTable(players) {
  const tbody = document.getElementById('players-tbody');
  if (!players.length) {
    tbody.innerHTML = '<tr><td colspan="11" style="text-align:center;color:var(--text-muted);padding:2rem;">조건에 맞는 선수가 없습니다.</td></tr>';
    return;
  }
  tbody.innerHTML = players.map((p, i) => {
    const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
    const ratingClass = p.rating >= 7.5 ? 'rating-high' : p.rating >= 7.0 ? 'rating-mid' : 'rating-low';
    return `
    <tr onclick="openPlayerModal(${p.id})" title="${p.name_ko} 상세 보기">
      <td class="rank-cell ${rankClass}">${i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : i + 1}</td>
      <td>
        <div class="player-cell">
          <div class="player-avatar" style="background:linear-gradient(135deg,${p.nation_color || 'var(--accent)'},rgba(0,0,0,0.5))">${p.image_initial}</div>
          <div>
            <div class="player-name">${p.name_ko}</div>
            <div class="player-name-ko">${p.name}</div>
          </div>
        </div>
      </td>
      <td>
        <div class="nation-cell">
          <span class="nation-flag">${p.flag_emoji}</span>
          <span class="nation-name-small">${p.nation_name}</span>
        </div>
      </td>
      <td>${p.club_short}</td>
      <td><span class="pos-badge pos-${p.position}">${p.position}</span></td>
      <td>${p.matches}</td>
      <td class="stat-highlight">${p.goals}</td>
      <td class="stat-highlight">${p.assists}</td>
      <td>${p.clean_sheets}</td>
      <td>${p.yellow_cards}${p.red_cards > 0 ? ` <span style="color:var(--red)">🟥${p.red_cards}</span>` : ''}</td>
      <td><span class="rating-cell ${ratingClass}">${p.rating.toFixed(2)}</span></td>
    </tr>`;
  }).join('');
}

// ─── 필터 설정 ───────────────────────────────
function setupFilters() {
  document.getElementById('btn-apply-filter').addEventListener('click', loadPlayers);
  ['filter-nation', 'filter-position', 'filter-sort'].forEach(id => {
    document.getElementById(id).addEventListener('change', loadPlayers);
  });
}

// ─── 랭킹 탭 ────────────────────────────────
async function loadRankings(type) {
  const content = document.getElementById('rankings-content');
  content.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';

  try {
    if (type === 'nations') {
      const data = await fetch(`${API}/api/nation-rankings`).then(r => r.json());
      renderNationRankings(data);
    } else {
      const colMap = { goals: '득점', assists: '도움', rating: '평점', clean_sheets: '클린시트' };
      const data = await fetch(`${API}/api/rankings?type=${type}&limit=10`).then(r => r.json());
      renderPlayerRankings(data, type, colMap[type]);
    }
  } catch (e) {
    content.innerHTML = '<p style="text-align:center;color:var(--red)">랭킹 데이터 로드 실패</p>';
  }
}

function renderPlayerRankings(players, type, label) {
  const content = document.getElementById('rankings-content');
  content.innerHTML = `<div class="rankings-list">
    ${players.map((p, i) => {
      const rankClass = i === 0 ? 'rank-1' : i === 1 ? 'rank-2' : i === 2 ? 'rank-3' : '';
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
      const val = type === 'rating' ? p[type].toFixed(2) : p[type];
      return `
      <div class="ranking-item" onclick="openPlayerModal(${p.id})">
        <div class="ranking-rank ${rankClass}">${medal}</div>
        <div class="ranking-avatar" style="background:linear-gradient(135deg,${p.nation_color || 'var(--accent)'},rgba(0,0,0,0.5))">${p.image_initial}</div>
        <div class="ranking-info">
          <div class="ranking-name">${p.name_ko}</div>
          <div class="ranking-sub">${p.flag_emoji} ${p.nation_name} · ${p.club_short} · ${p.position}</div>
        </div>
        <div>
          <div class="ranking-value">${val}</div>
          <div class="ranking-label">${label}</div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function renderNationRankings(nations) {
  const maxGoals = Math.max(...nations.map(n => n.total_goals || 0), 1);
  const content = document.getElementById('rankings-content');
  content.innerHTML = `<div class="rankings-list">
    ${nations.map((n, i) => {
      const pct = Math.round(((n.total_goals || 0) / maxGoals) * 100);
      const medal = i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}`;
      return `
      <div class="nation-ranking-item">
        <div class="ranking-rank">${medal}</div>
        <div class="nr-flag">${n.flag_emoji}</div>
        <div class="nr-info">
          <div class="nr-name">${n.name_ko}</div>
          <div class="nr-stats">
            <div class="nr-stat"><span>${n.total_goals || 0}</span>총 득점</div>
            <div class="nr-stat"><span>${n.total_assists || 0}</span>총 도움</div>
            <div class="nr-stat"><span>${n.player_count}</span>선수 수</div>
            <div class="nr-stat"><span>${n.avg_rating}</span>평균 평점</div>
          </div>
          <div class="nr-bar-bg"><div class="nr-bar-fill" style="width:${pct}%"></div></div>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

// 탭 이벤트
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeRankTab = btn.dataset.tab;
      loadRankings(activeRankTab);
    });
  });
});

// ─── 국가별 득점 차트 ────────────────────────
async function drawNationsChart(nations) {
  const ctx = document.getElementById('nations-chart').getContext('2d');
  const top = nations.slice(0, 10);
  const labels = top.map(n => `${n.flag_emoji} ${n.name_ko}`);
  const goals   = top.map(n => n.total_goals);
  const assists = top.map(n => n.total_assists);

  if (nationsChart) nationsChart.destroy();
  nationsChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels,
      datasets: [
        {
          label: '총 득점',
          data: goals,
          backgroundColor: 'rgba(108,99,255,0.7)',
          borderColor: '#6c63ff',
          borderWidth: 1,
          borderRadius: 6,
        },
        {
          label: '총 도움',
          data: assists,
          backgroundColor: 'rgba(251,191,36,0.6)',
          borderColor: '#fbbf24',
          borderWidth: 1,
          borderRadius: 6,
        },
      ],
    },
    options: {
      responsive: true,
      plugins: {
        legend: { labels: { color: '#94a3b8', font: { family: 'Inter', size: 12 } } },
        tooltip: {
          backgroundColor: '#131929',
          borderColor: 'rgba(255,255,255,0.1)',
          borderWidth: 1,
          titleColor: '#f1f5f9',
          bodyColor: '#94a3b8',
        },
      },
      scales: {
        x: { ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(255,255,255,0.04)' } },
        y: { ticks: { color: '#94a3b8', font: { family: 'Inter', size: 11 } }, grid: { color: 'rgba(255,255,255,0.06)' } },
      },
    },
  });
}

// ─── 선수 모달 ───────────────────────────────
function setupModal() {
  const overlay = document.getElementById('player-modal');
  document.getElementById('modal-close-btn').addEventListener('click', closeModal);
  overlay.addEventListener('click', e => { if (e.target === overlay) closeModal(); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') closeModal(); });
}

async function openPlayerModal(id) {
  try {
    const p = await fetch(`${API}/api/players/${id}`).then(r => r.json());
    const ratingClass = p.rating >= 7.5 ? 'rating-high' : p.rating >= 7.0 ? 'rating-mid' : 'rating-low';

    document.getElementById('modal-content').innerHTML = `
      <div class="modal-header">
        <div class="modal-avatar" style="background:linear-gradient(135deg,${p.nation_color || 'var(--accent)'},rgba(0,0,0,0.5))">${p.image_initial}</div>
        <div>
          <div class="modal-title">${p.name_ko}</div>
          <div class="modal-subtitle">${p.name}</div>
          <div style="margin-top:6px;font-size:0.8rem;color:var(--text-muted)">${p.flag_emoji} ${p.nation_name} · ${p.club} · ${p.position}</div>
        </div>
      </div>

      <div class="modal-stats-grid">
        <div class="modal-stat-card">
          <div class="modal-stat-value">${p.goals}</div>
          <div class="modal-stat-label">⚽ 득점</div>
        </div>
        <div class="modal-stat-card">
          <div class="modal-stat-value">${p.assists}</div>
          <div class="modal-stat-label">🎯 도움</div>
        </div>
        <div class="modal-stat-card">
          <div class="modal-stat-value">${p.goals + p.assists}</div>
          <div class="modal-stat-label">📊 공격포인트</div>
        </div>
        <div class="modal-stat-card">
          <div class="modal-stat-value">${p.matches}</div>
          <div class="modal-stat-label">📅 출전경기</div>
        </div>
        <div class="modal-stat-card">
          <div class="modal-stat-value">${p.clean_sheets}</div>
          <div class="modal-stat-label">🧤 클린시트</div>
        </div>
        <div class="modal-stat-card">
          <div class="modal-stat-value"><span class="rating-cell ${ratingClass}" style="font-size:1.5rem">${p.rating.toFixed(2)}</span></div>
          <div class="modal-stat-label">⭐ 평점</div>
        </div>
      </div>

      <div>
        <div class="modal-info-row">
          <span class="modal-info-label">나이</span>
          <span class="modal-info-value">${p.age}세</span>
        </div>
        <div class="modal-info-row">
          <span class="modal-info-label">국적</span>
          <span class="modal-info-value">${p.flag_emoji} ${p.nation_name} (${p.continent})</span>
        </div>
        <div class="modal-info-row">
          <span class="modal-info-label">소속 클럽</span>
          <span class="modal-info-value">${p.club}</span>
        </div>
        <div class="modal-info-row">
          <span class="modal-info-label">포지션</span>
          <span class="modal-info-value"><span class="pos-badge pos-${p.position}">${p.position}</span></span>
        </div>
        <div class="modal-info-row">
          <span class="modal-info-label">경고 / 퇴장</span>
          <span class="modal-info-value">${p.yellow_cards}🟨 / ${p.red_cards}🟥</span>
        </div>
        <div class="modal-info-row">
          <span class="modal-info-label">시즌</span>
          <span class="modal-info-value">${p.season}</span>
        </div>
        <div class="modal-info-row">
          <span class="modal-info-label">경기당 득점</span>
          <span class="modal-info-value">${p.matches > 0 ? (p.goals / p.matches).toFixed(2) : '0.00'}</span>
        </div>
        <div class="modal-info-row">
          <span class="modal-info-label">경기당 도움</span>
          <span class="modal-info-value">${p.matches > 0 ? (p.assists / p.matches).toFixed(2) : '0.00'}</span>
        </div>
      </div>
    `;
    document.getElementById('player-modal').classList.add('open');
    document.body.style.overflow = 'hidden';
  } catch (e) {
    console.error('선수 상세 로드 실패:', e);
  }
}

function closeModal() {
  document.getElementById('player-modal').classList.remove('open');
  document.body.style.overflow = '';
}

// ─── 모바일 메뉴 ─────────────────────────────
function setupMobileMenu() {
  const btn = document.getElementById('mobile-menu-btn');
  const links = document.querySelector('.nav-links');
  btn.addEventListener('click', () => {
    const isOpen = links.style.display === 'flex';
    links.style.display = isOpen ? 'none' : 'flex';
    links.style.flexDirection = 'column';
    links.style.position = 'absolute';
    links.style.top = '64px';
    links.style.left = '0';
    links.style.right = '0';
    links.style.background = 'rgba(10,14,26,0.98)';
    links.style.padding = '1rem';
    links.style.borderBottom = '1px solid var(--border)';
  });
}
