// ============================================================
// 🌐 PMGFlix API — Servidor Completo
// ============================================================
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const bcrypt = require('bcrypt');
const { userStmts, contentStmts, seasonStmts, episodeStmts, watchStmts, setOwnerByDiscordId } = require('./db');
const { generateToken, requireAuth, requireOwner, canAccess } = require('./auth');

const app = express();
const PORT = process.env.API_PORT || 3001;

// ── Uploads ─────────────────────────────────────────────
const PERSISTENT_DIR = '/var/data';
const UPLOADS = fs.existsSync(PERSISTENT_DIR) ? path.join(PERSISTENT_DIR, 'uploads') : path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS)) fs.mkdirSync(UPLOADS, { recursive: true });
['videos', 'posters', 'subtitles'].forEach(d => {
    const p = path.join(UPLOADS, d);
    if (!fs.existsSync(p)) fs.mkdirSync(p);
});

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        if (file.fieldname === 'poster') cb(null, path.join(UPLOADS, 'posters'));
        else if (file.fieldname === 'subtitle') cb(null, path.join(UPLOADS, 'subtitles'));
        else cb(null, path.join(UPLOADS, 'videos'));
    },
    filename: (req, file, cb) => {
        const ext = path.extname(file.originalname);
        cb(null, `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`);
    },
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

// ── Middleware ───────────────────────────────────────────
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// Serve public/ first (login, admin, player)
app.use(express.static(path.join(__dirname, 'public')));
// Then parent dir for PMGFlix.html and intro.mp4
app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(UPLOADS));

// Set owner flag
if (process.env.OWNER_ID) setOwnerByDiscordId(process.env.OWNER_ID);

// ════════════════════════════════════════════════════════
// 🔐 AUTH ROUTES
// ════════════════════════════════════════════════════════

app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        if (!username || !password) return res.status(400).json({ success: false, message: 'Campos obrigatórios.' });

        const user = userStmts.findByUsername.get(username.trim().toLowerCase());
        if (!user) return res.status(401).json({ success: false, message: 'Usuário não encontrado.' });

        const ok = await bcrypt.compare(password, user.password_hash);
        if (!ok) return res.status(401).json({ success: false, message: 'Senha incorreta.' });
        if (user.status !== 'ativo') return res.status(403).json({ success: false, message: 'Conta inativa.' });

        const token = generateToken(user);
        return res.json({
            success: true,
            message: 'Login realizado!',
            token,
            user: { id: user.id, username: user.username, plan: user.plan, is_owner: user.is_owner, films_watched: user.films_watched },
        });
    } catch (err) {
        console.error('[LOGIN]', err.message);
        res.status(500).json({ success: false, message: 'Erro interno.' });
    }
});

app.get('/me', requireAuth, (req, res) => {
    const u = req.user;
    res.json({ id: u.id, username: u.username, plan: u.plan, is_owner: u.is_owner, films_watched: u.films_watched });
});

// ════════════════════════════════════════════════════════
// 📺 CONTENTS ROUTES
// ════════════════════════════════════════════════════════

app.get('/contents', requireAuth, (req, res) => {
    const all = contentStmts.all.all();
    const user = req.user;
    const contents = all.map(c => {
        const access = canAccess(user, c);
        return { ...c, accessible: access.allowed, reason: access.reason || null };
    });
    res.json(contents);
});

app.get('/contents/:id', requireAuth, (req, res) => {
    const content = contentStmts.byId.get(req.params.id);
    if (!content) return res.status(404).json({ error: 'Não encontrado' });

    const access = canAccess(req.user, content);
    const result = { ...content, accessible: access.allowed, reason: access.reason };

    if (content.type !== 'filme') {
        result.seasons = seasonStmts.byContent.all(content.id).map(s => ({
            ...s,
            episodes: episodeStmts.bySeason.all(s.id),
        }));
    }

    // Progress
    const progress = watchStmts.get.get(req.user.id, content.id, null, null);
    result.progress = progress || null;

    res.json(result);
});

app.get('/contents/:id/access', requireAuth, (req, res) => {
    const content = contentStmts.byId.get(req.params.id);
    if (!content) return res.status(404).json({ error: 'Não encontrado' });
    const access = canAccess(req.user, content);
    res.json(access);
});

// ════════════════════════════════════════════════════════
// ▶️  WATCH PROGRESS ROUTES
// ════════════════════════════════════════════════════════

app.post('/watch/start', requireAuth, (req, res) => {
    const { content_id, episode_id } = req.body;
    const content = contentStmts.byId.get(content_id);
    if (!content) return res.status(404).json({ error: 'Conteúdo não encontrado' });

    const access = canAccess(req.user, content);
    if (!access.allowed) return res.status(403).json(access);

    // Verifica se já tem progresso
    const existing = watchStmts.get.get(req.user.id, content_id, episode_id || null, episode_id || null);
    if (!existing) {
        watchStmts.upsert.run(req.user.id, content_id, episode_id || null, 0, 0, 0);
    }

    const progress = watchStmts.get.get(req.user.id, content_id, episode_id || null, episode_id || null);

    // Pega URL do vídeo
    let videoUrl, subtitleUrl;
    if (episode_id) {
        const ep = episodeStmts.byId.get(episode_id);
        videoUrl = ep?.video_url;
        subtitleUrl = ep?.subtitle_url;
    } else {
        videoUrl = content.video_url;
        subtitleUrl = content.subtitle_url;
    }

    res.json({ allowed: true, videoUrl, subtitleUrl, progress, content });
});

app.patch('/watch/progress', requireAuth, (req, res) => {
    const { content_id, episode_id, progress_seconds, progress_percent, completed } = req.body;
    watchStmts.upsert.run(
        req.user.id, content_id, episode_id || null,
        progress_seconds || 0, progress_percent || 0, completed ? 1 : 0
    );
    // Se completou, incrementa contagem
    if (completed) {
        userStmts.incrementWatched.run(req.user.id);
    }
    res.json({ ok: true });
});

app.get('/watch/history', requireAuth, (req, res) => {
    const history = watchStmts.byUser.all(req.user.id);
    res.json(history);
});

// ════════════════════════════════════════════════════════
// 🔧 ADMIN ROUTES
// ════════════════════════════════════════════════════════

// Criar conteúdo
app.post('/admin/content', requireOwner, upload.fields([
    { name: 'poster', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'subtitle', maxCount: 1 },
]), (req, res) => {
    const { type, title, description, category, required_plan, early_access, video_url, subtitle_url, featured } = req.body;
    const poster = req.files?.poster?.[0] ? `/uploads/posters/${req.files.poster[0].filename}` : null;
    const vid = req.files?.video?.[0] ? `/uploads/videos/${req.files.video[0].filename}` : (video_url || null);
    const sub = req.files?.subtitle?.[0] ? `/uploads/subtitles/${req.files.subtitle[0].filename}` : (subtitle_url || null);

    const isFeatured = (featured === 'true' || featured === '1' || featured === 1 || featured === 'on') ? 1 : 0;
    
    // If setting this as featured, unfeature all others
    if (isFeatured) {
        contentStmts.unfeatureAll.run();
    }

    const result = contentStmts.create.run(type, title, description || '', poster, category || '', required_plan || 'gratis', early_access ? 1 : 0, vid, sub, isFeatured);
    res.json({ id: result.lastInsertRowid, message: 'Conteúdo criado!' });
});

// Editar conteúdo
app.patch('/admin/content/:id', requireOwner, upload.fields([
    { name: 'poster', maxCount: 1 },
    { name: 'video', maxCount: 1 },
    { name: 'subtitle', maxCount: 1 },
]), (req, res) => {
    const existing = contentStmts.byId.get(req.params.id);
    if (!existing) return res.status(404).json({ error: 'Não encontrado' });

    const { type, title, description, category, required_plan, early_access, video_url, subtitle_url, featured } = req.body;
    const poster = req.files?.poster?.[0] ? `/uploads/posters/${req.files.poster[0].filename}` : existing.poster_url;
    const vid = req.files?.video?.[0] ? `/uploads/videos/${req.files.video[0].filename}` : (video_url || existing.video_url);
    const sub = req.files?.subtitle?.[0] ? `/uploads/subtitles/${req.files.subtitle[0].filename}` : (subtitle_url || existing.subtitle_url);

    let isFeatured = existing.featured;
    if (featured !== undefined) {
        isFeatured = (featured === 'true' || featured === '1' || featured === 1 || featured === 'on') ? 1 : 0;
    }

    // If setting this as featured, unfeature all others
    if (isFeatured === 1) {
        contentStmts.unfeatureAll.run();
    }

    contentStmts.update.run(type || existing.type, title || existing.title, description ?? existing.description, poster, category || existing.category, required_plan || existing.required_plan, early_access !== undefined ? (early_access ? 1 : 0) : existing.early_access, vid, sub, isFeatured, req.params.id);
    res.json({ message: 'Conteúdo atualizado!' });
});

// Excluir conteúdo
app.delete('/admin/content/:id', requireOwner, (req, res) => {
    contentStmts.delete.run(req.params.id);
    res.json({ message: 'Conteúdo excluído!' });
});

// Criar temporada
app.post('/admin/content/:id/seasons', requireOwner, (req, res) => {
    const { season_number, title } = req.body;
    const result = seasonStmts.create.run(req.params.id, season_number, title || `Temporada ${season_number}`);
    res.json({ id: result.lastInsertRowid, message: 'Temporada criada!' });
});

// Criar episódio
app.post('/admin/seasons/:id/episodes', requireOwner, upload.fields([
    { name: 'video', maxCount: 1 },
    { name: 'subtitle', maxCount: 1 },
]), (req, res) => {
    const { episode_number, title, description, video_url, subtitle_url } = req.body;
    const vid = req.files?.video?.[0] ? `/uploads/videos/${req.files.video[0].filename}` : (video_url || null);
    const sub = req.files?.subtitle?.[0] ? `/uploads/subtitles/${req.files.subtitle[0].filename}` : (subtitle_url || null);

    const result = episodeStmts.create.run(req.params.id, episode_number, title, description || '', vid, sub);
    res.json({ id: result.lastInsertRowid, message: 'Episódio criado!' });
});

// Listar tudo (admin)
app.get('/admin/contents', requireOwner, (req, res) => {
    const all = contentStmts.all.all();
    res.json(all);
});

// Listar usuários (admin)
app.get('/admin/users', requireOwner, (req, res) => {
    const users = userStmts.all.all();
    res.json(users);
});

// Status
app.get('/api/status', (req, res) => {
    res.json({ online: true, service: 'PMGFlix API', contents: contentStmts.count.get().total });
});

// ════════════════════════════════════════════════════════
// 🚀 START
// ════════════════════════════════════════════════════════
app.listen(PORT, () => {
    console.log(`🌐 PMGFlix API: http://localhost:${PORT}`);
    console.log(`📋 Rotas: /login, /contents, /watch, /admin/*`);
});

module.exports = app;
