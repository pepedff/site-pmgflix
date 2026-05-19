// ============================================================
// 🤖 PMGFlix Bot — Sistema de Pagamentos + Login
// ============================================================

require('dotenv').config();
const {
    Client, GatewayIntentBits, EmbedBuilder,
    ActionRowBuilder, ButtonBuilder, ButtonStyle,
    PermissionsBitField,
} = require('discord.js');
const db = require('./database');
const sqliteDb = require('./db');
const utils = require('./utils');

// ============================================================
// ⚙️  CONFIGURAÇÕES
// ============================================================

const CONFIG = {
    OWNER_ID: process.env.OWNER_ID || '',
    PREFIX: '!',
    PIX: {
        CHAVE: process.env.PIX_CHAVE || 'email@exemplo.com',
        TIPO: 'E-mail',
        TITULAR: 'Pedro Gimenez',
    },
    PLANOS: {
        premium: {
            nome: '⭐ Premium',
            valor: 'R$ 14,90',
            cor: 0x8B5CF6,
            descricao: 'Catálogo completo, 4K, 4 telas, sem anúncios, download offline',
            cargoId: process.env.CARGO_PREMIUM_ID || null,
        },
        ultra: {
            nome: '💎 Ultra',
            valor: 'R$ 24,90',
            cor: 0x6D28D9,
            descricao: 'Tudo do Premium + acesso antecipado, 8 telas, badge exclusivo',
            cargoId: process.env.CARGO_ULTRA_ID || null,
        },
    },
    CORES: {
        PAGAMENTO: 0x8B5CF6,
        APROVADO: 0x22c55e,
        RECUSADO: 0xef4444,
        INFO: 0xf59e0b,
    },
    CANAL_LOGS_ID: process.env.CANAL_LOGS_ID || null,
    API_PORT: process.env.API_PORT || 3001,
};

// ============================================================
// 🚀 INICIALIZAÇÃO
// ============================================================

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
        GatewayIntentBits.GuildMembers,
    ],
});

db.init();

client.once('ready', () => {
    console.log('');
    console.log('╔══════════════════════════════════════════════╗');
    console.log('║       🎬 PMGFlix Bot — Online!               ║');
    console.log('╠══════════════════════════════════════════════╣');
    console.log(`║  Bot: ${client.user.tag.padEnd(38)}║`);
    console.log(`║  Servidores: ${String(client.guilds.cache.size).padEnd(31)}║`);
    console.log(`║  Usuários ativos: ${String(db.getActiveUsers().length).padEnd(26)}║`);
    console.log('╚══════════════════════════════════════════════╝');
    console.log('');
    client.user.setActivity('PMGFlix | !pagar', { type: 3 });
    // Sync owner flag in SQLite
    if (CONFIG.OWNER_ID) sqliteDb.setOwnerByDiscordId(CONFIG.OWNER_ID);
});

// ============================================================
// 💬 COMANDOS
// ============================================================

client.on('messageCreate', async (message) => {
    if (message.author.bot) return;
    if (!message.content.startsWith(CONFIG.PREFIX)) return;

    const args = message.content.slice(CONFIG.PREFIX.length).trim().split(/\s+/);
    const cmd = args.shift().toLowerCase();

    // ── !pagar <plano> ──────────────────────────────────
    if (cmd === 'pagar') {
        const planoKey = args[0]?.toLowerCase();

        if (!planoKey || !CONFIG.PLANOS[planoKey]) {
            const embed = new EmbedBuilder()
                .setColor(CONFIG.CORES.PAGAMENTO)
                .setTitle('🎬 PMGFlix — Planos')
                .setDescription(
                    'Use `!pagar <plano>` para assinar:\n\n' +
                    Object.entries(CONFIG.PLANOS)
                        .map(([k, p]) => `**${p.nome}** — ${p.valor}\n> ${p.descricao}\n> \`!pagar ${k}\``)
                        .join('\n\n')
                )
                .setFooter({ text: 'PMGFlix © 2026' })
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const plano = CONFIG.PLANOS[planoKey];

        // Verifica se já tem acesso ativo
        const existente = db.findByDiscordId(message.author.id);
        if (existente && existente.status === 'ativo') {
            const embed = new EmbedBuilder()
                .setColor(CONFIG.CORES.INFO)
                .setTitle('ℹ️ Você já possui acesso!')
                .setDescription(
                    `Você já tem o plano **${existente.plano}** ativo.\n` +
                    `Seu login: \`${existente.username}\`\n\n` +
                    `Se perdeu sua senha, use \`!resetar\`.`
                )
                .setTimestamp();
            return message.reply({ embeds: [embed] });
        }

        const pagEmbed = new EmbedBuilder()
            .setColor(plano.cor)
            .setTitle(`💳 Pagamento — ${plano.nome}`)
            .setDescription(
                `**${message.author.displayName}**, faça o pagamento via **Pix** abaixo.\n\n` +
                `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
            )
            .addFields(
                { name: '📋 Plano', value: `${plano.nome}\n${plano.descricao}`, inline: true },
                { name: '💰 Valor', value: `**${plano.valor}**/mês`, inline: true },
                { name: '\u200B', value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
                { name: '🔑 Chave Pix', value: `\`${CONFIG.PIX.CHAVE}\``, inline: true },
                { name: '📌 Tipo', value: CONFIG.PIX.TIPO, inline: true },
                { name: '👤 Titular', value: CONFIG.PIX.TITULAR, inline: true },
                { name: '\u200B', value: '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━' },
                {
                    name: '📝 Instruções',
                    value:
                        '1️⃣ Faça o Pix pelo valor acima\n' +
                        '2️⃣ Envie o **comprovante** neste canal\n' +
                        '3️⃣ Aguarde a **aprovação** do admin\n' +
                        '4️⃣ Receba seu **login e senha** por DM! 🎉',
                },
            )
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 128 }))
            .setFooter({ text: `Solicitado por ${message.author.displayName} • PMGFlix` })
            .setTimestamp();

        const botoes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`aprovar_${message.author.id}_${planoKey}`)
                .setLabel('✅ Aprovar Pagamento')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`recusar_${message.author.id}_${planoKey}`)
                .setLabel('❌ Recusar Pagamento')
                .setStyle(ButtonStyle.Danger),
        );

        await message.reply({ embeds: [pagEmbed], components: [botoes] });
        console.log(`[PAGAMENTO] ${message.author.tag} solicitou: ${plano.nome}`);
        return;
    }

    // ── !planos ─────────────────────────────────────────
    if (cmd === 'planos') {
        const embed = new EmbedBuilder()
            .setColor(CONFIG.CORES.PAGAMENTO)
            .setTitle('🎬 PMGFlix — Planos')
            .setDescription(
                Object.entries(CONFIG.PLANOS)
                    .map(([k, p]) => `**${p.nome}** — ${p.valor}\n> ${p.descricao}\n> \`!pagar ${k}\``)
                    .join('\n\n')
            )
            .setFooter({ text: 'PMGFlix © 2026' })
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }

    // ── !minhaconta ─────────────────────────────────────
    if (cmd === 'minhaconta') {
        const user = db.findByDiscordId(message.author.id);
        if (!user || user.status !== 'ativo') {
            return message.reply('❌ Você não possui um plano ativo. Use `!pagar premium` ou `!pagar ultra`.');
        }
        const embed = new EmbedBuilder()
            .setColor(CONFIG.CORES.APROVADO)
            .setTitle('👤 Sua Conta PMGFlix')
            .addFields(
                { name: 'Username', value: `\`${user.username}\``, inline: true },
                { name: 'Plano', value: user.plano, inline: true },
                { name: 'Status', value: '🟢 Ativo', inline: true },
                { name: 'Desde', value: new Date(user.createdAt).toLocaleDateString('pt-BR'), inline: true },
            )
            .setFooter({ text: 'Use !resetar para gerar nova senha' })
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }

    // ── !resetar ────────────────────────────────────────
    if (cmd === 'resetar') {
        const user = db.findByDiscordId(message.author.id);
        if (!user || user.status !== 'ativo') {
            return message.reply('❌ Você não possui um plano ativo.');
        }
        const novaSenha = utils.generatePassword();
        const hash = await utils.hashPassword(novaSenha);
        db.updateUser(user.username, { passwordHash: hash });

        // Sincroniza com SQLite
        try {
            const existingSqlite = sqliteDb.userStmts.findByDiscord.get(message.author.id);
            if (existingSqlite) {
                sqliteDb.userStmts.updatePassword.run(hash, existingSqlite.id);
            }
        } catch (e) {
            console.error('[SQLITE] Erro ao resetar senha:', e.message);
        }

        try {
            const dmEmbed = new EmbedBuilder()
                .setColor(CONFIG.CORES.INFO)
                .setTitle('🔑 Senha Resetada — PMGFlix')
                .setDescription('Sua senha foi alterada com sucesso!')
                .addFields(
                    { name: 'Username', value: `\`${user.username}\`` },
                    { name: 'Nova Senha', value: `\`${novaSenha}\`` },
                )
                .setFooter({ text: '⚠️ Guarde essa senha! Ela não será mostrada novamente.' })
                .setTimestamp();
            await message.author.send({ embeds: [dmEmbed] });
            message.reply('✅ Nova senha enviada no seu **privado (DM)**!');
        } catch {
            message.reply('❌ Não consegui te enviar DM. Ative as mensagens privadas.');
        }
        return;
    }

    // ── !usuarios (somente dono) ────────────────────────
    if (cmd === 'usuarios' || cmd === 'users') {
        if (message.author.id !== CONFIG.OWNER_ID) {
            return message.reply('🚫 Apenas o dono pode usar este comando.');
        }
        const ativos = db.getActiveUsers();
        if (ativos.length === 0) {
            return message.reply('📭 Nenhum usuário ativo no momento.');
        }
        const lista = ativos.map((u, i) =>
            `**${i + 1}.** \`${u.username}\` — ${u.plano} — <@${u.discordId}>`
        ).join('\n');

        const embed = new EmbedBuilder()
            .setColor(CONFIG.CORES.PAGAMENTO)
            .setTitle(`👥 Usuários Ativos (${ativos.length})`)
            .setDescription(lista)
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }

    // ── !revogar <username> (somente dono) ──────────────
    if (cmd === 'revogar') {
        if (message.author.id !== CONFIG.OWNER_ID) {
            return message.reply('🚫 Apenas o dono pode usar este comando.');
        }
        const target = args[0];
        if (!target) return message.reply('Use: `!revogar <username>`');

        const user = db.findByUsername(target);
        if (!user) return message.reply(`❌ Usuário \`${target}\` não encontrado.`);

        db.deactivateUser(target);

        // Sincroniza com SQLite
        try {
            const existingSqlite = sqliteDb.userStmts.findByUsername.get(target);
            if (existingSqlite) {
                sqliteDb.userStmts.updateStatus.run('inativo', existingSqlite.id);
            }
        } catch (e) {
            console.error('[SQLITE] Erro ao revogar acesso:', e.message);
        }

        message.reply(`✅ Acesso de \`${target}\` foi **revogado**.`);
        console.log(`[REVOGADO] ${target} por ${message.author.tag}`);
        return;
    }

    // ── !ajuda ──────────────────────────────────────────
    if (cmd === 'ajuda' || cmd === 'help') {
        const embed = new EmbedBuilder()
            .setColor(CONFIG.CORES.PAGAMENTO)
            .setTitle('🤖 PMGFlix Bot — Comandos')
            .setDescription(
                '**Público:**\n' +
                '`!planos` — Ver planos\n' +
                '`!pagar <plano>` — Solicitar pagamento\n' +
                '`!minhaconta` — Ver seus dados\n' +
                '`!resetar` — Gerar nova senha\n' +
                '`!ajuda` — Este menu\n\n' +
                '**Admin:**\n' +
                '`!usuarios` — Listar usuários ativos\n' +
                '`!revogar <user>` — Revogar acesso'
            )
            .setTimestamp();
        return message.reply({ embeds: [embed] });
    }
});

// ============================================================
// 🔘 BOTÕES — Aprovar / Recusar
// ============================================================

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isButton()) return;
    const id = interaction.customId;
    if (!id.startsWith('aprovar_') && !id.startsWith('recusar_')) return;

    const [acao, userId, planoKey] = id.split('_');

    // Somente dono ou admin
    const isOwner =
        interaction.user.id === CONFIG.OWNER_ID ||
        interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

    if (!isOwner) {
        return interaction.reply({
            content: '🚫 **Apenas o dono pode aprovar ou recusar pagamentos.**',
            ephemeral: true,
        });
    }

    const plano = CONFIG.PLANOS[planoKey];
    if (!plano) return interaction.reply({ content: '❌ Plano inválido.', ephemeral: true });

    const membro = await interaction.guild.members.fetch(userId).catch(() => null);
    const nome = membro?.displayName || `Usuário (${userId})`;

    // ── APROVAR ─────────────────────────────────────────
    if (acao === 'aprovar') {
        // Gera credenciais
        const username = utils.generateUsername(nome);
        const senhaPlain = utils.generatePassword();
        const hash = await utils.hashPassword(senhaPlain);

        // Salva no banco
        const userData = {
            username,
            passwordHash: hash,
            discordId: userId,
            discordTag: membro?.user?.tag || 'N/A',
            plano: plano.nome,
            planoKey,
            status: 'ativo',
            createdAt: new Date().toISOString(),
            approvedBy: interaction.user.tag,
        };
        db.createUser(userData);

        // Salva também no SQLite (plataforma de streaming)
        try {
            const existingSqlite = sqliteDb.userStmts.findByDiscord.get(userId);
            if (existingSqlite) {
                sqliteDb.userStmts.updateUsername.run(username, existingSqlite.id);
                sqliteDb.userStmts.updatePlan.run(planoKey, existingSqlite.id);
                sqliteDb.userStmts.updatePassword.run(hash, existingSqlite.id);
                sqliteDb.userStmts.updateStatus.run('ativo', existingSqlite.id);
            } else {
                sqliteDb.userStmts.create.run(username, hash, userId, planoKey, 'ativo', userId === CONFIG.OWNER_ID ? 1 : 0);
            }
            console.log(`[SQLITE] Usuário ${username} sincronizado (${planoKey})`);
        } catch (e) { console.error('[SQLITE] Erro sync:', e.message); }

        // Adiciona cargo
        if (plano.cargoId && membro) {
            try {
                await membro.roles.add(plano.cargoId);
            } catch (err) {
                console.error(`[CARGO] Erro: ${err.message}`);
            }
        }

        // Embed pública
        const aprovEmbed = new EmbedBuilder()
            .setColor(CONFIG.CORES.APROVADO)
            .setTitle('✅ Pagamento Aprovado!')
            .setDescription(
                `Pagamento de **${nome}** aprovado!\n\n` +
                `**Plano:** ${plano.nome}\n` +
                `**Aprovado por:** ${interaction.user.displayName}\n\n` +
                `🎉 Login enviado por DM, <@${userId}>!`
            )
            .setTimestamp();

        await interaction.update({ embeds: [aprovEmbed], components: [] });

        // DM com credenciais
        if (membro) {
            try {
                const dmEmbed = new EmbedBuilder()
                    .setColor(CONFIG.CORES.APROVADO)
                    .setTitle('🎉 Bem-vindo ao PMGFlix!')
                    .setDescription(
                        `Seu pagamento foi **aprovado** e sua conta foi criada!\n\n` +
                        `Use essas credenciais para fazer login no site:\n\n` +
                        `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
                    )
                    .addFields(
                        { name: '👤 Username', value: `\`${username}\`` },
                        { name: '🔑 Senha', value: `\`${senhaPlain}\`` },
                        { name: '📋 Plano', value: plano.nome },
                        { name: '🌐 Site', value: '`https://site-pmgflix.vercel.app` (ou Vercel)' },
                    )
                    .setFooter({ text: '⚠️ Guarde essas credenciais! Use !resetar se perder a senha.' })
                    .setTimestamp();

                await membro.send({ embeds: [dmEmbed] });
            } catch {
                console.log(`[DM] Falha ao enviar DM para ${nome}`);
            }
        }

        // Log
        if (CONFIG.CANAL_LOGS_ID) {
            try {
                const canal = await interaction.guild.channels.fetch(CONFIG.CANAL_LOGS_ID);
                const logEmbed = new EmbedBuilder()
                    .setColor(CONFIG.CORES.APROVADO)
                    .setTitle('📝 Log — Pagamento Aprovado')
                    .addFields(
                        { name: 'Usuário', value: `${nome} (<@${userId}>)`, inline: true },
                        { name: 'Login', value: `\`${username}\``, inline: true },
                        { name: 'Plano', value: plano.nome, inline: true },
                        { name: 'Admin', value: interaction.user.displayName, inline: true },
                    )
                    .setTimestamp();
                await canal.send({ embeds: [logEmbed] });
            } catch {}
        }

        console.log(`[APROVADO] ${nome} → login: ${username} — ${plano.nome}`);
        return;
    }

    // ── RECUSAR ─────────────────────────────────────────
    if (acao === 'recusar') {
        const recEmbed = new EmbedBuilder()
            .setColor(CONFIG.CORES.RECUSADO)
            .setTitle('❌ Pagamento Recusado')
            .setDescription(
                `Pagamento de **${nome}** foi **recusado**.\n\n` +
                `**Plano:** ${plano.nome}\n` +
                `**Recusado por:** ${interaction.user.displayName}\n\n` +
                `<@${userId}>, entre em contato se houve um erro.`
            )
            .setTimestamp();

        await interaction.update({ embeds: [recEmbed], components: [] });

        if (membro) {
            try {
                await membro.send({
                    embeds: [
                        new EmbedBuilder()
                            .setColor(CONFIG.CORES.RECUSADO)
                            .setTitle('❌ Pagamento Recusado')
                            .setDescription(`Seu pagamento para **${plano.nome}** foi recusado.\nEntre em contato com a administração.`)
                            .setTimestamp(),
                    ],
                });
            } catch {}
        }

        console.log(`[RECUSADO] ${nome} — ${plano.nome}`);
        return;
    }
});

// ============================================================
// 🔑 LOGIN
// ============================================================

const TOKEN = process.env.DISCORD_TOKEN;
if (!TOKEN) {
    console.error('❌ Token não encontrado! Configure o .env');
    process.exit(1);
}

client.login(TOKEN);

// Exporta client para uso no server.js
module.exports = { client, CONFIG };
