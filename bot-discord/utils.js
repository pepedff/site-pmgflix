// ============================================================
// 🔧 UTILS — Funções Utilitárias
// ============================================================

const crypto = require('crypto');
const bcrypt = require('bcrypt');

const SALT_ROUNDS = 10;

// Gera username baseado no nome do Discord (sem sufixos aleatórios a menos que necessário)
function generateUsername(displayName, db) {
    const clean = displayName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '')
        .substring(0, 15) || 'user';
    
    // Se não passarem o DB, usa o padrão antigo como fallback de segurança
    if (!db) {
        return `${clean}${crypto.randomInt(100, 9999)}`;
    }

    let username = clean;
    let suffix = 1;

    // Enquanto o username existir no DB, tenta outro
    while (db.findByUsername(username)) {
        username = `${clean}${suffix}`;
        suffix++;
    }

    return username;
}

// Gera senha aleatória legível (12 caracteres)
function generatePassword() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789';
    let pwd = '';
    for (let i = 0; i < 12; i++) {
        pwd += chars.charAt(crypto.randomInt(0, chars.length));
    }
    return pwd;
}

// Hash da senha com bcrypt
async function hashPassword(password) {
    return bcrypt.hash(password, SALT_ROUNDS);
}

// Compara senha com hash
async function comparePassword(password, hash) {
    return bcrypt.compare(password, hash);
}

// Gera token de sessão
function generateToken() {
    return crypto.randomBytes(32).toString('hex');
}

module.exports = {
    generateUsername,
    generatePassword,
    hashPassword,
    comparePassword,
    generateToken,
};
