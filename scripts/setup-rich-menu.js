// ==========================================
// Rich Menu 設定腳本
// 用於建立和上傳 LINE Bot 的 Rich Menu
// ==========================================

const line = require('@line/bot-sdk');
const fs = require('fs');
const path = require('path');
const { createCanvas } = require('canvas');

// 設定
const config = {
    channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
    channelSecret: process.env.LINE_CHANNEL_SECRET
};

const WEB_URL = process.env.WEB_URL || 'https://your-app.onrender.com';

const client = new line.Client(config);

// Rich Menu 定義
const richMenuTemplate = {
    size: {
        width: 2500,
        height: 1686
    },
    selected: true,
    name: 'taiwan-explorer-menu-v2',
    chatBarText: '📍 探險選單',
    areas: [
        // 第一列：打卡、進度、相簿
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
        // 第二列：紀錄、Google、網頁版
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
            action: { type: 'uri', label: '網頁版', uri: WEB_URL }
        }
    ]
};

// 產生 Rich Menu 圖片
function generateRichMenuImage() {
    const canvas = createCanvas(2500, 1686);
    const ctx = canvas.getContext('2d');
    
    // 背景漸層
    const gradient = ctx.createLinearGradient(0, 0, 2500, 1686);
    gradient.addColorStop(0, '#1a1a2e');
    gradient.addColorStop(1, '#16213e');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 2500, 1686);
    
    // 網格線
    ctx.strokeStyle = 'rgba(244, 208, 63, 0.3)';
    ctx.lineWidth = 3;
    
    // 垂直線
    ctx.beginPath();
    ctx.moveTo(833, 0);
    ctx.lineTo(833, 1686);
    ctx.moveTo(1667, 0);
    ctx.lineTo(1667, 1686);
    ctx.stroke();
    
    // 水平線
    ctx.beginPath();
    ctx.moveTo(0, 843);
    ctx.lineTo(2500, 843);
    ctx.stroke();
    
    // 按鈕資料
    const buttons = [
        // 第一列
        { emoji: '📍', label: '打卡', x: 416, y: 421, color: '#e74c3c' },
        { emoji: '📊', label: '進度', x: 1250, y: 421, color: '#2ecc71' },
        { emoji: '📷', label: '相簿', x: 2083, y: 421, color: '#9b59b6' },
        // 第二列
        { emoji: '📝', label: '紀錄', x: 416, y: 1264, color: '#f1c40f' },
        { emoji: '🔗', label: 'Google', x: 1250, y: 1264, color: '#3498db' },
        { emoji: '🌐', label: '網頁版', x: 2083, y: 1264, color: '#e67e22' }
    ];
    
    buttons.forEach(btn => {
        // 圓形背景
        ctx.beginPath();
        ctx.arc(btn.x, btn.y - 80, 140, 0, Math.PI * 2);
        ctx.fillStyle = btn.color + '33'; // 20% 透明度
        ctx.fill();
        ctx.strokeStyle = btn.color;
        ctx.lineWidth = 4;
        ctx.stroke();
        
        // Emoji（使用文字代替，因為 canvas 對 emoji 支援有限）
        ctx.font = '160px Arial';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(btn.emoji, btn.x, btn.y - 60);
        
        // 標籤
        ctx.font = 'bold 72px Arial';
        ctx.fillStyle = '#f4d03f';
        ctx.fillText(btn.label, btn.x, btn.y + 140);
    });
    
    // 頂部標題
    ctx.font = '48px Arial';
    ctx.fillStyle = 'rgba(244, 208, 63, 0.5)';
    ctx.textAlign = 'center';
    ctx.fillText('🗺️ 台灣探險圖鑑', 1250, 60);
    
    return canvas.toBuffer('image/png');
}

// 主函數
async function setupRichMenu() {
    console.log('🚀 開始設定 Rich Menu...\n');
    
    try {
        // 1. 列出現有的 Rich Menu
        console.log('📋 檢查現有 Rich Menu...');
        const existingMenus = await client.getRichMenuList();
        console.log(`   找到 ${existingMenus.length} 個現有選單`);
        
        // 刪除舊的
        for (const menu of existingMenus) {
            if (menu.name.startsWith('taiwan-explorer')) {
                console.log(`   🗑️ 刪除舊選單: ${menu.name}`);
                await client.deleteRichMenu(menu.richMenuId);
            }
        }
        
        // 2. 建立新的 Rich Menu
        console.log('\n📝 建立新 Rich Menu...');
        const richMenuId = await client.createRichMenu(richMenuTemplate);
        console.log(`   ✅ 已建立: ${richMenuId}`);
        
        // 3. 產生並上傳圖片
        console.log('\n🎨 產生選單圖片...');
        const imageBuffer = generateRichMenuImage();
        
        // 儲存到本地（方便檢查）
        const imagePath = path.join(__dirname, '..', 'assets', 'rich-menu.png');
        fs.mkdirSync(path.dirname(imagePath), { recursive: true });
        fs.writeFileSync(imagePath, imageBuffer);
        console.log(`   💾 已儲存到: ${imagePath}`);
        
        // 上傳到 LINE
        console.log('\n📤 上傳圖片到 LINE...');
        await client.setRichMenuImage(richMenuId, imageBuffer, 'image/png');
        console.log('   ✅ 上傳成功');
        
        // 4. 設為預設 Rich Menu
        console.log('\n⭐ 設定為預設選單...');
        await client.setDefaultRichMenu(richMenuId);
        console.log('   ✅ 已設為預設');
        
        console.log('\n🎉 Rich Menu 設定完成！');
        console.log(`\n選單 ID: ${richMenuId}`);
        console.log('\n功能對應：');
        console.log('┌─────────┬─────────┬─────────┐');
        console.log('│  📍打卡  │  📊進度  │  📷相簿  │');
        console.log('├─────────┼─────────┼─────────┤');
        console.log('│  📝紀錄  │ 🔗Google │ 🌐網頁版 │');
        console.log('└─────────┴─────────┴─────────┘');
        
    } catch (error) {
        console.error('\n❌ 設定失敗:', error.message);
        if (error.originalError) {
            console.error('詳細錯誤:', error.originalError.response?.data);
        }
        process.exit(1);
    }
}

// 執行
if (require.main === module) {
    if (!config.channelAccessToken) {
        console.error('❌ 請設定環境變數 LINE_CHANNEL_ACCESS_TOKEN');
        process.exit(1);
    }
    setupRichMenu();
}

module.exports = { setupRichMenu, generateRichMenuImage };
