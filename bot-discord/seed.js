// ============================================================
// 🗑️ RESET DATABASE — Limpa todos os conteúdos do PMGFlix
// ============================================================

const { db } = require('./db');

console.log('🗑️ Limpando todo o catálogo de filmes, séries e progresso do banco de dados...');

try {
    db.exec(`
        DELETE FROM watch_progress;
        DELETE FROM episodes;
        DELETE FROM seasons;
        DELETE FROM contents;
        DELETE FROM sqlite_sequence WHERE name IN ('contents', 'seasons', 'episodes', 'watch_progress');
    `);
    console.log('✅ Banco de dados limpo com sucesso! Pronto para suas publicações.');
} catch (error) {
    console.error('❌ Erro ao limpar banco de dados:', error.message);
} finally {
    db.close();
}
