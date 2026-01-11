# 🗺️ 台灣探險圖鑑 v2 - 完整部署指南

## 📋 目錄
1. [架構總覽](#架構總覽)
2. [Step 1: GitHub 設定](#step-1-github-設定)
3. [Step 2: Firebase 設定](#step-2-firebase-設定)
4. [Step 3: Render 部署](#step-3-render-部署)
5. [Step 4: LINE Bot 設定](#step-4-line-bot-設定)
6. [Step 5: Google API 設定](#step-5-google-api-設定) ⭐ NEW
7. [Step 6: Rich Menu 設定](#step-6-rich-menu-設定) ⭐ NEW
8. [Step 7: 串接測試](#step-7-串接測試)
9. [常見問題](#常見問題)

---

## 架構總覽

```
┌─────────────────────────────────────────────────────────────┐
│                        使用者                                │
└─────────────────────┬───────────────────┬───────────────────┘
                      │                   │
                      ▼                   ▼
              ┌───────────────┐   ┌───────────────┐
              │   網頁前端     │   │   LINE Bot    │
              │  (靜態頁面)    │   │  (Rich Menu)  │
              └───────┬───────┘   └───────┬───────┘
                      │                   │
                      ▼                   ▼
              ┌─────────────────────────────────┐
              │         Render (後端)            │
              │      Express + Node.js          │
              └───────────────┬─────────────────┘
                              │
              ┌───────────────┼───────────────┐
              ▼               ▼               ▼
      ┌───────────┐   ┌───────────┐   ┌───────────┐
      │  Firebase  │   │  Google   │   │  Google   │
      │ Firestore  │   │  Photos   │   │   Docs    │
      └───────────┘   └───────────┘   └───────────┘
```

### v2 新增功能 ⭐

- 📷 **Google 相簿整合** - 打卡照片自動存入專屬相簿
- 📝 **Google Docs 整合** - 心得自動寫入圖文並茂的旅行日誌
- 🎨 **Rich Menu 六宮格** - 點擊按鈕快速使用功能

---

## Step 1: GitHub 設定

### 1.1 建立新 Repository

1. 前往 [GitHub](https://github.com) 登入
2. 點擊右上角 `+` → `New repository`
3. 設定：
   - Repository name: `taiwan-explorer`
   - Description: `台灣景點收集打卡應用`
   - 選擇 `Public` 或 `Private`
   - **不要**勾選 "Add a README file"
4. 點擊 `Create repository`

### 1.2 上傳程式碼

在本地終端機執行：

```bash
# 進入專案資料夾
cd taiwan-explorer-full

# 初始化 Git
git init

# 添加所有檔案
git add .

# 提交
git commit -m "Initial commit: 台灣探險圖鑑"

# 連結遠端（替換成你的 GitHub 帳號）
git remote add origin https://github.com/你的帳號/taiwan-explorer.git

# 推送
git branch -M main
git push -u origin main
```

### 1.3 確認檔案結構

確保你的 repo 有以下結構：
```
taiwan-explorer/
├── package.json
├── .gitignore
├── .env.example
├── server/
│   ├── index.js
│   └── spots.json
└── public/
    ├── index.html
    └── app.js
```

---

## Step 2: Firebase 設定

### 2.1 建立 Firebase 專案

1. 前往 [Firebase Console](https://console.firebase.google.com/)
2. 點擊 `新增專案`
3. 輸入專案名稱：`taiwan-explorer`
4. 可選擇停用 Google Analytics（不影響功能）
5. 點擊 `建立專案`

### 2.2 啟用 Firestore 資料庫

1. 左側選單 → `Firestore Database`
2. 點擊 `建立資料庫`
3. 選擇 `以正式版模式啟動`
4. 選擇區域：`asia-east1 (台灣)` 
5. 點擊 `啟用`

### 2.3 設定安全規則

在 Firestore 頁面 → `規則` 標籤，貼上：

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 用戶資料：本人可讀寫
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow read: if true; // 排行榜需要
    }
    
    // LINE 連動：後端可讀寫
    match /lineLinks/{lineUserId} {
      allow read, write: if false; // 只允許後端操作
    }
  }
}
```

點擊 `發布`

### 2.4 啟用 Authentication

1. 左側選單 → `Authentication`
2. 點擊 `開始使用`
3. 選擇 `登入方式` 標籤
4. 啟用：
   - `電子郵件/密碼`
   - `Google`（點擊後設定專案公開名稱和支援電子郵件）

### 2.5 啟用 Storage（可選，用於照片上傳）

1. 左側選單 → `Storage`
2. 點擊 `開始使用`
3. 選擇 `以正式版模式啟動`
4. 選擇區域：`asia-east1`

設定規則：
```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{userId}/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 2.6 取得前端設定

1. 點擊左上角 `專案設定`（齒輪圖示）
2. 往下滑到 `您的應用程式`
3. 點擊 `</>` (Web) 圖示
4. 輸入應用程式暱稱：`taiwan-explorer-web`
5. 點擊 `註冊應用程式`
6. 複製 `firebaseConfig` 的內容：

```javascript
const firebaseConfig = {
  apiKey: "AIzaSy...",
  authDomain: "taiwan-explorer-xxxxx.firebaseapp.com",
  projectId: "taiwan-explorer-xxxxx",
  storageBucket: "taiwan-explorer-xxxxx.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};
```

**⚠️ 重要：** 將這段設定貼到 `public/app.js` 最上方的 `firebaseConfig` 變數！

### 2.7 取得後端服務帳戶金鑰

1. 專案設定 → `服務帳戶` 標籤
2. 確認選擇 `Node.js`
3. 點擊 `產生新的私密金鑰`
4. 下載 JSON 檔案（妥善保管！）
5. 開啟 JSON，記下以下資訊：
   - `project_id`
   - `client_email`
   - `private_key`（很長的一串）

---

## Step 3: Render 部署

### 3.1 建立 Render 帳號

1. 前往 [Render](https://render.com/)
2. 點擊 `Get Started for Free`
3. 使用 GitHub 帳號登入（推薦）

### 3.2 建立 Web Service

1. Dashboard → `New +` → `Web Service`
2. 連結 GitHub：
   - 點擊 `Connect a repository`
   - 授權 Render 存取你的 GitHub
   - 選擇 `taiwan-explorer` repo
3. 設定服務：
   - **Name**: `taiwan-explorer`
   - **Region**: `Singapore (Southeast Asia)`
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Instance Type**: `Free`

### 3.3 設定環境變數

在 `Environment Variables` 區塊，點擊 `Add Environment Variable`：

| Key | Value |
|-----|-------|
| `NODE_ENV` | `production` |
| `FIREBASE_PROJECT_ID` | `你的 Firebase 專案 ID` |
| `FIREBASE_CLIENT_EMAIL` | `firebase-adminsdk-xxxxx@....iam.gserviceaccount.com` |
| `FIREBASE_PRIVATE_KEY` | `-----BEGIN PRIVATE KEY-----\n...整串...\n-----END PRIVATE KEY-----\n` |
| `LINE_CHANNEL_ACCESS_TOKEN` | （稍後填入） |
| `LINE_CHANNEL_SECRET` | （稍後填入） |
| `WEB_URL` | （部署後填入） |

**⚠️ FIREBASE_PRIVATE_KEY 注意事項：**
- 從 JSON 檔案複製 `private_key` 的值
- 包含開頭的 `-----BEGIN PRIVATE KEY-----` 和結尾的 `-----END PRIVATE KEY-----`
- 保留 `\n` 換行符號

### 3.4 部署

1. 點擊 `Create Web Service`
2. 等待部署完成（約 2-5 分鐘）
3. 部署成功後，會顯示網址如：
   ```
   https://taiwan-explorer.onrender.com
   ```
4. 點擊網址確認網站可正常運作

### 3.5 更新 WEB_URL

1. 回到 Render Dashboard
2. 點擊你的服務 → `Environment`
3. 新增或更新 `WEB_URL` = `https://taiwan-explorer.onrender.com`
4. 點擊 `Save Changes`（會自動重新部署）

---

## Step 4: LINE Bot 設定

### 4.1 建立 LINE Developers 帳號

1. 前往 [LINE Developers](https://developers.line.biz/)
2. 使用 LINE 帳號登入
3. 同意服務條款

### 4.2 建立 Provider

1. 點擊 `Create a new provider`
2. Provider name: `台灣探險圖鑑` 或你的名字
3. 點擊 `Create`

### 4.3 建立 Messaging API Channel

1. 點擊剛建立的 Provider
2. 點擊 `Create a Messaging API channel`
3. 填寫資訊：
   - **Channel type**: Messaging API
   - **Channel name**: `台灣探險圖鑑`
   - **Channel description**: `收集全台灣景點，GPS打卡，成就解鎖`
   - **Category**: `旅遊`
   - **Subcategory**: `旅行`
   - **Email**: 你的 Email
4. 勾選同意條款
5. 點擊 `Create`

### 4.4 取得 Channel Secret

1. 進入剛建立的 Channel
2. 點擊 `Basic settings` 標籤
3. 找到 `Channel secret`
4. 點擊 `Issue` 或直接複製

**記下這個值！** 這是 `LINE_CHANNEL_SECRET`

### 4.5 取得 Channel Access Token

1. 點擊 `Messaging API` 標籤
2. 滑到最下方 `Channel access token`
3. 點擊 `Issue`
4. 複製產生的 token

**記下這個值！** 這是 `LINE_CHANNEL_ACCESS_TOKEN`

### 4.6 設定 Webhook

1. 在 `Messaging API` 標籤
2. 找到 `Webhook settings`
3. 點擊 `Edit` 設定 Webhook URL：
   ```
   https://taiwan-explorer.onrender.com/webhook
   ```
   （替換成你的 Render 網址）
4. 點擊 `Update`
5. 點擊 `Verify` 確認連線成功（應顯示 `Success`）
6. 開啟 `Use webhook` 開關

### 4.7 關閉自動回覆

1. 點擊 `Auto-reply messages` 旁的 `Edit`
2. 會跳轉到 LINE Official Account Manager
3. 關閉 `自動回應訊息`
4. 關閉 `加入好友的歡迎訊息`（我們用程式處理）

### 4.8 更新 Render 環境變數

1. 回到 Render Dashboard
2. 點擊你的服務 → `Environment`
3. 更新：
   - `LINE_CHANNEL_ACCESS_TOKEN` = 你的 token
   - `LINE_CHANNEL_SECRET` = 你的 secret
4. 點擊 `Save Changes`

### 4.9 取得 Bot QR Code

1. 回到 LINE Developers
2. 在 `Messaging API` 標籤
3. 找到 `Bot information` 區塊
4. 可以看到 QR Code 和 Bot ID
5. 用 LINE 掃描加入好友

---

## Step 5: 串接測試

### 5.1 測試網頁功能

1. 開啟 `https://your-app.onrender.com`
2. 測試功能：
   - [ ] 地圖正常顯示
   - [ ] 可以點擊景點打卡
   - [ ] GPS 定位正常
   - [ ] 登入/註冊功能（需要 Firebase 設定正確）
   - [ ] 資料有儲存（重新整理後還在）

### 5.2 測試 LINE Bot

1. 加入 Bot 好友
2. 測試指令：
   - 輸入 `幫助` → 應顯示功能說明
   - 輸入 `進度` → 應提示連動帳號
   - 傳送位置 → 應顯示附近景點或打卡成功

### 5.3 測試帳號連動

1. 在網頁登入
2. 點擊「紀錄」標籤
3. 點擊「連動 LINE Bot」
4. 複製連動碼
5. 在 LINE Bot 輸入 `連動 XXXXXXXX`
6. 應顯示連動成功
7. 傳送位置測試打卡
8. 回到網頁確認資料同步

---

## 常見問題

### Q: Render 部署失敗？

**A:** 檢查 Build log：
- 確認 `package.json` 存在
- 確認 `npm install` 沒有錯誤
- 確認 Node 版本 >= 18

### Q: Firebase 連線失敗？

**A:** 檢查環境變數：
- `FIREBASE_PRIVATE_KEY` 要包含完整的 `-----BEGIN...` 和 `-----END...`
- 確認 `\n` 換行符號有保留
- 在 Render 可以用 `Secret Files` 功能上傳整個 JSON

### Q: LINE Bot 沒有回應？

**A:** 檢查：
1. Webhook URL 是否正確（結尾要是 `/webhook`）
2. Verify 是否成功
3. Use webhook 開關是否開啟
4. 檢查 Render logs 有無錯誤

### Q: 網頁登入失敗？

**A:** 檢查：
1. Firebase Authentication 是否啟用
2. `public/app.js` 的 `firebaseConfig` 是否正確填入
3. 在 Firebase Console 加入網域到授權網域清單

### Q: 免費方案限制？

| 服務 | 免費額度 |
|------|----------|
| Render | 每月 750 小時（夠用），閒置 15 分鐘會休眠 |
| Firebase Firestore | 每日 50,000 讀 / 20,000 寫 |
| Firebase Auth | 每月 10,000 次驗證 |
| Firebase Storage | 5GB 儲存 / 每日 1GB 下載 |
| LINE Messaging API | 每月 500 則推播（回覆不限） |
| Google Photos API | 每日 10,000 次請求 |
| Google Docs API | 每日 3,000 次請求 |

---

## Step 5: Google API 設定

> 📖 詳細步驟請參考 [docs/GOOGLE-API-SETUP.md](./docs/GOOGLE-API-SETUP.md)

### 快速步驟

1. **建立 Google Cloud 專案**
   - 前往 [Google Cloud Console](https://console.cloud.google.com/)
   - 建立新專案 `taiwan-explorer`

2. **啟用 API**
   - Photos Library API
   - Google Docs API
   - Google Drive API

3. **設定 OAuth**
   - 設定同意畫面
   - 建立 OAuth 用戶端 ID（網頁應用程式）
   - 重新導向 URI：`https://your-app.onrender.com/auth/google/callback`

4. **更新 Render 環境變數**

   | Key | Value |
   |-----|-------|
   | `GOOGLE_CLIENT_ID` | 用戶端 ID |
   | `GOOGLE_CLIENT_SECRET` | 用戶端密碼 |
   | `GOOGLE_REDIRECT_URI` | `https://your-app.onrender.com/auth/google/callback` |

---

## Step 6: Rich Menu 設定

> 📖 詳細步驟請參考 [docs/RICH-MENU-SETUP.md](./docs/RICH-MENU-SETUP.md)

### 六宮格設計

```
┌─────────┬─────────┬─────────┐
│ 📍 打卡 │ 📊 進度 │ 📷 相簿 │
├─────────┼─────────┼─────────┤
│ 📝 紀錄 │🔗Google │🌐 網頁版│
└─────────┴─────────┴─────────┘
```

### 自動設定

```bash
# 設定環境變數
export LINE_CHANNEL_ACCESS_TOKEN=你的token
export LINE_CHANNEL_SECRET=你的secret
export WEB_URL=https://your-app.onrender.com

# 執行設定腳本
npm run setup:richmenu
```

### 手動設定

1. 登入 [LINE Official Account Manager](https://manager.line.biz/)
2. 選擇帳號 → 聊天室相關 → 圖文選單
3. 建立新選單，上傳 `assets/rich-menu.svg`（需轉換成 PNG）
4. 設定六個區塊的動作

---

## Step 7: 串接測試

### 7.1 測試網頁功能

- [ ] 地圖正常顯示
- [ ] 可以點擊景點打卡
- [ ] GPS 定位正常
- [ ] 登入/註冊功能

### 7.2 測試 LINE Bot

- [ ] Rich Menu 顯示正常
- [ ] 點擊「打卡」→ 提示傳位置
- [ ] 傳送位置 → 發現附近景點
- [ ] 傳送照片 → 詢問心得
- [ ] 輸入心得 → 打卡成功

### 7.3 測試 Google 整合

- [ ] 輸入「連動Google」→ 顯示授權連結
- [ ] 完成授權 → 收到成功訊息
- [ ] 打卡後照片出現在 Google 相簿
- [ ] 打卡後心得寫入 Google 文件

---

## 🎉 完成！

恭喜你完成完整部署！現在你有：

- ✅ 完整的景點收集網頁應用
- ✅ Firebase 雲端資料同步
- ✅ LINE Bot 即時打卡 + Rich Menu
- ✅ GPS 自動偵測附近景點
- ✅ Google 相簿自動存照片
- ✅ Google Docs 自動寫心得
- ✅ 成就系統 + 排行榜

### 後續優化建議

1. **自訂網域**：在 Render 設定 Custom Domain
2. **更多景點**：擴充 `spots.json` 資料
3. **PWA**：加入 Service Worker 支援離線使用
4. **推播通知**：使用 Firebase Cloud Messaging
5. **美化 Rich Menu**：設計更精美的圖片

---

有問題歡迎開 Issue！🙌
