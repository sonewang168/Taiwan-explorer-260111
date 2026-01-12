// ==========================================
// 台灣探險圖鑑 - 後端伺服器 v2
// Express + LINE Bot + Google Photos + Docs
// ==========================================

const express = require('express');
const cors = require('cors');
const path = require('path');
const admin = require('firebase-admin');
const line = require('@line/bot-sdk');
const fetch = require('node-fetch');
const GoogleIntegration = require('./google-integration');

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
    },
    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        redirectUri: process.env.GOOGLE_REDIRECT_URI || ''
    },
    webUrl: process.env.WEB_URL || 'https://your-app.onrender.com'
};

// ==================== 初始化服務 ====================

// Firebase
let db = null;
if (config.firebase.projectId && config.firebase.privateKey) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert({
                projectId: config.firebase.projectId,
                clientEmail: config.firebase.clientEmail,
                privateKey: config.firebase.privateKey
            })
        });
        db = admin.firestore();
        console.log('✅ Firebase 已連線，專案:', config.firebase.projectId);
    } catch (error) {
        console.error('❌ Firebase 初始化失敗:', error.message);
    }
} else {
    console.log('⚠️ Firebase 未設定，projectId:', config.firebase.projectId ? '有' : '無', ', privateKey:', config.firebase.privateKey ? '有' : '無');
}

// LINE Bot
let lineClient = null;
if (config.line.channelAccessToken && config.line.channelSecret) {
    lineClient = new line.Client(config.line);
    console.log('✅ LINE Bot 已初始化');
}

// Google Integration
const googleApi = new GoogleIntegration(config.google);
if (config.google.clientId) {
    console.log('✅ Google API 已初始化');
}

// 記憶體儲存
const memoryStore = {
    users: {},
    lineLinks: {},
    pendingPhotos: {} // 暫存待處理的照片
};

// 載入景點資料
const spotsData = require('./spots.json');

// ==================== Middleware ====================
app.use(cors());
app.use(express.static(path.join(__dirname, '..', 'public')));
app.use('/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '10mb' }));

// ==================== 輔助函數 ====================

function findNearbySpots(lat, lng, radiusKm = 0.5) {
    const results = [];
    Object.entries(spotsData).forEach(([county, data]) => {
        data.spots.forEach(spot => {
            const distance = getDistance(lat, lng, spot.lat, spot.lng);
            if (distance <= radiusKm) {
                results.push({
                    spotId: `${county}-${spot.id}`,
                    county,
                    ...spot,
                    distance: Math.round(distance * 1000)
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

async function getUserData(lineUserId) {
    // 先從記憶體讀取
    let userData = memoryStore.users[lineUserId] || {};
    
    if (!db) return Object.keys(userData).length > 0 ? userData : null;
    
    // 從 lineUsers 讀取 Google 連動資料
    try {
        const lineUserDoc = await db.collection('lineUsers').doc(lineUserId).get();
        if (lineUserDoc.exists) {
            userData = { ...userData, ...lineUserDoc.data() };
            // 同步到記憶體
            memoryStore.users[lineUserId] = userData;
        }
    } catch (e) {
        console.log('讀取 lineUsers 失敗:', e.message);
    }
    
    // 也嘗試從 lineLinks 讀取（相容舊資料）
    try {
        const linkDoc = await db.collection('lineLinks').doc(lineUserId).get();
        if (linkDoc.exists) {
            const firebaseUserId = linkDoc.data().firebaseUserId;
            const userDoc = await db.collection('users').doc(firebaseUserId).get();
            if (userDoc.exists) {
                userData = { ...userData, id: firebaseUserId, ...userDoc.data() };
            }
        }
    } catch (e) {
        console.log('讀取 lineLinks 失敗:', e.message);
    }
    
    return Object.keys(userData).length > 0 ? userData : null;
}

async function updateUserData(lineUserId, updates) {
    // 更新記憶體
    memoryStore.users[lineUserId] = { ...memoryStore.users[lineUserId], ...updates };
    
    if (!db) return;
    
    // 更新 lineUsers
    try {
        await db.collection('lineUsers').doc(lineUserId).set({
            ...updates,
            updatedAt: new Date().toISOString()
        }, { merge: true });
    } catch (e) {
        console.log('更新 lineUsers 失敗:', e.message);
    }
    
    // 也更新 users（相容舊資料）
    try {
        const linkDoc = await db.collection('lineLinks').doc(lineUserId).get();
        if (linkDoc.exists) {
            const firebaseUserId = linkDoc.data().firebaseUserId;
            await db.collection('users').doc(firebaseUserId).update(updates);
        }
    } catch (e) {
        // 忽略
    }
}

// ==================== API 路由 ====================

app.get('/api/spots', (req, res) => {
    res.json(spotsData);
});

// Google OAuth 回調
app.get('/auth/google/callback', async (req, res) => {
    const { code, state: lineUserId } = req.query;
    
    try {
        const tokens = await googleApi.getTokensFromCode(code);
        
        // 儲存 tokens 到記憶體（立即可用）
        if (!memoryStore.users[lineUserId]) {
            memoryStore.users[lineUserId] = {};
        }
        memoryStore.users[lineUserId].googleTokens = tokens;
        
        // 建立相簿和文件
        const albumResult = await googleApi.getOrCreateAlbum(tokens);
        const docId = await googleApi.getOrCreateDoc(tokens);
        
        // albumResult 是 { id, productUrl }
        const albumId = albumResult.id || albumResult;
        const albumUrl = albumResult.productUrl || null;
        
        // 保存到記憶體
        memoryStore.users[lineUserId].googleAlbumId = albumId;
        memoryStore.users[lineUserId].googleAlbumUrl = albumUrl;
        memoryStore.users[lineUserId].googleDocId = docId;
        
        // 儲存到 Firebase（永久保存）
        if (db && lineUserId) {
            await db.collection('lineUsers').doc(lineUserId).set({
                googleTokens: tokens,
                googleAlbumId: albumId,
                googleAlbumUrl: albumUrl,
                googleDocId: docId,
                updatedAt: new Date().toISOString()
            }, { merge: true });
        }
        
        // 通知 LINE
        if (lineClient && lineUserId) {
            await lineClient.pushMessage(lineUserId, {
                type: 'text',
                text: '✅ Google 帳號連動成功！\n\n' +
                      '📷 照片會自動存到「台灣探險圖鑑」相簿\n' +
                      '📝 打卡心得會自動寫入 Google 文件\n\n' +
                      '現在開始，傳送位置 + 照片就能一次搞定！'
            });
        }
        
        res.send(`
            <html>
            <head><meta charset="utf-8"><title>連動成功</title></head>
            <body style="font-family: sans-serif; text-align: center; padding: 50px;">
                <h1>✅ Google 連動成功！</h1>
                <p>你可以關閉這個視窗，回到 LINE 繼續使用。</p>
            </body>
            </html>
        `);
    } catch (error) {
        console.error('Google OAuth 錯誤:', error);
        res.status(500).send('連動失敗，請稍後再試');
    }
});

// Google 連動中介頁面（避免 LINE 內建瀏覽器問題）
app.get('/google-link', (req, res) => {
    const userId = req.query.user;
    
    if (!userId) {
        res.status(400).send('缺少用戶資訊');
        return;
    }
    
    const authUrl = googleApi.getAuthUrl(userId);
    
    if (!authUrl) {
        res.send('Google 連動功能尚未設定');
        return;
    }
    
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1">
            <title>連動 Google 帳號</title>
            <style>
                body {
                    font-family: -apple-system, sans-serif;
                    background: linear-gradient(135deg, #1a1a2e, #16213e);
                    min-height: 100vh;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    margin: 0;
                    color: #fff;
                    padding: 1rem;
                }
                .card {
                    background: rgba(255,255,255,0.1);
                    padding: 2rem;
                    border-radius: 20px;
                    text-align: center;
                    max-width: 350px;
                    width: 100%;
                }
                h1 { font-size: 1.5rem; margin-bottom: 1rem; }
                p { color: #aaa; margin-bottom: 1rem; line-height: 1.6; }
                .btn {
                    display: inline-block;
                    background: #4285F4;
                    color: #fff;
                    padding: 1rem 2rem;
                    border-radius: 50px;
                    text-decoration: none;
                    font-weight: bold;
                    font-size: 1rem;
                    margin-top: 1rem;
                }
                .btn:hover { background: #3367D6; }
                .warning {
                    background: rgba(255, 193, 7, 0.2);
                    border: 1px solid #ffc107;
                    border-radius: 10px;
                    padding: 1rem;
                    margin: 1rem 0;
                    color: #ffc107;
                    font-size: 0.9rem;
                }
                .copy-btn {
                    background: #00f5ff;
                    color: #000;
                    border: none;
                    padding: 0.5rem 1.5rem;
                    border-radius: 20px;
                    font-weight: bold;
                    cursor: pointer;
                }
                .hidden { display: none; }
            </style>
        </head>
        <body>
            <div class="card">
                <h1>🔗 連動 Google 帳號</h1>
                
                <div id="lineWarning" class="hidden">
                    <div class="warning">
                        ⚠️ 請用外部瀏覽器開啟<br>
                        <small>Google 不支援在 LINE 內登入</small>
                    </div>
                    <p>請複製此頁網址，用 Safari 或 Chrome 開啟</p>
                    <button class="copy-btn" onclick="copyUrl()">📋 複製網址</button>
                </div>
                
                <div id="normalView" class="hidden">
                    <p>連動後可以：<br>
                    📷 照片自動存到 Google 相簿<br>
                    📝 心得自動寫入 Google 文件</p>
                    <a href="${authUrl}" class="btn">開始連動</a>
                </div>
            </div>
            
            <script>
                const isLine = /Line/i.test(navigator.userAgent);
                
                if (isLine) {
                    document.getElementById('lineWarning').classList.remove('hidden');
                } else {
                    document.getElementById('normalView').classList.remove('hidden');
                }
                
                function copyUrl() {
                    navigator.clipboard.writeText(window.location.href).then(() => {
                        alert('✅ 已複製！請用 Safari 或 Chrome 開啟');
                    });
                }
            </script>
        </body>
        </html>
    `);
});

// ==================== LINE Webhook ====================

app.post('/webhook', async (req, res) => {
    if (!lineClient) {
        res.status(200).end();
        return;
    }
    
    const signature = req.get('x-line-signature');
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
        case 'postback':
            await handlePostback(event, userId);
            break;
    }
}

async function handleLineMessage(event, userId) {
    const message = event.message;
    
    // 處理位置訊息
    if (message.type === 'location') {
        await handleLocationCheckin(userId, message.latitude, message.longitude, event.replyToken);
        return;
    }
    
    // 處理圖片訊息
    if (message.type === 'image') {
        await handleImageMessage(userId, message.id, event.replyToken);
        return;
    }
    
    // 處理文字訊息
    if (message.type === 'text') {
        const text = message.text.trim();
        
        if (text.startsWith('連動 ') || text === '連動') {
            const code = text.replace('連動', '').trim();
            await handleLinkCommand(userId, code, event.replyToken);
            return;
        }
        
        if (text === '進度' || text === '我的進度') {
            await handleProgressQuery(userId, event.replyToken);
            return;
        }
        
        if (text === '附近' || text === '附近景點') {
            await replyMessage(event.replyToken, {
                type: 'text',
                text: '📍 請傳送你的位置！\n\n點擊下方選單的「📍 打卡」或\n點擊左下角「+」→「位置資訊」'
            });
            return;
        }
        
        if (text === '相簿' || text === '我的相簿') {
            await handleAlbumQuery(userId, event.replyToken);
            return;
        }
        
        if (text === '文件' || text === '我的文件' || text === '紀錄') {
            await handleDocQuery(userId, event.replyToken);
            return;
        }
        
        if (text === '連動Google' || text === '綁定Google') {
            await handleGoogleLink(userId, event.replyToken);
            return;
        }
        
        if (text === '幫助' || text === '功能' || text === 'help') {
            await sendHelpMessage(event.replyToken);
            return;
        }
        
        // 檢查是否在等待心得輸入
        if (memoryStore.pendingPhotos[userId]) {
            await handleNoteInput(userId, text, event.replyToken);
            return;
        }
        
        await sendHelpMessage(event.replyToken);
    }
}

async function handleFollow(userId) {
    if (!lineClient) return;
    
    await lineClient.pushMessage(userId, {
        type: 'flex',
        altText: '歡迎加入台灣探險圖鑑！',
        contents: {
            type: 'bubble',
            hero: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'text',
                        text: '🗺️',
                        size: '4xl',
                        align: 'center'
                    },
                    {
                        type: 'text',
                        text: '台灣探險圖鑑',
                        size: 'xl',
                        weight: 'bold',
                        color: '#f4d03f',
                        align: 'center',
                        margin: 'md'
                    }
                ],
                backgroundColor: '#1a1a2e',
                paddingAll: '30px'
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    { type: 'text', text: '歡迎開始你的探險！', weight: 'bold', size: 'lg' },
                    { type: 'separator', margin: 'lg' },
                    {
                        type: 'box',
                        layout: 'vertical',
                        contents: [
                            { type: 'text', text: '📍 傳位置 → 自動打卡', size: 'sm', margin: 'md' },
                            { type: 'text', text: '📷 傳照片 → 存到相簿', size: 'sm', margin: 'sm' },
                            { type: 'text', text: '📊 查進度 → 看收集統計', size: 'sm', margin: 'sm' },
                            { type: 'text', text: '🔗 連動帳號 → 網頁同步', size: 'sm', margin: 'sm' }
                        ],
                        margin: 'lg'
                    }
                ]
            },
            footer: {
                type: 'box',
                layout: 'horizontal',
                contents: [
                    {
                        type: 'button',
                        action: {
                            type: 'uri',
                            label: '開啟網頁版',
                            uri: config.webUrl
                        },
                        style: 'primary',
                        color: '#f4d03f'
                    }
                ]
            }
        }
    });
    
    // 設定 Rich Menu
    await setupRichMenu(userId);
}

async function handleLocationCheckin(userId, lat, lng, replyToken) {
    const nearbySpots = findNearbySpots(lat, lng, 0.5);
    
    if (nearbySpots.length === 0) {
        const farSpots = findNearbySpots(lat, lng, 10).slice(0, 3);
        await replyMessage(replyToken, {
            type: 'text',
            text: `😢 附近 500m 內沒有景點...\n\n🔍 最近的景點：\n${farSpots.map(s => `• ${s.name}（${(s.distance/1000).toFixed(1)}km）`).join('\n')}`
        });
        return;
    }
    
    let userData = await getUserData(userId);
    if (!userData) {
        userData = { collectedSpots: [], logs: [] };
    }
    
    const uncollected = nearbySpots.filter(s => !userData.collectedSpots?.includes(s.spotId));
    
    if (uncollected.length === 0) {
        await replyMessage(replyToken, {
            type: 'text',
            text: `✅ 附近的景點你都收集過了！\n\n${nearbySpots.map(s => `• ${s.name} ✓`).join('\n')}`
        });
        return;
    }
    
    const spot = uncollected[0];
    
    // 儲存待打卡資訊
    memoryStore.pendingPhotos[userId] = {
        spotId: spot.spotId,
        county: spot.county,
        spot: spot,
        lat,
        lng,
        timestamp: new Date().toISOString(),
        step: 'waiting_photo' // waiting_photo, waiting_note
    };
    
    await replyMessage(replyToken, {
        type: 'flex',
        altText: `發現景點：${spot.name}`,
        contents: {
            type: 'bubble',
            hero: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    { type: 'text', text: '🎯 發現景點！', size: 'lg', weight: 'bold', color: '#f4d03f', align: 'center' }
                ],
                backgroundColor: '#1a1a2e',
                paddingAll: '20px'
            },
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    { type: 'text', text: spot.name, size: 'xl', weight: 'bold' },
                    { type: 'text', text: `${spot.county} · ${spot.desc}`, size: 'sm', color: '#666', margin: 'sm' },
                    { type: 'text', text: `📍 距離：${spot.distance}m`, size: 'sm', color: '#27ae60', margin: 'md' },
                    { type: 'separator', margin: 'lg' },
                    { type: 'text', text: '📷 傳送照片來記錄這個景點！', size: 'sm', margin: 'lg', wrap: true },
                    { type: 'text', text: '或點擊下方按鈕直接打卡', size: 'xs', color: '#999', margin: 'sm' }
                ]
            },
            footer: {
                type: 'box',
                layout: 'horizontal',
                contents: [
                    {
                        type: 'button',
                        action: {
                            type: 'postback',
                            label: '直接打卡',
                            data: `action=checkin&spotId=${spot.spotId}`,
                            displayText: '直接打卡'
                        },
                        style: 'primary',
                        color: '#27ae60'
                    },
                    {
                        type: 'button',
                        action: {
                            type: 'postback',
                            label: '取消',
                            data: 'action=cancel',
                            displayText: '取消'
                        },
                        style: 'secondary',
                        margin: 'sm'
                    }
                ]
            }
        }
    });
}

async function handleImageMessage(userId, messageId, replyToken) {
    const pending = memoryStore.pendingPhotos[userId];
    
    if (!pending || pending.step !== 'waiting_photo') {
        await replyMessage(replyToken, {
            type: 'text',
            text: '📍 請先傳送位置來找附近的景點！\n\n點擊下方選單的「📍 打卡」'
        });
        return;
    }
    
    try {
        // 下載圖片
        const stream = await lineClient.getMessageContent(messageId);
        const chunks = [];
        for await (const chunk of stream) {
            chunks.push(chunk);
        }
        const photoBuffer = Buffer.concat(chunks);
        
        // 儲存圖片資訊
        pending.photoBuffer = photoBuffer;
        pending.step = 'waiting_note';
        
        await replyMessage(replyToken, {
            type: 'text',
            text: `📷 照片已收到！\n\n💭 請輸入這次探險的心得（或輸入「跳過」直接打卡）`
        });
    } catch (error) {
        console.error('下載圖片失敗:', error);
        await replyMessage(replyToken, {
            type: 'text',
            text: '❌ 照片處理失敗，請重新傳送'
        });
    }
}

async function handleNoteInput(userId, note, replyToken) {
    const pending = memoryStore.pendingPhotos[userId];
    
    if (note !== '跳過') {
        pending.note = note;
    }
    
    await completeCheckin(userId, replyToken);
}

async function completeCheckin(userId, replyToken) {
    const pending = memoryStore.pendingPhotos[userId];
    if (!pending) return;
    
    let userData = await getUserData(userId);
    if (!userData) {
        userData = { collectedSpots: [], logs: [], googleTokens: null };
    }
    
    const { spotId, county, spot, note, photoBuffer, timestamp } = pending;
    
    // 更新收集資料
    if (!userData.collectedSpots) userData.collectedSpots = [];
    if (!userData.logs) userData.logs = [];
    
    userData.collectedSpots.push(spotId);
    
    const logEntry = {
        spotId,
        county,
        name: spot.name,
        time: timestamp,
        note: note || null,
        source: 'line'
    };
    
    let photoUrl = null;
    let albumUrl = null;
    let docUrl = null;
    
    // 上傳到 Google（如果已連動）
    if (userData.googleTokens && photoBuffer) {
        try {
            // 刷新 token
            const tokens = await googleApi.refreshTokens(userData.googleTokens.refresh_token);
            userData.googleTokens = tokens;
            
            // 上傳到相簿
            const albumId = userData.googleAlbumId || await googleApi.getOrCreateAlbum(tokens);
            const filename = `${spot.name}_${Date.now()}.jpg`;
            const description = `📍 ${spot.name}\n📅 ${new Date(timestamp).toLocaleString('zh-TW')}\n${note || ''}`;
            
            const mediaItem = await googleApi.uploadPhotoToAlbum(tokens, albumId, photoBuffer, filename, description);
            photoUrl = mediaItem.baseUrl;
            albumUrl = await googleApi.getAlbumUrl(tokens, albumId);
            
            // 寫入文件
            const docId = userData.googleDocId || await googleApi.getOrCreateDoc(tokens);
            docUrl = await googleApi.appendCheckinToDoc(tokens, docId, {
                spotName: spot.name,
                county,
                note,
                photoUrl: photoUrl + '=w800',
                timestamp
            });
            
            // 更新用戶資料
            userData.googleAlbumId = albumId;
            userData.googleDocId = docId;
            
        } catch (error) {
            console.error('Google API 錯誤:', error);
        }
    }
    
    logEntry.photoUrl = photoUrl;
    userData.logs.unshift(logEntry);
    
    // 儲存
    await updateUserData(userId, {
        collectedSpots: userData.collectedSpots,
        logs: userData.logs,
        googleTokens: userData.googleTokens,
        googleAlbumId: userData.googleAlbumId,
        googleDocId: userData.googleDocId,
        collectedCount: userData.collectedSpots.length
    });
    
    // 清除暫存
    delete memoryStore.pendingPhotos[userId];
    
    // 回覆
    const contents = {
        type: 'bubble',
        hero: {
            type: 'box',
            layout: 'vertical',
            contents: [
                { type: 'text', text: '🎉', size: '4xl', align: 'center' },
                { type: 'text', text: '打卡成功！', size: 'xl', weight: 'bold', color: '#f4d03f', align: 'center', margin: 'md' }
            ],
            backgroundColor: '#1a1a2e',
            paddingAll: '25px'
        },
        body: {
            type: 'box',
            layout: 'vertical',
            contents: [
                { type: 'text', text: spot.name, size: 'xl', weight: 'bold' },
                { type: 'text', text: `${county} · ${spot.desc}`, size: 'sm', color: '#666', margin: 'sm' },
                { type: 'separator', margin: 'lg' },
                { type: 'text', text: `✨ 已收集 ${userData.collectedSpots.length} 個景點`, size: 'sm', color: '#27ae60', margin: 'lg' }
            ]
        }
    };
    
    // 如果有 Google 整合，加上連結
    const footerButtons = [];
    
    if (albumUrl) {
        footerButtons.push({
            type: 'button',
            action: { type: 'uri', label: '📷 查看相簿', uri: albumUrl },
            style: 'secondary',
            height: 'sm'
        });
    }
    
    if (docUrl) {
        footerButtons.push({
            type: 'button',
            action: { type: 'uri', label: '📝 查看文件', uri: docUrl },
            style: 'secondary',
            height: 'sm',
            margin: albumUrl ? 'sm' : 'none'
        });
    }
    
    // 只有真的有按鈕時才加 footer
    if (footerButtons.length > 0) {
        contents.footer = {
            type: 'box',
            layout: 'vertical',
            contents: footerButtons
        };
    }
    
    await replyMessage(replyToken, {
        type: 'flex',
        altText: `🎉 成功打卡：${spot.name}`,
        contents
    });
}

async function handlePostback(event, userId) {
    const data = new URLSearchParams(event.postback.data);
    const action = data.get('action');
    
    if (action === 'checkin') {
        const spotId = data.get('spotId');
        const pending = memoryStore.pendingPhotos[userId];
        
        if (pending && pending.spotId === spotId) {
            await completeCheckin(userId, event.replyToken);
        }
    } else if (action === 'cancel') {
        delete memoryStore.pendingPhotos[userId];
        await replyMessage(event.replyToken, {
            type: 'text',
            text: '已取消 👌'
        });
    }
}

async function handleLinkCommand(userId, code, replyToken) {
    if (!code) {
        await replyMessage(replyToken, {
            type: 'text',
            text: '請輸入連動碼\n格式：連動 XXXXXXXX\n\n連動碼可在網頁版「紀錄」頁面找到'
        });
        return;
    }
    
    try {
        if (!db) {
            await replyMessage(replyToken, {
                type: 'text',
                text: '⚠️ 資料庫尚未設定\n\n目前 LINE Bot 可獨立使用，無需連動'
            });
            return;
        }
        
        const searchCode = code.toUpperCase();
        console.log('搜尋連動碼:', searchCode);
        
        const snapshot = await db.collection('users')
            .where('linkCode', '==', searchCode)
            .limit(1)
            .get();
        
        console.log('查詢結果數量:', snapshot.size);
        
        if (snapshot.empty) {
            // 嘗試列出所有用戶的 linkCode 來 debug
            const allUsers = await db.collection('users').get();
            console.log('所有用戶數量:', allUsers.size);
            allUsers.forEach(doc => {
                console.log('用戶 linkCode:', doc.data().linkCode);
            });
            
            await replyMessage(replyToken, { type: 'text', text: '❌ 連動碼無效\n\n請確認連動碼正確' });
            return;
        }
        
        const userDoc = snapshot.docs[0];
        console.log('找到用戶:', userDoc.id);
        
        await db.collection('lineLinks').doc(userId).set({
            firebaseUserId: userDoc.id,
            linkedAt: admin.firestore.FieldValue.serverTimestamp()
        });
        await userDoc.ref.update({ lineUserId: userId });
        
        await replyMessage(replyToken, {
            type: 'text',
            text: '✅ 帳號連動成功！\n\n網頁和 LINE 的資料會自動同步'
        });
    } catch (error) {
        console.error('連動失敗:', error);
        await replyMessage(replyToken, { type: 'text', text: '❌ 連動失敗，請稍後再試' });
    }
}

async function handleGoogleLink(userId, replyToken) {
    if (!config.google.clientId) {
        await replyMessage(replyToken, {
            type: 'text',
            text: '❌ Google 連動功能尚未設定'
        });
        return;
    }
    
    // 使用中介頁面的短連結
    const linkUrl = `${config.webUrl}/google-link?user=${userId}`;
    
    await replyMessage(replyToken, {
        type: 'text',
        text: '🔗 連動 Google 帳號\n\n' +
              '連動後可以：\n' +
              '📷 照片自動存到 Google 相簿\n' +
              '📝 心得自動寫入 Google 文件\n' +
              '☁️ 永久保存探險紀錄\n\n' +
              '👉 點擊連結開始連動：\n' +
              linkUrl
    });
}

async function handleAlbumQuery(userId, replyToken) {
    const userData = await getUserData(userId);
    
    if (!userData?.googleAlbumId || !userData?.googleTokens) {
        await replyMessage(replyToken, {
            type: 'text',
            text: '📷 你還沒有連動 Google 帳號\n\n輸入「連動Google」來開始'
        });
        return;
    }
    
    try {
        // 優先使用保存的 URL
        let albumUrl = userData.googleAlbumUrl;
        
        // 如果沒有保存的 URL，嘗試從 API 取得
        if (!albumUrl) {
            const tokens = await googleApi.refreshTokens(userData.googleTokens.refresh_token);
            albumUrl = await googleApi.getAlbumUrl(tokens, userData.googleAlbumId);
            
            // 保存以供下次使用
            if (albumUrl) {
                await updateUserData(userId, { googleAlbumUrl: albumUrl });
            }
        }
        
        if (!albumUrl) {
            await replyMessage(replyToken, {
                type: 'text',
                text: '❌ 無法取得相簿連結\n\n請重新輸入「連動Google」'
            });
            return;
        }
        
        await replyMessage(replyToken, {
            type: 'flex',
            altText: '我的探險相簿',
            contents: {
                type: 'bubble',
                body: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        { type: 'text', text: '📷 我的探險相簿', size: 'lg', weight: 'bold' },
                        { type: 'text', text: '所有打卡照片都在這裡！', size: 'sm', color: '#666666', margin: 'md' }
                    ]
                },
                footer: {
                    type: 'box',
                    layout: 'vertical',
                    contents: [
                        {
                            type: 'button',
                            action: { type: 'uri', label: '開啟相簿', uri: albumUrl },
                            style: 'primary',
                            color: '#27ae60'
                        }
                    ]
                }
            }
        });
    } catch (error) {
        console.error('取得相簿失敗:', error);
        await replyMessage(replyToken, { type: 'text', text: '❌ 取得相簿失敗，請稍後再試' });
    }
}

async function handleDocQuery(userId, replyToken) {
    const userData = await getUserData(userId);
    
    if (!userData?.googleDocId) {
        await replyMessage(replyToken, {
            type: 'text',
            text: '📝 你還沒有連動 Google 帳號\n\n輸入「連動Google」來開始'
        });
        return;
    }
    
    // 確保 docUrl 有值
    const docUrl = googleApi.getDocUrl(userData.googleDocId) || `https://docs.google.com/document/d/${userData.googleDocId}/edit`;
    
    await replyMessage(replyToken, {
        type: 'flex',
        altText: '我的旅行紀錄',
        contents: {
            type: 'bubble',
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    { type: 'text', text: '📝 我的旅行紀錄', size: 'lg', weight: 'bold' },
                    { type: 'text', text: '圖文並茂的探險日誌', size: 'sm', color: '#666666', margin: 'md' }
                ]
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'button',
                        action: { type: 'uri', label: '開啟文件', uri: docUrl },
                        style: 'primary',
                        color: '#f4d03f'
                    }
                ]
            }
        }
    });
}

async function handleProgressQuery(userId, replyToken) {
    let userData = await getUserData(userId);
    
    if (!userData) {
        userData = { collectedSpots: [] };
    }
    
    const total = Object.values(spotsData).reduce((sum, c) => sum + c.spots.length, 0);
    const collected = userData.collectedSpots?.length || 0;
    const percentage = Math.round((collected / total) * 100);
    
    // 用文字產生進度條
    const barLength = 10;
    const filled = Math.round(barLength * percentage / 100);
    const progressBar = '🟨'.repeat(filled) + '⬜'.repeat(barLength - filled);
    
    await replyMessage(replyToken, {
        type: 'text',
        text: `🗺️ 我的探險進度\n\n` +
              `📍 已收集：${collected} / ${total}\n\n` +
              `${progressBar}\n\n` +
              `✨ 完成度：${percentage}%`
    });
}

async function sendHelpMessage(replyToken) {
    await replyMessage(replyToken, {
        type: 'flex',
        altText: '功能說明',
        contents: {
            type: 'bubble',
            body: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    { type: 'text', text: '🗺️ 台灣探險圖鑑', size: 'lg', weight: 'bold' },
                    { type: 'separator', margin: 'lg' },
                    { type: 'text', text: '📍 傳位置 → 打卡', size: 'sm', margin: 'lg' },
                    { type: 'text', text: '📷 傳照片 → 存相簿', size: 'sm', margin: 'sm' },
                    { type: 'text', text: '「進度」→ 查看收集', size: 'sm', margin: 'sm' },
                    { type: 'text', text: '「相簿」→ 查看照片', size: 'sm', margin: 'sm' },
                    { type: 'text', text: '「文件」→ 查看紀錄', size: 'sm', margin: 'sm' },
                    { type: 'text', text: '「連動Google」→ 綁定雲端', size: 'sm', margin: 'sm' },
                    { type: 'text', text: '「連動 碼」→ 綁定網頁', size: 'sm', margin: 'sm' }
                ]
            },
            footer: {
                type: 'box',
                layout: 'vertical',
                contents: [
                    {
                        type: 'button',
                        action: { type: 'uri', label: '開啟網頁版', uri: config.webUrl },
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

// ==================== Rich Menu 設定 ====================

async function setupRichMenu(userId) {
    if (!lineClient) return;
    
    try {
        // 檢查是否已有 Rich Menu
        const richMenuId = await createRichMenu();
        if (richMenuId) {
            await lineClient.linkRichMenuToUser(userId, richMenuId);
        }
    } catch (error) {
        console.error('設定 Rich Menu 失敗:', error);
    }
}

async function createRichMenu() {
    // 先檢查是否已存在
    try {
        const list = await lineClient.getRichMenuList();
        const existing = list.find(m => m.name === 'taiwan-explorer-menu');
        if (existing) {
            return existing.richMenuId;
        }
    } catch (e) {}
    
    // 建立新的 Rich Menu
    const richMenu = {
        size: { width: 2500, height: 1686 },
        selected: true,
        name: 'taiwan-explorer-menu',
        chatBarText: '📍 探險選單',
        areas: [
            // 第一列
            {
                bounds: { x: 0, y: 0, width: 833, height: 843 },
                action: { type: 'message', text: '附近' }
            },
            {
                bounds: { x: 833, y: 0, width: 834, height: 843 },
                action: { type: 'message', text: '進度' }
            },
            {
                bounds: { x: 1667, y: 0, width: 833, height: 843 },
                action: { type: 'message', text: '相簿' }
            },
            // 第二列
            {
                bounds: { x: 0, y: 843, width: 833, height: 843 },
                action: { type: 'message', text: '文件' }
            },
            {
                bounds: { x: 833, y: 843, width: 834, height: 843 },
                action: { type: 'message', text: '連動Google' }
            },
            {
                bounds: { x: 1667, y: 843, width: 833, height: 843 },
                action: { type: 'uri', label: '網頁版', uri: config.webUrl }
            }
        ]
    };
    
    try {
        const richMenuId = await lineClient.createRichMenu(richMenu);
        
        // 上傳圖片（需要先產生圖片）
        const imageBuffer = await generateRichMenuImage();
        await lineClient.setRichMenuImage(richMenuId, imageBuffer, 'image/png');
        
        // 設為預設
        await lineClient.setDefaultRichMenu(richMenuId);
        
        return richMenuId;
    } catch (error) {
        console.error('建立 Rich Menu 失敗:', error);
        return null;
    }
}

// 產生 Rich Menu 圖片（使用 Canvas）
async function generateRichMenuImage() {
    const { createCanvas } = require('canvas');
    const canvas = createCanvas(2500, 1686);
    const ctx = canvas.getContext('2d');
    
    // 背景
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 2500, 1686);
    
    // 格線
    ctx.strokeStyle = '#f4d03f';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(833, 0);
    ctx.lineTo(833, 1686);
    ctx.moveTo(1667, 0);
    ctx.lineTo(1667, 1686);
    ctx.moveTo(0, 843);
    ctx.lineTo(2500, 843);
    ctx.stroke();
    
    // 設定文字
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    const items = [
        { icon: '📍', text: '打卡', x: 416, y: 421 },
        { icon: '📊', text: '進度', x: 1250, y: 421 },
        { icon: '📷', text: '相簿', x: 2083, y: 421 },
        { icon: '📝', text: '紀錄', x: 416, y: 1264 },
        { icon: '🔗', text: 'Google', x: 1250, y: 1264 },
        { icon: '🌐', text: '網頁版', x: 2083, y: 1264 }
    ];
    
    items.forEach(item => {
        // 圖示
        ctx.font = '180px sans-serif';
        ctx.fillStyle = '#ffffff';
        ctx.fillText(item.icon, item.x, item.y - 80);
        
        // 文字
        ctx.font = 'bold 72px sans-serif';
        ctx.fillStyle = '#f4d03f';
        ctx.fillText(item.text, item.x, item.y + 100);
    });
    
    return canvas.toBuffer('image/png');
}

// ==================== 靜態頁面 ====================

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// ==================== 啟動伺服器 ====================

app.listen(PORT, () => {
    console.log(`🚀 伺服器已啟動: http://localhost:${PORT}`);
});

module.exports = app;
