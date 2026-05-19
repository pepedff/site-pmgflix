// ============================================================
// 💾 DB — Banco de Dados SQLite (PMGFlix)
// ============================================================
const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'pmgflix.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ============================================================
// TABELAS
// ============================================================
db.exec(`
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    discord_id TEXT,
    plan TEXT DEFAULT 'gratis' CHECK(plan IN ('gratis','premium','ultra')),
    status TEXT DEFAULT 'ativo' CHECK(status IN ('ativo','inativo')),
    is_owner INTEGER DEFAULT 0,
    films_watched INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS contents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT NOT NULL CHECK(type IN ('filme','serie','minisserie')),
    title TEXT NOT NULL,
    description TEXT,
    poster_url TEXT,
    category TEXT,
    required_plan TEXT DEFAULT 'gratis' CHECK(required_plan IN ('gratis','premium','ultra')),
    early_access INTEGER DEFAULT 0,
    video_url TEXT,
    subtitle_url TEXT,
    featured INTEGER DEFAULT 0,
    created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS seasons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content_id INTEGER NOT NULL,
    season_number INTEGER NOT NULL,
    title TEXT,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS episodes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    season_id INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    video_url TEXT,
    subtitle_url TEXT,
    FOREIGN KEY (season_id) REFERENCES seasons(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS watch_progress (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    content_id INTEGER NOT NULL,
    episode_id INTEGER,
    progress_seconds REAL DEFAULT 0,
    progress_percent REAL DEFAULT 0,
    completed INTEGER DEFAULT 0,
    updated_at TEXT DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE,
    UNIQUE(user_id, content_id, episode_id)
);
`);

// ============================================================
// USERS
// ============================================================
const userStmts = {
    findByUsername: db.prepare('SELECT * FROM users WHERE username = ?'),
    findById: db.prepare('SELECT * FROM users WHERE id = ?'),
    findByDiscord: db.prepare('SELECT * FROM users WHERE discord_id = ?'),
    create: db.prepare('INSERT INTO users (username, password_hash, discord_id, plan, status, is_owner) VALUES (?,?,?,?,?,?)'),
    updateUsername: db.prepare('UPDATE users SET username = ? WHERE id = ?'),
    updatePlan: db.prepare('UPDATE users SET plan = ? WHERE id = ?'),
    updatePassword: db.prepare('UPDATE users SET password_hash = ? WHERE id = ?'),
    updateStatus: db.prepare('UPDATE users SET status = ? WHERE id = ?'),
    incrementWatched: db.prepare('UPDATE users SET films_watched = films_watched + 1 WHERE id = ?'),
    getWatched: db.prepare('SELECT films_watched FROM users WHERE id = ?'),
    setOwner: db.prepare('UPDATE users SET is_owner = 1 WHERE id = ?'),
    delete: db.prepare('DELETE FROM users WHERE id = ?'),
    deleteByUsername: db.prepare('DELETE FROM users WHERE username = ?'),
    all: db.prepare('SELECT id, username, plan, status, is_owner, films_watched, created_at FROM users'),
};

// ============================================================
// CONTENTS
// ============================================================
const contentStmts = {
    all: db.prepare('SELECT * FROM contents ORDER BY created_at DESC'),
    byId: db.prepare('SELECT * FROM contents WHERE id = ?'),
    byPlan: db.prepare(`SELECT * FROM contents WHERE 
        (required_plan = 'gratis') OR 
        (required_plan = 'premium' AND ? IN ('premium','ultra')) OR 
        (required_plan = 'ultra' AND ? = 'ultra')
        ORDER BY created_at DESC`),
    create: db.prepare('INSERT INTO contents (type, title, description, poster_url, category, required_plan, early_access, video_url, subtitle_url, featured) VALUES (?,?,?,?,?,?,?,?,?,?)'),
    update: db.prepare('UPDATE contents SET type=?, title=?, description=?, poster_url=?, category=?, required_plan=?, early_access=?, video_url=?, subtitle_url=?, featured=? WHERE id=?'),
    delete: db.prepare('DELETE FROM contents WHERE id = ?'),
    count: db.prepare('SELECT COUNT(*) as total FROM contents'),
    unfeatureAll: db.prepare('UPDATE contents SET featured = 0'),
};

// ============================================================
// SEASONS
// ============================================================
const seasonStmts = {
    byContent: db.prepare('SELECT * FROM seasons WHERE content_id = ? ORDER BY season_number'),
    byId: db.prepare('SELECT * FROM seasons WHERE id = ?'),
    create: db.prepare('INSERT INTO seasons (content_id, season_number, title) VALUES (?,?,?)'),
    delete: db.prepare('DELETE FROM seasons WHERE id = ?'),
};

// ============================================================
// EPISODES
// ============================================================
const episodeStmts = {
    bySeason: db.prepare('SELECT * FROM episodes WHERE season_id = ? ORDER BY episode_number'),
    byId: db.prepare('SELECT * FROM episodes WHERE id = ?'),
    create: db.prepare('INSERT INTO episodes (season_id, episode_number, title, description, video_url, subtitle_url) VALUES (?,?,?,?,?,?)'),
    delete: db.prepare('DELETE FROM episodes WHERE id = ?'),
    nextEp: db.prepare('SELECT * FROM episodes WHERE season_id = ? AND episode_number > ? ORDER BY episode_number LIMIT 1'),
};

// ============================================================
// WATCH PROGRESS
// ============================================================
const watchStmts = {
    get: db.prepare('SELECT * FROM watch_progress WHERE user_id = ? AND content_id = ? AND (episode_id = ? OR (episode_id IS NULL AND ? IS NULL))'),
    upsert: db.prepare(`INSERT INTO watch_progress (user_id, content_id, episode_id, progress_seconds, progress_percent, completed, updated_at) 
        VALUES (?,?,?,?,?,?,datetime('now'))
        ON CONFLICT(user_id, content_id, episode_id) 
        DO UPDATE SET progress_seconds=excluded.progress_seconds, progress_percent=excluded.progress_percent, completed=excluded.completed, updated_at=datetime('now')`),
    byUser: db.prepare('SELECT wp.*, c.title as content_title, c.poster_url FROM watch_progress wp JOIN contents c ON c.id = wp.content_id WHERE wp.user_id = ? ORDER BY wp.updated_at DESC'),
    countCompleted: db.prepare('SELECT COUNT(DISTINCT content_id) as total FROM watch_progress WHERE user_id = ? AND completed = 1'),
};

// ============================================================
// MIGRAÇÃO — Importa usuários do JSON existente
// ============================================================
function migrateFromJSON() {
    const jsonPath = path.join(DATA_DIR, 'users.json');
    if (!fs.existsSync(jsonPath)) return;
    try {
        const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
        const users = data.users || [];
        if (users.length === 0) return;

        const existing = userStmts.all.all();
        const planMap = { '⭐ Premium': 'premium', '💎 Ultra': 'ultra' };

        for (const u of users) {
            if (existing.find(e => e.username === u.username)) continue;
            const plan = planMap[u.plano] || 'gratis';
            try {
                userStmts.create.run(u.username, u.passwordHash, u.discordId || null, plan, u.status === 'ativo' ? 'ativo' : 'inativo', 0);
                console.log(`[MIGRAÇÃO] Usuário importado: ${u.username} (${plan})`);
            } catch (e) { /* skip duplicates */ }
        }
    } catch (e) {
        console.error('[MIGRAÇÃO] Erro:', e.message);
    }
}
migrateFromJSON();

// AUTO-SEED OWNER USER IF EMPTY
function autoSeedOwner() {
    try {
        // Seed master admin 'dono'
        if (!userStmts.findByUsername.get('dono')) {
            const bcrypt = require('bcrypt');
            const hash = bcrypt.hashSync('senha123', 10);
            userStmts.create.run('dono', hash, null, 'ultra', 'ativo', 1);
            console.log('[DB] Seeding: Usuário "dono" criado!');
        }

        // Seed user 'dogcuteoutra353' com o mesmo hash de senha local!
        if (!userStmts.findByUsername.get('dogcuteoutra353')) {
            userStmts.create.run('dogcuteoutra353', '$2b$10$3rYU3Ord52i1Koun0aALk.uCqfp1dxDXVureYtP0ehH6ZJTRk/7JW', '1443780891112636437', 'ultra', 'ativo', 1);
            console.log('[DB] Seeding: Usuário "dogcuteoutra353" importado!');
        }

        // Seed user 'mel9249' com o mesmo hash de senha local!
        if (!userStmts.findByUsername.get('mel9249')) {
            userStmts.create.run('mel9249', '$2b$10$WgFjIhjPBeWIyOsOMEPBge/owdeipux2KO66JXOB91ZYd1wcvToV2', '1506346688028348517', 'premium', 'ativo', 0);
            console.log('[DB] Seeding: Usuário "mel9249" importado!');
        }
    } catch (e) {
        console.error('[DB] Erro no auto-seeding:', e.message);
    }
}
autoSeedOwner();

// AUTO-SEED CONTENTS IF EMPTY
function autoSeedContents() {
    try {
        const findByTitle = db.prepare('SELECT * FROM contents WHERE title = ?');

        // Seed "DOSAGEM LETAL"
        if (!findByTitle.get('DOSAGEM LETAL')) {
            contentStmts.create.run(
                'filme',
                'DOSAGEM LETAL',
                'Quando pessoas começam a desaparecer sem deixar rastros, Rafael mergulha em uma investigação sombria para descobrir a identidade do impostor que se esconde entre os seus. Mas a verdade está trancada em um porão — e cada dose pode ser a última.',
                '/uploads/posters/1779209525589-l4nxcx64x.jpeg',
                'Suspense',
                'gratis',
                1,
                '/uploads/videos/1779209525595-a50ymvnvb6c.mp4',
                null,
                1
            );
            console.log('[DB] Seeding: Filme "DOSAGEM LETAL" importado com sucesso!');
        }
    } catch (e) {
        console.error('[DB] Erro no auto-seeding de conteúdos:', e.message);
    }
}
autoSeedContents();

// Garante que o OWNER_ID tem is_owner
function setOwnerByDiscordId(discordId) {
    const user = userStmts.findByDiscord.get(discordId);
    if (user && !user.is_owner) {
        userStmts.setOwner.run(user.id);
        console.log(`[DB] Owner flag set for: ${user.username}`);
    }
}

module.exports = {
    db, userStmts, contentStmts, seasonStmts, episodeStmts, watchStmts,
    setOwnerByDiscordId,
};
