// ==========================================
// 台灣探險圖鑑 - 後端伺服器
// Express + LINE Bot Webhook
// ==========================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const line = require('@line/bot-sdk');

const app = express();
const PORT = process.env.PORT || 3000;

// ==================== 環境變數 ====================
const config = {
    line: {
        channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN || '',
        channelSecret: process.env.LINE_CHANNEL_SECRET || ''
    },
    firebase: {
        projectId: process.env.FIREBASE_PROJECT_ID || '',
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
        privateKey: (process.env.FIREBASE_PRIVATE_KEY || '').replace(/\\n/g, '\n')
    }
};

// ==================== Firebase 初始化 ====================
let db = null;

if (config.firebase.projectId && config.firebase.privateKey) {
    admin.initializeApp({
        credential: admin.credential.cert({
            projectId: config.firebase.projectId,
            clientEmail: config.firebase.clientEmail,
            privateKey: config.firebase.privateKey
        })
    });
    db = admin.firestore();
    console.log('✅ Firebase 已連線');
} else {
    console.log('⚠️ Firebase 未設定，使用記憶體儲存');
}

// 記憶體儲存（無 Firebase 時使用）
const memoryStore = {
    users: {},
    lineLinks: {}
};

// ==================== LINE Bot 初始化 ====================
let lineClient = null;

if (config.line.channelAccessToken && config.line.channelSecret) {
    lineClient = new line.Client(config.line);
    console.log('✅ LINE Bot 已初始化');
} else {
    console.log('⚠️ LINE Bot 未設定');
}

// ==================== 景點資料 ====================
const spotsData = require('./spots.json');

// 輔助函數：根據座標找附近景點
function findNearbySpots(lat, lng, radiusKm = 1) {
    const results = [];
    
    Object.entries(spotsData).forEach(([county, data]) => {
        data.spots.forEach(spot => {
            const distance = getDistance(lat, lng, spot.lat, spot.lng);
            if (distance <= radiusKm) {
                results.push({
                    spotId: `${county}-${spot.id}`,
                    county,
                    ...spot,
                    distance: Math.round(distance * 1000) // 轉換成公尺
                });
            }
        });
    });
    
    return results.sort((a, b) => a.distance - b.distance);
}

function getDistance(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
              Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

// ==================== Middleware ====================
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// LINE Webhook 需要 raw body
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// ==================== API 路由 ====================

// 取得景點資料
app.get('/api/spots', (req, res) => {
    res.json(spotsData);
});

// 取得用戶資料
app.get('/api/user/:userId', async (req, res) => {
    const { userId } = req.params;
    
    try {
        if (db) {
            const doc = await db.collection('users').doc(userId).get();
            if (doc.exists) {
                res.json(doc.data());
            } else {
                res.json({ collectedSpots: [], logs: [], unlockedAchievements: [] });
            }
        } else {
            res.json(memoryStore.users[userId] || { collectedSpots: [], logs: [], unlockedAchievements: [] });
        }
    } catch (error) {
        console.error('取得用戶資料失敗:', error);
        res.status(500).json({ error: error.message });
    }
});

// 更新用戶資料
app.post('/api/user/:userId', async (req, res) => {
    const { userId } = req.params;
    const data = req.body;
    
    try {
        if (db) {
            await db.collection('users').doc(userId).set({
                ...data,
                lastUpdated: admin.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } else {
            memoryStore.users[userId] = { ...memoryStore.users[userId], ...data };
        }
        res.json({ success: true });
    } catch (error) {
        console.error('更新用戶資料失敗:', error);
        res.status(500).json({ error: error.message });
    }
});

// LINE 帳號連動
app.post('/api/link', async (req, res) => {
    const { lineUserId, linkCode } = req.body;
    
    try {
        if (db) {
            // 查找對應的 Firebase 用戶
            const snapshot = await db.collection('users')
                .where('linkCode', '==', linkCode)
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                res.status(404).json({ error: '連動碼無效' });
                return;
            }
            
            const userDoc = snapshot.docs[0];
            await userDoc.ref.update({ lineUserId });
            
            // 儲存反向對應
            await db.collection('lineLinks').doc(lineUserId).set({
                firebaseUserId: userDoc.id,
                linkedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            res.json({ success: true, userId: userDoc.id });
        } else {
            memoryStore.lineLinks[lineUserId] = linkCode;
            res.json({ success: true });
        }
    } catch (error) {
        console.error('連動失敗:', error);
        res.status(500).json({ error: error.message });
    }
});

// 排行榜
app.get('/api/leaderboard', async (req, res) => {
    try {
        if (db) {
            const snapshot = await db.collection('users')
                .orderBy('collectedCount', 'desc')
                .limit(20)
                .get();
            
            const results = [];
            snapshot.forEach(doc => {
                const data = doc.data();
                results.push({
                    displayName: data.displayName || '旅人',
                    collectedCount: data.collectedSpots?.length || 0,
                    achievementCount: data.unlockedAchievements?.length || 0
                });
            });
            res.json(results);
        } else {
            res.json([]);
        }
    } catch (error) {
        console.error('取得排行榜失敗:', error);
        res.status(500).json({ error: error.message });
    }
});

// ==================== LINE Webhook ====================

app.post('/webhook', async (req, res) => {
    if (!lineClient) {
        res.status(200).end();
        return;
    }
    
    const signature = req.get('x-line-signature');
    
    // 驗證簽名
    if (!line.validateSignature(req.body, config.line.channelSecret, signature)) {
        res.status(401).end();
        return;
    }
    
    const body = JSON.parse(req.body.toString());
    
    try {
        await Promise.all(body.events.map(handleLineEvent));
        res.status(200).end();
    } catch (error) {
        console.error('LINE Webhook 錯誤:', error);
        res.status(500).end();
    }
});

async function handleLineEvent(event) {
    const userId = event.source.userId;
    
    switch (event.type) {
        case 'message':
            await handleLineMessage(event, userId);
            break;
        case 'follow':
            await handleFollow(userId);
            break;
    }
}

async function handleLineMessage(event, userId) {
    const message = event.message;
    
    // 處理位置訊息（打卡）
    if (message.type === 'location') {
        await handleLocationCheckin(userId, message.latitude, message.longitude, event.replyToken);
        return;
    }
    
    // 處理文字訊息
    if (message.type === 'text') {
        const text = message.text.trim();
        
        // 連動指令
        if (text.startsWith('連動 ') || text.startsWith('連動')) {
            const code = text.replace('連動', '').trim();
            await handleLinkCommand(userId, code, event.replyToken);
            return;
        }
        
        // 進度查詢
        if (text === '進度' || text === '我的進度') {
            await handleProgressQuery(userId, event.replyToken);
            return;
        }
        
        // 附近景點
        if (text === '附近' || text === '附近景點') {
            await replyMessage(event.replyToken, {
                type: 'text',
                text: '📍 請傳送你的位置，我會幫你找附近的景點！\n\n點擊左下角的「+」→ 選擇「位置資訊」'
            });
            return;
        }
        
        // 幫助
        if (text === '幫助' || text === '功能' || text === 'help') {
            await sendHelpMessage(event.replyToken);
            return;
        }
        
        // 預設回覆
        await sendHelpMessage(event.replyToken);
    }
}

async function handleFollow(userId) {
    if (!lineClient) return;
    
    await lineClient.pushMessage(userId, {
        type: 'text',
        text: `🗺️ 歡迎加入台灣探險圖鑑！\n\n` +
              `📍 傳送位置 → 自動打卡附近景點\n` +
              `📊 輸入「進度」→ 查看收集進度\n` +
              `🔗 輸入「連動 [碼]」→ 綁定網頁帳號\n\n` +
              `開始你的台灣探險吧！`
    });
}

async function handleLocationCheckin(userId, lat, lng, replyToken) {
    const nearbySpots = findNearbySpots(lat, lng, 0.5); // 500 公尺內
    
    if (nearbySpots.length === 0) {
        await replyMessage(replyToken, {
            type: 'text',
            text: `😢 附近 500 公尺內沒有景點...\n\n最近的景點：\n${findNearbySpots(lat, lng, 10).slice(0, 3).map(s => `• ${s.name}（${s.distance}m）`).join('\n')}`
        });
        return;
    }
    
    // 取得用戶資料
    let userData = { collectedSpots: [], logs: [] };
    
    if (db) {
        const linkDoc = await db.collection('lineLinks').doc(userId).get();
        if (linkDoc.exists) {
            const firebaseUserId = linkDoc.data().firebaseUserId;
            const userDoc = await db.collection('users').doc(firebaseUserId).get();
            if (userDoc.exists) {
                userData = userDoc.data();
            }
        }
    }
    
    // 找出可以打卡的景點（未收集的）
    const uncollected = nearbySpots.filter(s => !userData.collectedSpots.includes(s.spotId));
    
    if (uncollected.length === 0) {
        await replyMessage(replyToken, {
            type: 'text',
            text: `✅ 附近的景點你都收集過了！\n\n` +
                  nearbySpots.map(s => `• ${s.name} ✓`).join('\n')
        });
        return;
    }
    
    // 自動打卡最近的未收集景點
    const spot = uncollected[0];
    userData.collectedSpots.push(spot.spotId);
    userData.logs = userData.logs || [];
    userData.logs.unshift({
        spotId: spot.spotId,
        county: spot.county,
        name: spot.name,
        time: new Date().toISOString(),
        source: 'line'
    });
    
    // 儲存
    if (db) {
        const linkDoc = await db.collection('lineLinks').doc(userId).get();
        if (linkDoc.exists) {
            const firebaseUserId = linkDoc.data().firebaseUserId;
            await db.collection('users').doc(firebaseUserId).update({
                collectedSpots: userData.collectedSpots,
                logs: userData.logs,
                collectedCount: userData.collectedSpots.length
            });
        }
    }
    
    await replyMessage(replyToken, {
        type: 'flex',
        altText: `🎉 成功打卡：${spot.name}`,
        contents: {
            type: 'bubble',
            hero: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: '🎉 打卡成功！',
                        size: 'xl',
                        weight: 'bold',
                        color: '#f4d03f',
                        align: 'center'
                    }
                ],
                backgroundColor: '#1a1a2e',
                paddingAll: '20px'
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: spot.name,
                        size: 'xl',
                        weight: 'bold'
                    },
                    {
                        type: 'text',
                        text: `${spot.county} · ${spot.desc}`,
                        size: 'sm',
                        color: '#666666',
                        margin: 'md'
                    },
                    {
                        type: 'separator',
                        margin: 'lg'
                    },
                    {
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                            {
                                type: 'text',
                                text: `已收集 ${userData.collectedSpots.length} 個景點`,
                                size: 'sm',
                                color: '#27ae60'
                            }
                        ],
                        margin: 'lg'
                    }
                ]
            }
        }
    });
}

async function handleLinkCommand(userId, code, replyToken) {
    if (!code) {
        await replyMessage(replyToken, {
            type: 'text',
            text: '請輸入連動碼，格式：連動 XXXXXXXX\n\n連動碼可以在網頁版的「紀錄」頁面找到'
        });
        return;
    }
    
    try {
        if (db) {
            // 查找對應的用戶
            const snapshot = await db.collection('users')
                .where('linkCode', '==', code.toUpperCase())
                .limit(1)
                .get();
            
            if (snapshot.empty) {
                await replyMessage(replyToken, {
                    type: 'text',
                    text: '❌ 連動碼無效，請確認後再試'
                });
                return;
            }
            
            const userDoc = snapshot.docs[0];
            
            // 建立連動
            await db.collection('lineLinks').doc(userId).set({
                firebaseUserId: userDoc.id,
                linkedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            
            await userDoc.ref.update({ lineUserId: userId });
            
            await replyMessage(replyToken, {
                type: 'text',
                text: '✅ 連動成功！\n\n現在你可以：\n📍 傳位置自動打卡\n📊 查詢收集進度\n\n網頁和 LINE 的資料會自動同步'
            });
        }
    } catch (error) {
        console.error('連動失敗:', error);
        await replyMessage(replyToken, {
            type: 'text',
            text: '❌ 連動失敗，請稍後再試'
        });
    }
}

async function handleProgressQuery(userId, replyToken) {
    let userData = { collectedSpots: [], unlockedAchievements: [] };
    
    if (db) {
        const linkDoc = await db.collection('lineLinks').doc(userId).get();
        if (linkDoc.exists) {
            const firebaseUserId = linkDoc.data().firebaseUserId;
            const userDoc = await db.collection('users').doc(firebaseUserId).get();
            if (userDoc.exists) {
                userData = userDoc.data();
            }
        } else {
            await replyMessage(replyToken, {
                type: 'text',
                text: '⚠️ 你還沒有連動帳號\n\n請先在網頁版登入，然後輸入「連動 [連動碼]」來綁定帳號'
            });
            return;
        }
    }
    
    const total = Object.values(spotsData).reduce((sum, c) => sum + c.spots.length, 0);
    const collected = userData.collectedSpots?.length || 0;
    const achievements = userData.unlockedAchievements?.length || 0;
    const percentage = Math.round((collected / total) * 100);
    
    // 統計各縣市
    const countyStats = {};
    Object.keys(spotsData).forEach(county => {
        countyStats[county] = {
            total: spotsData[county].spots.length,
            collected: (userData.collectedSpots || []).filter(id => id.startsWith(county)).length
        };
    });
    
    // 找出完成的縣市
    const completedCounties = Object.entries(countyStats)
        .filter(([_, stats]) => stats.collected === stats.total)
        .map(([county, _]) => county);
    
    await replyMessage(replyToken, {
        type: 'flex',
        altText: `收集進度：${collected}/${total}`,
        contents: {
            type: 'bubble',
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: '🗺️ 我的探險進度',
                        size: 'lg',
                        weight: 'bold'
                    },
                    {
                        type: 'box',
                        layout: 'horizontal',
                        contents: [
                            {
                                type: 'box',
                                layout: 'vertical',
                                contents: [
                                    { type: 'text', text: `${collected}`, size: 'xxl', weight: 'bold', color: '#f4d03f', align: 'center' },
                                    { type: 'text', text: '已收集', size: 'xs', color: '#666666', align: 'center' }
                                ],
                                flex: 1
                            },
                            {
                                type: 'box',
                                layout: 'vertical',
                                contents: [
                                    { type: 'text', text: `${total}`, size: 'xxl', weight: 'bold', align: 'center' },
                                    { type: 'text', text: '總景點', size: 'xs', color: '#666666', align: 'center' }
                                ],
                                flex: 1
                            },
                            {
                                type: 'box',
                                layout: 'vertical',
                                contents: [
                                    { type: 'text', text: `${achievements}`, size: 'xxl', weight: 'bold', color: '#27ae60', align: 'center' },
                                    { type: 'text', text: '成就', size: 'xs', color: '#666666', align: 'center' }
                                ],
                                flex: 1
                            }
                        ],
                        margin: 'lg'
                    },
                    {
                        type: 'box',
                        layout: 'vertical',
                        contents: [
                            {
                                type: 'box',
                                layout: 'vertical',
                                contents: [],
                                backgroundColor: '#f4d03f',
                                height: '8px',
                                width: `${percentage}%`
                            }
                        ],
                        backgroundColor: '#eeeeee',
                        height: '8px',
                        margin: 'lg',
                        cornerRadius: '4px'
                    },
                    {
                        type: 'text',
                        text: `完成度 ${percentage}%`,
                        size: 'sm',
                        color: '#666666',
                        align: 'center',
                        margin: 'sm'
                    },
                    completedCounties.length > 0 ? {
                        type: 'text',
                        text: `🏆 已制霸：${completedCounties.join('、')}`,
                        size: 'sm',
                        color: '#27ae60',
                        margin: 'lg',
                        wrap: true
                    } : {
                        type: 'text',
                        text: '繼續努力，制霸各縣市！',
                        size: 'sm',
                        color: '#666666',
                        margin: 'lg'
                    }
                ]
            }
        }
    });
}

async function sendHelpMessage(replyToken) {
    await replyMessage(replyToken, {
        type: 'flex',
        altText: '台灣探險圖鑑功能說明',
        contents: {
            type: 'bubble',
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: '🗺️ 台灣探險圖鑑',
                        size: 'lg',
                        weight: 'bold'
                    },
                    {
                        type: 'text',
                        text: '你可以這樣使用：',
                        size: 'sm',
                        color: '#666666',
                        margin: 'md'
                    },
                    {
                        type: 'box',
                        layout: 'vertical',
                        contents: [
                            { type: 'text', text: '📍 傳送位置 → 自動打卡', size: 'sm', margin: 'sm' },
                            { type: 'text', text: '📊 輸入「進度」→ 查看收集', size: 'sm', margin: 'sm' },
                            { type: 'text', text: '🔗 輸入「連動 碼」→ 綁定帳號', size: 'sm', margin: 'sm' },
                            { type: 'text', text: '❓ 輸入「幫助」→ 顯示功能', size: 'sm', margin: 'sm' }
                        ],
                        margin: 'lg'
                    }
                ]
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'button',
                        action: {
                            type: 'uri',
                            label: '開啟網頁版',
                            uri: process.env.WEB_URL || 'https://your-app.onrender.com'
                        },
                        style: 'primary',
                        color: '#f4d03f'
                    }
                ]
            }
        }
    });
}

async function replyMessage(replyToken, message) {
    if (!lineClient) return;
    
    try {
        await lineClient.replyMessage(replyToken, message);
    } catch (error) {
        console.error('回覆訊息失敗:', error);
    }
}

// ==================== 靜態頁面 ====================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// ==================== 啟動伺服器 ====================

app.listen(PORT, () => {
    console.log(`🚀 伺服器已啟動: http://localhost:${PORT}`);
    console.log(`📦 環境: ${process.env.NODE_ENV || 'development'}`);
});

module.exports = app;
