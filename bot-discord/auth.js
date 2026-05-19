// ============================================================
// 🔐 AUTH — JWT Middleware
// ============================================================
const jwt = require('jsonwebtoken');
const { userStmts } = require('./db');

const SECRET = process.env.JWT_SECRET || 'pmgflix_secret_2026_ultra';

// Gera token JWT
function generateToken(user) {
    return jwt.sign(
        { id: user.id, username: user.username, plan: user.plan, is_owner: user.is_owner },
        SECRET,
        { expiresIn: '7d' }
    );
}

// Middleware: requer autenticação
function requireAuth(req, res, next) {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : req.query.token;
    if (!token) return res.status(401).json({ error: 'Token não fornecido' });
    try {
        const decoded = jwt.verify(token, SECRET);
        const user = userStmts.findById.get(decoded.id);
        if (!user || user.status !== 'ativo') return res.status(403).json({ error: 'Conta inativa' });
        req.user = user;
        next();
    } catch {
        return res.status(401).json({ error: 'Token inválido' });
    }
}

// Middleware: requer dono
function requireOwner(req, res, next) {
    requireAuth(req, res, () => {
        if (!req.user.is_owner) return res.status(403).json({ error: 'Acesso negado' });
        next();
    });
}

// Verifica se usuário pode acessar conteúdo
function canAccess(user, content) {
    const planLevel = { gratis: 0, premium: 1, ultra: 2 };
    const userLevel = planLevel[user.plan] || 0;
    const requiredLevel = planLevel[content.required_plan] || 0;

    // Acesso antecipado: só ultra
    if (content.early_access && user.plan !== 'ultra') {
        return { allowed: false, reason: 'Conteúdo antecipado — exclusivo para plano Ultra.' };
    }
    // Plano insuficiente
    if (userLevel < requiredLevel) {
        return { allowed: false, reason: `Este conteúdo requer o plano ${content.required_plan}.` };
    }
    // Grátis: limite de 3 filmes
    if (user.plan === 'gratis') {
        const watched = userStmts.getWatched.get(user.id);
        if (watched && watched.films_watched >= 3) {
            return { allowed: false, reason: 'Você atingiu o limite de 3 filmes gratuitos. Assine Premium!' };
        }
    }
    return { allowed: true };
}

module.exports = { generateToken, requireAuth, requireOwner, canAccess, SECRET };
