// ============================================================
// 🎬 PMGFlix Bot — Sistema de Pagamentos + Login
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
            nome: 'Premium',
            emoji: '⭐',
            tag: '⭐ PREMIUM',
            valor: 'R$ 14,90',
            valorNum: 14.90,
            cor: 0x8B5CF6,
            descricao: 'O essencial para curtir o melhor do streaming',
            beneficios: [
                { icon: '🎬', text: 'Catálogo completo' },
                { icon: '📺', text: 'Qualidade 4K Ultra HD' },
                { icon: '👥', text: 'Até 4 telas simultâneas' },
                { icon: '🚫', text: 'Sem anúncios' },
                { icon: '📥', text: 'Download offline' },
            ],
            cargoId: process.env.CARGO_PREMIUM_ID || null,
        },
        ultra: {
            nome: 'Ultra',
            emoji: '💎',
            tag: '💎 ULTRA',
            valor: 'R$ 24,90',
            valorNum: 24.90,
            cor: 0x6D28D9,
            descricao: 'A experiência completa, sem limites',
            beneficios: [
                { icon: '✨', text: 'Tudo do plano Premium' },
                { icon: '🚀', text: 'Acesso antecipado a lançamentos' },
                { icon: '👥', text: 'Até 8 telas simultâneas' },
                { icon: '🏆', text: 'Badge exclusivo no Discord' },
                { icon: '⚡', text: 'Suporte prioritário' },
            ],
            cargoId: process.env.CARGO_ULTRA_ID || null,
        },
    },
    CORES: {
        PRIMARIA: 0x8B5CF6,
        PREMIUM: 0x8B5CF6,
        ULTRA: 0x6D28D9,
        SUCESSO: 0x22C55E,
        ERRO: 0xEF4444,
        AVISO: 0xF59E0B,
        INFO: 0x3B82F6,
    },
    LINKS: {
        SITE: 'https://site-pmgflix.onrender.com',
        SUPORTE: 'https://discord.gg/seuconvite',
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
    client.user.setActivity('🎬 PMGFlix | !ajuda', { type: 3 });
    if (CONFIG.OWNER_ID) sqliteDb.setOwnerByDiscordId(CONFIG.OWNER_ID);
});

// ============================================================
// 🎨 HELPERS DE EMBED
// ============================================================

function baseEmbed(cor = CONFIG.CORES.PRIMARIA) {
    return new EmbedBuilder()
        .setColor(cor)
        .setFooter({
            text: `PMGFlix  •  Streaming Premium`,
            iconURL: client.user?.displayAvatarURL?.() || undefined,
        })
        .setTimestamp();
}

function errorEmbed(titulo, descricao) {
    return baseEmbed(CONFIG.CORES.ERRO)
        .setTitle(`❌  ${titulo}`)
        .setDescription(descricao);
}

function successEmbed(titulo, descricao) {
    return baseEmbed(CONFIG.CORES.SUCESSO)
        .setTitle(`✅  ${titulo}`)
        .setDescription(descricao);
}

function infoEmbed(titulo, descricao) {
    return baseEmbed(CONFIG.CORES.INFO)
        .setTitle(`ℹ️  ${titulo}`)
        .setDescription(descricao);
}

/** Campo de embed que representa um plano (usado em !planos e !pagar sem args) */
function planoField(key, p) {
    const beneficios = p.beneficios.map(b => `${b.icon}  ${b.text}`).join('\n');
    return {
        name: `${p.emoji}  ${p.nome} — ${p.valor}/mês`,
        value: `*${p.descricao}*\n\n${beneficios}\n\n➜ \`!pagar ${key}\``,
        inline: true,
    };
}

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
            const embed = baseEmbed(CONFIG.CORES.PRIMARIA)
                .setAuthor({ name: 'PMGFlix', iconURL: client.user?.displayAvatarURL?.() })
                .setTitle('🎬  Planos disponíveis')
                .setDescription('Escolha o plano ideal e comece a assistir hoje mesmo.')
                .addFields(
                    ...Object.entries(CONFIG.PLANOS).map(([k, p]) => planoField(k, p)),
                )
                .setFooter({ text: 'Use !pagar <plano> para assinar' });
            return message.reply({ embeds: [embed] });
        }

        const plano = CONFIG.PLANOS[planoKey];

        // Já é assinante
        const existente = db.findByDiscordId(message.author.id);
        if (existente && existente.status === 'ativo') {
            const embed = baseEmbed(CONFIG.CORES.AVISO)
                .setTitle('⚠️  Você já é assinante')
                .setDescription('Sua conta já possui um plano ativo.')
                .addFields(
                    { name: 'Plano', value: `${existente.plano.includes('Ultra') ? '💎' : '⭐'}  ${existente.plano}`, inline: true },
                    { name: 'Login', value: `\`${existente.username}\``, inline: true },
                    { name: 'Status', value: '🟢  Ativo', inline: true },
                    { name: 'Precisa de ajuda?', value: '🔑  `!resetar` para gerar nova senha\nℹ️  `!minhaconta` para ver os detalhes' },
                );
            return message.reply({ embeds: [embed] });
        }

        const beneficiosTexto = plano.beneficios
            .map(b => `${b.icon}  **${b.text}**`)
            .join('\n');

        const pagEmbed = baseEmbed(plano.cor)
            .setAuthor({
                name: `Checkout ${plano.tag}`,
                iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(`${plano.emoji}  Pagamento via Pix`)
            .setDescription(
                `Olá **${message.author.displayName}**! Siga os passos abaixo para ativar seu plano.`,
            )
            .addFields(
                { name: 'Plano', value: plano.nome, inline: true },
                { name: 'Valor', value: `${plano.valor}/mês`, inline: true },
                { name: 'Método', value: 'Pix ⚡', inline: true },
                {
                    name: '✨  O que está incluso',
                    value: beneficiosTexto,
                },
                {
                    name: '💳  Dados para pagamento',
                    value:
                        `\`\`\`yaml\n` +
                        `Chave   : ${CONFIG.PIX.CHAVE}\n` +
                        `Tipo    : ${CONFIG.PIX.TIPO}\n` +
                        `Titular : ${CONFIG.PIX.TITULAR}\n` +
                        `Valor   : ${plano.valor}\n` +
                        `\`\`\``,
                },
                {
                    name: '📋  Como funciona',
                    value:
                        `**1.** Faça o Pix no valor exato\n` +
                        `**2.** Envie o **comprovante** neste canal\n` +
                        `**3.** Aguarde a aprovação do admin\n` +
                        `**4.** Receba seu login por **DM** 🎉`,
                },
            )
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }));

        const botoes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setCustomId(`aprovar_${message.author.id}_${planoKey}`)
                .setLabel('Aprovar')
                .setEmoji('✅')
                .setStyle(ButtonStyle.Success),
            new ButtonBuilder()
                .setCustomId(`recusar_${message.author.id}_${planoKey}`)
                .setLabel('Recusar')
                .setEmoji('❌')
                .setStyle(ButtonStyle.Danger),
            new ButtonBuilder()
                .setLabel('Acessar Site')
                .setEmoji('🌐')
                .setStyle(ButtonStyle.Link)
                .setURL(CONFIG.LINKS.SITE),
        );

        await message.reply({ embeds: [pagEmbed], components: [botoes] });
        console.log(`[PAGAMENTO] ${message.author.tag} solicitou: ${plano.nome}`);
        return;
    }

    // ── !planos ─────────────────────────────────────────
    if (cmd === 'planos') {
        const embed = baseEmbed(CONFIG.CORES.PRIMARIA)
            .setAuthor({ name: 'PMGFlix', iconURL: client.user?.displayAvatarURL?.() })
            .setTitle('🎬  Nossos planos')
            .setDescription('O melhor do streaming a partir de R$ 14,90/mês.')
            .addFields(
                ...Object.entries(CONFIG.PLANOS).map(([k, p]) => planoField(k, p)),
            )
            .setFooter({ text: 'Use !pagar <plano> para começar' });

        const botoes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Acessar Site')
                .setEmoji('🌐')
                .setStyle(ButtonStyle.Link)
                .setURL(CONFIG.LINKS.SITE),
        );

        return message.reply({ embeds: [embed], components: [botoes] });
    }

    // ── !minhaconta ─────────────────────────────────────
    if (cmd === 'minhaconta') {
        const user = db.findByDiscordId(message.author.id);
        if (!user || user.status !== 'ativo') {
            const embed = baseEmbed(CONFIG.CORES.INFO)
                .setTitle('🎬  Você ainda não é assinante')
                .setDescription('Comece sua jornada no PMGFlix agora mesmo:')
                .addFields(
                    { name: '⭐  Premium', value: '**R$ 14,90/mês**\n➜ `!pagar premium`', inline: true },
                    { name: '💎  Ultra', value: '**R$ 24,90/mês**\n➜ `!pagar ultra`', inline: true },
                )
                .setFooter({ text: 'Use !planos para ver todos os detalhes' });
            return message.reply({ embeds: [embed] });
        }

        const dataCriacao = new Date(user.createdAt);
        const diasAtivo = Math.floor((Date.now() - dataCriacao.getTime()) / (1000 * 60 * 60 * 24));
        const isUltra = user.plano?.includes('Ultra');
        const planoCor = isUltra ? CONFIG.CORES.ULTRA : CONFIG.CORES.PREMIUM;
        const planoEmoji = isUltra ? '💎' : '⭐';

        const embed = baseEmbed(planoCor)
            .setAuthor({
                name: `${message.author.displayName} • Minha Conta`,
                iconURL: message.author.displayAvatarURL({ dynamic: true }),
            })
            .setTitle(`${planoEmoji}  Detalhes da assinatura`)
            .setDescription('🟢  Sua assinatura está ativa e em dia.')
            .addFields(
                {
                    name: '👤  Username',
                    value: `\`\`\`${user.username}\`\`\``,
                    inline: true,
                },
                {
                    name: '📋  Plano',
                    value: `\`\`\`${user.plano}\`\`\``,
                    inline: true,
                },
                {
                    name: '⏱️  Dias ativo',
                    value: `\`\`\`${diasAtivo} dia(s)\`\`\``,
                    inline: true,
                },
                {
                    name: '📅  Membro desde',
                    value: `<t:${Math.floor(dataCriacao.getTime() / 1000)}:D> (<t:${Math.floor(dataCriacao.getTime() / 1000)}:R>)`,
                    inline: false,
                },
                {
                    name: '🛠️  Ações disponíveis',
                    value:
                        `🔑  \`!resetar\` — gerar nova senha\n` +
                        `🗑️  \`!deletarconta\` — excluir conta`,
                },
            )
            .setThumbnail(message.author.displayAvatarURL({ dynamic: true, size: 256 }));

        const botoes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Acessar PMGFlix')
                .setEmoji('🎬')
                .setStyle(ButtonStyle.Link)
                .setURL(CONFIG.LINKS.SITE),
        );

        return message.reply({ embeds: [embed], components: [botoes] });
    }

    // ── !resetar ────────────────────────────────────────
    if (cmd === 'resetar') {
        const user = db.findByDiscordId(message.author.id);
        if (!user || user.status !== 'ativo') {
            return message.reply({
                embeds: [errorEmbed(
                    'Você não tem um plano ativo',
                    'Não foi possível resetar sua senha porque você ainda não é assinante.\nUse `!planos` para conhecer nossos planos.',
                )],
            });
        }

        const novaSenha = utils.generatePassword();
        const hash = await utils.hashPassword(novaSenha);
        db.updateUser(user.username, { passwordHash: hash });

        try {
            const existingSqlite = sqliteDb.userStmts.findByDiscord.get(message.author.id);
            if (existingSqlite) {
                sqliteDb.userStmts.updatePassword.run(hash, existingSqlite.id);
            }
        } catch (e) {
            console.error('[SQLITE] Erro ao resetar senha:', e.message);
        }

        try {
            const dmEmbed = baseEmbed(CONFIG.CORES.AVISO)
                .setTitle('🔑  Suas novas credenciais')
                .setDescription('Use os dados abaixo para acessar o site.')
                .addFields(
                    {
                        name: '👤  Username',
                        value: `\`\`\`fix\n${user.username}\n\`\`\``,
                        inline: false,
                    },
                    {
                        name: '🔑  Nova senha',
                        value: `\`\`\`fix\n${novaSenha}\n\`\`\``,
                        inline: false,
                    },
                    {
                        name: '⚠️  Importante',
                        value: 'Guarde esta senha em local seguro. Ela **não será exibida novamente**.',
                    },
                );

            const botaoSite = new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                    .setLabel('Fazer Login')
                    .setEmoji('🔐')
                    .setStyle(ButtonStyle.Link)
                    .setURL(CONFIG.LINKS.SITE),
            );

            await message.author.send({ embeds: [dmEmbed], components: [botaoSite] });

            message.reply({
                embeds: [successEmbed(
                    'Senha resetada!',
                    `Sua nova senha foi enviada para o seu **privado (DM)** 🎉`,
                )],
            });
        } catch {
            message.reply({
                embeds: [errorEmbed(
                    'Não consegui te enviar DM',
                    'Verifique se você tem **mensagens privadas habilitadas** para membros deste servidor e tente novamente.',
                )],
            });
        }
        return;
    }

    // ── !usuarios (somente dono) ────────────────────────
    if (cmd === 'usuarios' || cmd === 'users') {
        if (message.author.id !== CONFIG.OWNER_ID) {
            return message.reply({
                embeds: [errorEmbed('Acesso negado', 'Apenas o dono pode utilizar este comando.')],
            });
        }
        const ativos = db.getActiveUsers();
        if (ativos.length === 0) {
            return message.reply({
                embeds: [infoEmbed('Nenhum usuário ativo', 'Ainda não há assinantes ativos no sistema.')],
            });
        }

        const premium = ativos.filter(u => !u.plano?.includes('Ultra')).length;
        const ultra = ativos.filter(u => u.plano?.includes('Ultra')).length;
        const total = ativos.length;
        const receita = (premium * 14.90 + ultra * 24.90).toFixed(2);

        const lista = ativos.slice(0, 15).map((u, i) => {
            const isUltra = u.plano?.includes('Ultra');
            const emoji = isUltra ? '💎' : '⭐';
            const num = String(i + 1).padStart(2, '0');
            return `\`${num}\`  ${emoji}  **${u.username}** — <@${u.discordId}>`;
        }).join('\n');

        const embed = baseEmbed(CONFIG.CORES.PRIMARIA)
            .setAuthor({ name: 'Painel Administrativo', iconURL: client.user?.displayAvatarURL?.() })
            .setTitle('👑  Usuários ativos')
            .setDescription(
                `⭐  Premium: **${premium}** 💎  Ultra: **${ultra}** 👥  Total: **${total}**\n` +
                `💰  Receita estimada: **R$ ${receita}/mês**`,
            )
            .addFields(
                {
                    name: '📋  Lista de assinantes',
                    value: lista +
                        (ativos.length > 15 ? `\n\n*+ ${ativos.length - 15} usuário(s) não exibidos*` : ''),
                },
                {
                    name: '🛠️  Ações administrativas',
                    value:
                        `\`!revogar <user>\` — suspender acesso\n` +
                        `\`!deletar <user>\` — excluir conta`,
                },
            );
        return message.reply({ embeds: [embed] });
    }

    // ── !revogar <username> (somente dono) ──────────────
    if (cmd === 'revogar') {
        if (message.author.id !== CONFIG.OWNER_ID) {
            return message.reply({
                embeds: [errorEmbed('Acesso negado', 'Apenas o dono pode utilizar este comando.')],
            });
        }
        const target = args[0];
        if (!target) {
            return message.reply({
                embeds: [infoEmbed('Uso correto', 'Utilize: `!revogar <username>`')],
            });
        }

        const user = db.findByUsername(target);
        if (!user) {
            return message.reply({
                embeds: [errorEmbed('Usuário não encontrado', `Não existe nenhuma conta com o username \`${target}\`.`)],
            });
        }

        db.deactivateUser(target);

        try {
            const existingSqlite = sqliteDb.userStmts.findByUsername.get(target);
            if (existingSqlite) {
                sqliteDb.userStmts.updateStatus.run('inativo', existingSqlite.id);
            }
        } catch (e) {
            console.error('[SQLITE] Erro ao revogar acesso:', e.message);
        }

        message.reply({
            embeds: [successEmbed(
                'Acesso revogado',
                `O usuário \`${target}\` teve seu acesso **suspenso** com sucesso.`,
            )],
        });
        console.log(`[REVOGADO] ${target} por ${message.author.tag}`);
        return;
    }

    // ── !deletar <username> (somente dono) ──────────────
    if (cmd === 'deletar') {
        if (message.author.id !== CONFIG.OWNER_ID) {
            return message.reply({
                embeds: [errorEmbed('Acesso negado', 'Apenas o dono pode utilizar este comando.')],
            });
        }
        const target = args[0];
        if (!target) {
            return message.reply({
                embeds: [infoEmbed('Uso correto', 'Utilize: `!deletar <username>`')],
            });
        }

        const user = db.findByUsername(target);
        if (!user) {
            return message.reply({
                embeds: [errorEmbed('Usuário não encontrado', `Não existe nenhuma conta com o username \`${target}\`.`)],
            });
        }

        db.deleteUser(target);

        try {
            sqliteDb.userStmts.deleteByUsername.run(target);
        } catch (e) {
            console.error('[SQLITE] Erro ao deletar usuário:', e.message);
        }

        message.reply({
            embeds: [successEmbed(
                'Usuário excluído',
                `\`${target}\` foi **deletado completamente** de todos os sistemas.`,
            )],
        });
        console.log(`[DELETADO] ${target} por ${message.author.tag}`);
        return;
    }

    // ── !deletarconta ───────────────────────────────────
    if (cmd === 'deletarconta') {
        const user = db.findByDiscordId(message.author.id);
        if (!user) {
            return message.reply({
                embeds: [errorEmbed('Conta não encontrada', 'Você não possui uma conta registrada no PMGFlix.')],
            });
        }

        const username = user.username;
        db.deleteUser(username);

        try {
            sqliteDb.userStmts.deleteByUsername.run(username);
        } catch (e) {
            console.error('[SQLITE] Erro ao deletar conta própria:', e.message);
        }

        message.reply({
            embeds: [successEmbed(
                'Conta excluída',
                `Sua conta \`${username}\` foi **excluída permanentemente**.\nObrigado por ter feito parte do PMGFlix! 🎬`,
            )],
        });
        console.log(`[CONTA_DELETADA] ${username} deletou a própria conta via Discord.`);
        return;
    }

    // ── !ajuda ──────────────────────────────────────────
    if (cmd === 'ajuda' || cmd === 'help') {
        const isOwner = message.author.id === CONFIG.OWNER_ID;

        const embed = baseEmbed(CONFIG.CORES.PRIMARIA)
            .setAuthor({ name: 'PMGFlix Bot', iconURL: client.user?.displayAvatarURL?.() })
            .setTitle('🤖  Central de comandos')
            .setDescription('Digite qualquer comando começando com `!`.')
            .addFields(
                {
                    name: '🎬  Assinatura',
                    value:
                        `\`!planos\` — ver todos os planos\n` +
                        `\`!pagar <plano>\` — iniciar pagamento`,
                    inline: false,
                },
                {
                    name: '👤  Sua conta',
                    value:
                        `\`!minhaconta\` — ver dados da conta\n` +
                        `\`!resetar\` — gerar nova senha\n` +
                        `\`!deletarconta\` — excluir conta`,
                    inline: false,
                },
                {
                    name: 'ℹ️  Geral',
                    value: `\`!ajuda\` — mostrar esta mensagem`,
                    inline: false,
                },
            );

        if (isOwner) {
            embed.addFields({
                name: '👑  Painel do administrador',
                value:
                    `\`!usuarios\` — listar assinantes ativos\n` +
                    `\`!revogar <user>\` — suspender acesso\n` +
                    `\`!deletar <user>\` — excluir usuário`,
            });
        }

        const botoes = new ActionRowBuilder().addComponents(
            new ButtonBuilder()
                .setLabel('Acessar Site')
                .setEmoji('🎬')
                .setStyle(ButtonStyle.Link)
                .setURL(CONFIG.LINKS.SITE),
        );

        return message.reply({ embeds: [embed], components: [botoes] });
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

    const isOwner =
        interaction.user.id === CONFIG.OWNER_ID ||
        interaction.member.permissions.has(PermissionsBitField.Flags.Administrator);

    if (!isOwner) {
        return interaction.reply({
            embeds: [errorEmbed(
                'Permissão insuficiente',
                'Apenas o **dono** ou **administradores** podem aprovar ou recusar pagamentos.',
            )],
            ephemeral: true,
        });
    }

    const plano = CONFIG.PLANOS[planoKey];
    if (!plano) {
        return interaction.reply({
            embeds: [errorEmbed('Plano inválido', 'O plano selecionado não foi encontrado.')],
            ephemeral: true,
        });
    }

    const membro = await interaction.guild.members.fetch(userId).catch(() => null);
    const nome = membro?.displayName || `Usuário (${userId})`;

    // ── APROVAR ─────────────────────────────────────────
    if (acao === 'aprovar') {
        const username = utils.generateUsername(nome, db);
        const senhaPlain = utils.generatePassword();
        const hash = await utils.hashPassword(senhaPlain);

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

        if (plano.cargoId && membro) {
            try {
                await membro.roles.add(plano.cargoId);
            } catch (err) {
                console.error(`[CARGO] Erro: ${err.message}`);
            }
        }

        // Embed pública (canal)
        const aprovEmbed = baseEmbed(CONFIG.CORES.SUCESSO)
            .setAuthor({
                name: 'Pagamento Aprovado',
                iconURL: membro?.displayAvatarURL?.({ dynamic: true }),
            })
            .setTitle(`🎉  Bem-vindo ao PMGFlix, ${nome}!`)
            .setDescription(
                `✅  Pagamento confirmado\n` +
                `✅  Conta criada com sucesso\n` +
                `✅  Credenciais enviadas por DM`,
            )
            .addFields(
                { name: `${plano.emoji}  Plano`, value: `\`${plano.nome}\``, inline: true },
                { name: '👤  Cliente', value: `<@${userId}>`, inline: true },
                { name: '✍️  Aprovado por', value: `${interaction.user.displayName}`, inline: true },
            );

        await interaction.update({ embeds: [aprovEmbed], components: [] });

        // DM com credenciais
        if (membro) {
            try {
                const beneficiosTexto = plano.beneficios
                    .map(b => `${b.icon}  **${b.text}**`)
                    .join('\n');

                const dmEmbed = baseEmbed(plano.cor)
                    .setAuthor({ name: `${plano.tag} • Ativado` })
                    .setTitle('🎉  Bem-vindo ao PMGFlix!')
                    .setDescription('Sua assinatura foi ativada com sucesso! Use as credenciais abaixo para fazer login no site.')
                    .addFields(
                        {
                            name: '👤  Username',
                            value: `\`\`\`fix\n${username}\n\`\`\``,
                            inline: false,
                        },
                        {
                            name: '🔑  Senha',
                            value: `\`\`\`fix\n${senhaPlain}\n\`\`\``,
                            inline: false,
                        },
                        {
                            name: `${plano.emoji}  Seu plano ${plano.nome}`,
                            value:
                                `**Valor:** ${plano.valor}/mês\n` +
                                `*${plano.descricao}*\n\n` +
                                `${beneficiosTexto}`,
                        },
                        {
                            name: '⚠️  Importante',
                            value: 'Guarde suas credenciais em local seguro! Caso perca a senha, use `!resetar` no servidor.',
                        },
                    )
                    .setThumbnail(client.user.displayAvatarURL());

                const botoesDM = new ActionRowBuilder().addComponents(
                    new ButtonBuilder()
                        .setLabel('Acessar PMGFlix')
                        .setEmoji('🎬')
                        .setStyle(ButtonStyle.Link)
                        .setURL(CONFIG.LINKS.SITE),
                );

                await membro.send({ embeds: [dmEmbed], components: [botoesDM] });
            } catch {
                console.log(`[DM] Falha ao enviar DM para ${nome}`);
            }
        }

        // Log
        if (CONFIG.CANAL_LOGS_ID) {
            try {
                const canal = await interaction.guild.channels.fetch(CONFIG.CANAL_LOGS_ID);
                const logEmbed = baseEmbed(CONFIG.CORES.SUCESSO)
                    .setAuthor({ name: 'Log • Pagamento Aprovado' })
                    .setTitle('📝  Nova assinatura ativada')
                    .addFields(
                        { name: '👤  Cliente', value: `${nome}\n<@${userId}>`, inline: true },
                        { name: '🔐  Login', value: `\`${username}\``, inline: true },
                        { name: `${plano.emoji}  Plano`, value: plano.nome, inline: true },
                        { name: '✍️  Admin', value: interaction.user.displayName, inline: true },
                        { name: '💰  Valor', value: plano.valor, inline: true },
                        { name: '🕒  Data', value: `<t:${Math.floor(Date.now() / 1000)}:f>`, inline: true },
                    );
                await canal.send({ embeds: [logEmbed] });
            } catch { }
        }

        console.log(`[APROVADO] ${nome} → login: ${username} — ${plano.nome}`);
        return;
    }

    // ── RECUSAR ─────────────────────────────────────────
    if (acao === 'recusar') {
        const recEmbed = baseEmbed(CONFIG.CORES.ERRO)
            .setAuthor({
                name: 'Pagamento Recusado',
                iconURL: membro?.displayAvatarURL?.({ dynamic: true }),
            })
            .setTitle('❌  Solicitação recusada')
            .setDescription('O pagamento não foi confirmado.')
            .addFields(
                { name: '👤  Cliente', value: `<@${userId}>`, inline: true },
                { name: `${plano.emoji}  Plano`, value: plano.nome, inline: true },
                { name: '✍️  Recusado por', value: interaction.user.displayName, inline: true },
                {
                    name: '​',
                    value: `<@${userId}>, se você acredita que houve um erro, entre em contato com a administração.`,
                },
            );

        await interaction.update({ embeds: [recEmbed], components: [] });

        if (membro) {
            try {
                const dmRec = baseEmbed(CONFIG.CORES.ERRO)
                    .setTitle('❌  Sua solicitação foi recusada')
                    .setDescription(`Infelizmente seu pagamento não foi aprovado.\n\n**Plano solicitado:** ${plano.emoji} ${plano.nome} — ${plano.valor}/mês`)
                    .addFields({
                        name: '🤔  Possíveis motivos',
                        value:
                            `• Comprovante não enviado ou inválido\n` +
                            `• Valor incorreto\n` +
                            `• Pix não identificado em conta\n\n` +
                            `**Entre em contato com a administração** para mais informações.`,
                    });
                await membro.send({ embeds: [dmRec] });
            } catch { }
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

module.exports = { client, CONFIG };
