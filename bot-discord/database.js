// ============================================================
// 💾 DATABASE — Gerenciador de Usuários (JSON)
// ============================================================

const fs = require('fs');
const path = require('path');

const PERSISTENT_DIR = '/var/data';
const DATA_DIR = fs.existsSync(PERSISTENT_DIR) ? PERSISTENT_DIR : path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'users.json');

// Garante que o diretório e arquivo existem
function init() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(DB_FILE)) fs.writeFileSync(DB_FILE, JSON.stringify({ users: [] }, null, 2));
}

// Lê todos os usuários
function getAll() {
    init();
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    return JSON.parse(raw).users || [];
}

// Salva todos os usuários
function saveAll(users) {
    init();
    fs.writeFileSync(DB_FILE, JSON.stringify({ users }, null, 2));
}

// Busca por username
function findByUsername(username) {
    return getAll().find(u => u.username.toLowerCase() === username.toLowerCase());
}

// Busca por discordId
function findByDiscordId(discordId) {
    return getAll().find(u => u.discordId === discordId);
}

// Cria novo usuário
function createUser(userData) {
    const users = getAll();

    // Remove acesso anterior do mesmo Discord ID se existir
    const filtered = users.filter(u => u.discordId !== userData.discordId);

    filtered.push(userData);
    saveAll(filtered);
    return userData;
}

// Atualiza usuário existente
function updateUser(username, updates) {
    const users = getAll();
    const idx = users.findIndex(u => u.username.toLowerCase() === username.toLowerCase());
    if (idx === -1) return null;
    users[idx] = { ...users[idx], ...updates };
    saveAll(users);
    return users[idx];
}

// Desativa usuário
function deactivateUser(username) {
    return updateUser(username, { status: 'inativo', deactivatedAt: new Date().toISOString() });
}

// Lista todos os ativos
function getActiveUsers() {
    return getAll().filter(u => u.status === 'ativo');
}

// Deleta usuário completamente
function deleteUser(username) {
    const users = getAll();
    const filtered = users.filter(u => u.username.toLowerCase() !== username.toLowerCase());
    saveAll(filtered);
    return filtered;
}

module.exports = {
    init,
    getAll,
    findByUsername,
    findByDiscordId,
    createUser,
    updateUser,
    deactivateUser,
    getActiveUsers,
    deleteUser,
};
