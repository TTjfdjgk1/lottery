/**
 * 淘宝闪购粉丝福利抽奖转盘 - 微信公众号后端
 * 
 * 功能：
 * 1. 微信公众号接入验证
 * 2. 微信网页授权（获取用户信息）
 * 3. 抽奖逻辑处理
 * 4. 中奖记录管理
 * 5. 数据统计
 */

const express = require('express');
const bodyParser = require('body-parser');
const xml2js = require('xml2js');
const crypto = require('crypto');
const axios = require('axios');
const initSqlJs = require('sql.js');
const fs = require('fs');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0';

// ==================== 配置区域 ====================
// 请替换为你自己的微信公众号配置
const WECHAT_CONFIG = {
    appId: 'YOUR_APP_ID',              // 公众号AppID
    appSecret: 'YOUR_APP_SECRET',      // 公众号AppSecret
    token: 'YOUR_TOKEN',               // 服务器配置的Token
    redirectUri: 'http://your-domain.com/api/wechat/callback'  // 授权回调地址
};

// 奖品配置（严格按照指定概率）
const PRIZES = [
    { id: 1, name: '1元现金', amount: 1, probability: 50 },
    { id: 2, name: '2元现金', amount: 2, probability: 24.5 },
    { id: 3, name: '3元现金', amount: 3, probability: 15 },
    { id: 4, name: '4元现金', amount: 4, probability: 7 },
    { id: 5, name: '5元现金', amount: 5, probability: 2 },
    { id: 6, name: '6元现金', amount: 6, probability: 0.5 },
    { id: 7, name: '7元现金', amount: 7, probability: 0.4 },
    { id: 8, name: '8元现金', amount: 8, probability: 0.3 },
    { id: 9, name: '9元现金', amount: 9, probability: 0.2 },
    { id: 10, name: '10元现金', amount: 10, probability: 0.1 }
];

// ==================== 数据库初始化 ====================
let db;
const DB_PATH = './lottery.db';

async function initDatabase() {
    const SQL = await initSqlJs();
    
    // 尝试加载已有数据库
    if (fs.existsSync(DB_PATH)) {
        const buffer = fs.readFileSync(DB_PATH);
        db = new SQL.Database(buffer);
    } else {
        db = new SQL.Database();
    }
    
    // 创建表
    db.run(`
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            openid TEXT UNIQUE NOT NULL,
            nickname TEXT,
            avatar TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS lottery_records (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            prize_id INTEGER NOT NULL,
            prize_name TEXT NOT NULL,
            prize_amount REAL NOT NULL,
            is_claimed INTEGER DEFAULT 0,
            claimed_at DATETIME,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    db.run(`
        CREATE TABLE IF NOT EXISTS daily_stats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT UNIQUE NOT NULL,
            total_participants INTEGER DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    `);
    
    saveDatabase();
    console.log('✅ 数据库初始化完成');
}

function saveDatabase() {
    const data = db.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(DB_PATH, buffer);
}

// ==================== 中间件配置 ====================
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// XML解析器（用于微信消息）
const xmlParser = new xml2js.Parser({ explicitArray: false });

// ==================== 工具函数 ====================

function getTodayStr() {
    return new Date().toISOString().split('T')[0];
}

function sha1(str) {
    return crypto.createHash('sha1').update(str).digest('hex');
}

function drawPrize() {
    const random = Math.random() * 100;
    let cumulative = 0;
    const sortedPrizes = [...PRIZES].sort((a, b) => b.probability - a.probibility);
    
    for (const prize of sortedPrizes) {
        cumulative += prize.probability;
        if (random <= cumulative) {
            return prize;
        }
    }
    return sortedPrizes[sortedPrizes.length - 1];
}

// ==================== 微信公众号接入 ====================

app.get('/api/wechat/verify', (req, res) => {
    const { signature, timestamp, nonce, echostr } = req.query;
    const token = WECHAT_CONFIG.token;
    const arr = [token, timestamp, nonce].sort();
    const str = arr.join('');
    const sha1Str = sha1(str);
    
    if (sha1Str === signature) {
        res.send(echostr);
    } else {
        res.status(403).send('验证失败');
    }
});

app.post('/api/wechat/verify', (req, res) => {
    let body = '';
    req.on('data', chunk => body += chunk);
    req.on('end', () => {
        xmlParser.parseString(body, (err, result) => {
            if (err) return res.send('');
            const message = result.xml;
            const { FromUserName, ToUserName, MsgType, Content, Event, EventKey } = message;
            
            if (MsgType === 'text' && Content && Content.includes('抽奖')) {
                const replyMsg = `<xml>
                    <ToUserName><![CDATA[${FromUserName}]]></ToUserName>
                    <FromUserName><![CDATA[${ToUserName}]]></FromUserName>
                    <CreateTime>${Date.now()}</CreateTime>
                    <MsgType><![CDATA[text]]></MsgType>
                    <Content><![CDATA[点击下方链接参与抽奖：\n${WECHAT_CONFIG.redirectUri.replace('/callback', '/lottery.html')}]]></Content>
                </xml>`;
                return res.send(replyMsg);
            }
            res.send('');
        });
    });
});

// ==================== 微信网页授权 ====================

app.get('/api/wechat/auth', (req, res) => {
    const state = req.query.state || 'lottery';
    const authUrl = `https://open.weixin.qq.com/connect/oauth2/authorize?appid=${WECHAT_CONFIG.appId}&redirect_uri=${encodeURIComponent(WECHAT_CONFIG.redirectUri)}&response_type=code&scope=snsapi_userinfo&state=${state}#wechat_redirect`;
    res.redirect(authUrl);
});

app.get('/api/wechat/callback', async (req, res) => {
    const { code } = req.query;
    if (!code) return res.status(400).json({ error: '授权失败' });
    
    try {
        const tokenUrl = `https://api.weixin.qq.com/sns/oauth2/access_token?appid=${WECHAT_CONFIG.appId}&secret=${WECHAT_CONFIG.appSecret}&code=${code}&grant_type=authorization_code`;
        const tokenRes = await axios.get(tokenUrl);
        if (tokenRes.data.errcode) throw new Error(tokenRes.data.errmsg);
        
        const { access_token, openid } = tokenRes.data;
        const userUrl = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}&lang=zh_CN`;
        const userRes = await axios.get(userUrl);
        if (userRes.data.errcode) throw new Error(userRes.data.errmsg);
        
        const { nickname, headimgurl } = userRes.data;
        
        // 保存用户
        db.run(`INSERT OR REPLACE INTO users (openid, nickname, avatar) VALUES (?, ?, ?)`, [openid, nickname, headimgurl]);
        saveDatabase();
        
        const user = db.exec(`SELECT id FROM users WHERE openid = '${openid}'`);
        const userId = user[0]?.values[0]?.[0] || 1;
        
        res.redirect(`/lottery.html?userId=${userId}&openid=${openid}&nickname=${encodeURIComponent(nickname)}&avatar=${encodeURIComponent(headimgurl)}`);
    } catch (error) {
        res.status(500).json({ error: '授权失败: ' + error.message });
    }
});

// ==================== 抽奖业务接口 ====================

app.get('/api/lottery/check', (req, res) => {
    const { openid } = req.query;
    if (!openid) return res.status(400).json({ error: '缺少openid' });
    
    try {
        const userResult = db.exec(`SELECT id FROM users WHERE openid = '${openid}'`);
        if (!userResult.length || !userResult[0].values.length) {
            return res.json({ canPlay: false, message: '用户不存在' });
        }
        
        const userId = userResult[0].values[0][0];
        const today = getTodayStr();
        const recordResult = db.exec(`SELECT * FROM lottery_records WHERE user_id = ${userId} AND date(created_at) = '${today}'`);
        
        if (recordResult.length && recordResult[0].values.length) {
            const record = recordResult[0].values[0];
            res.json({
                canPlay: false,
                message: '今日已参与抽奖',
                lastPrize: { name: record[3], amount: record[4] }
            });
        } else {
            res.json({ canPlay: true, message: '可以参与抽奖' });
        }
    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
});

app.post('/api/lottery/draw', (req, res) => {
    const { openid } = req.body;
    if (!openid) return res.status(400).json({ error: '缺少openid' });
    
    try {
        const userResult = db.exec(`SELECT id FROM users WHERE openid = '${openid}'`);
        if (!userResult.length || !userResult[0].values.length) {
            return res.status(404).json({ error: '用户不存在' });
        }
        
        const userId = userResult[0].values[0][0];
        const today = getTodayStr();
        
        const existingResult = db.exec(`SELECT * FROM lottery_records WHERE user_id = ${userId} AND date(created_at) = '${today}'`);
        if (existingResult.length && existingResult[0].values.length) {
            const record = existingResult[0].values[0];
            return res.status(400).json({ error: '今日已参与抽奖', prize: { name: record[3], amount: record[4] } });
        }
        
        const prize = drawPrize();
        const now = new Date().toISOString();
        
        db.run(`INSERT INTO lottery_records (user_id, prize_id, prize_name, prize_amount, created_at) VALUES (?, ?, ?, ?, ?)`, 
            [userId, prize.id, prize.name, prize.amount, now]);
        
        db.run(`INSERT OR REPLACE INTO daily_stats (date, total_participants) VALUES (?, COALESCE((SELECT total_participants FROM daily_stats WHERE date = ?), 0) + 1)`, 
            [today, today]);
        
        saveDatabase();
        
        res.json({ success: true, prize: { id: prize.id, name: prize.name, amount: prize.amount } });
    } catch (error) {
        res.status(500).json({ error: '抽奖失败' });
    }
});

app.get('/api/lottery/stats', (req, res) => {
    try {
        const today = getTodayStr();
        const statsResult = db.exec(`SELECT total_participants FROM daily_stats WHERE date = '${today}'`);
        const totalParticipants = statsResult.length && statsResult[0].values.length ? statsResult[0].values[0][0] : 0;
        
        const winnersResult = db.exec(`
            SELECT u.nickname, u.avatar, lr.prize_name, lr.created_at 
            FROM lottery_records lr 
            JOIN users u ON lr.user_id = u.id 
            WHERE date(lr.created_at) = '${today}' 
            ORDER BY lr.created_at DESC LIMIT 50
        `);
        
        const winners = winnersResult.length ? winnersResult[0].values.map(w => ({
            nickname: w[0],
            avatar: w[1],
            prize: w[2],
            time: new Date(w[3]).toLocaleTimeString('zh-CN', { hour12: false })
        })) : [];
        
        res.json({ totalParticipants, winners });
    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
});

app.get('/api/lottery/prizes', (req, res) => {
    res.json(PRIZES);
});

// ==================== 管理后台接口 ====================

app.get('/api/admin/records', (req, res) => {
    const { date, page = 1, pageSize = 50 } = req.query;
    const offset = (page - 1) * pageSize;
    
    try {
        let query = `SELECT lr.id, u.nickname, u.avatar, u.openid, lr.prize_name, lr.prize_amount, lr.is_claimed, lr.claimed_at, lr.created_at 
                     FROM lottery_records lr JOIN users u ON lr.user_id = u.id`;
        if (date) query += ` WHERE date(lr.created_at) = '${date}'`;
        query += ` ORDER BY lr.created_at DESC LIMIT ${pageSize} OFFSET ${offset}`;
        
        const result = db.exec(query);
        const records = result.length ? result[0].values.map(r => ({
            id: r[0], nickname: r[1], avatar: r[2], openid: r[3],
            prizeName: r[4], prizeAmount: r[5], isClaimed: r[6] === 1,
            claimedAt: r[7], createdAt: r[8]
        })) : [];
        
        res.json({ records });
    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
});

app.post('/api/admin/claim', (req, res) => {
    const { recordId } = req.body;
    if (!recordId) return res.status(400).json({ error: '缺少recordId' });
    
    try {
        db.run(`UPDATE lottery_records SET is_claimed = 1, claimed_at = ? WHERE id = ?`, [new Date().toISOString(), recordId]);
        saveDatabase();
        res.json({ success: true });
    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
});

app.get('/api/admin/report', (req, res) => {
    try {
        const totalResult = db.exec('SELECT COUNT(DISTINCT user_id) FROM lottery_records');
        const totalParticipants = totalResult.length && totalResult[0].values.length ? totalResult[0].values[0][0] : 0;
        
        const amountResult = db.exec('SELECT SUM(prize_amount) FROM lottery_records');
        const totalAmount = amountResult.length && amountResult[0].values.length ? (amountResult[0].values[0][0] || 0).toFixed(2) : '0.00';
        
        const prizeStatsResult = db.exec(`SELECT prize_name, COUNT(*) as count, SUM(prize_amount) as total_amount FROM lottery_records GROUP BY prize_id ORDER BY prize_id`);
        const prizeStats = prizeStatsResult.length ? prizeStatsResult[0].values.map(p => ({
            prize_name: p[0], count: p[1], total_amount: p[2]
        })) : [];
        
        const dailyStatsResult = db.exec(`SELECT date, total_participants FROM daily_stats ORDER BY date DESC LIMIT 7`);
        const dailyStats = dailyStatsResult.length ? dailyStatsResult[0].values.map(d => ({
            date: d[0], total_participants: d[1]
        })) : [];
        
        res.json({ totalParticipants, totalAmount, prizeStats, dailyStats });
    } catch (error) {
        res.status(500).json({ error: '服务器错误' });
    }
});

// ==================== 测试模式：无需微信授权 ====================

app.get('/api/test/login', (req, res) => {
    const testUser = {
        openid: 'test_openid_' + Date.now(),
        nickname: '测试用户',
        avatar: ''
    };
    
    db.run(`INSERT OR REPLACE INTO users (openid, nickname, avatar) VALUES (?, ?, ?)`, [testUser.openid, testUser.nickname, testUser.avatar]);
    saveDatabase();
    
    res.redirect(`/lottery.html?openid=${testUser.openid}&nickname=${encodeURIComponent(testUser.nickname)}&avatar=`);
});

// ==================== 启动服务器 ====================

initDatabase().then(() => {
    app.listen(PORT, HOST, () => {
        console.log(`\n🚀 服务器启动成功！`);
        console.log(`📍 本地访问: http://localhost:${PORT}`);
        console.log(`📍 抽奖页面: http://localhost:${PORT}/lottery.html`);
        console.log(`📍 测试入口: http://localhost:${PORT}/api/test/login`);
        console.log(`📍 管理后台: http://localhost:${PORT}/admin.html`);
        console.log(`\n⚠️  请记得修改 WECHAT_CONFIG 中的配置信息！`);
    });
}).catch(err => {
    console.error('数据库初始化失败:', err);
});
