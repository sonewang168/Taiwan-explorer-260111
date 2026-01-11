# 🔗 Google API 設定指南

本指南說明如何設定 Google Photos API 和 Google Docs API，讓打卡照片自動存入 Google 相簿，心得自動寫入 Google 文件。

---

## 📋 目錄

1. [建立 Google Cloud 專案](#1-建立-google-cloud-專案)
2. [啟用 API](#2-啟用-api)
3. [設定 OAuth 同意畫面](#3-設定-oauth-同意畫面)
4. [建立 OAuth 憑證](#4-建立-oauth-憑證)
5. [設定環境變數](#5-設定環境變數)
6. [測試連動](#6-測試連動)

---

## 1. 建立 Google Cloud 專案

1. 前往 [Google Cloud Console](https://console.cloud.google.com/)
2. 點擊頂部的專案選單 → `新增專案`
3. 填寫：
   - **專案名稱**: `taiwan-explorer`
   - **機構**: 保持預設或選擇你的機構
4. 點擊 `建立`
5. 等待建立完成後，確認已切換到新專案

---

## 2. 啟用 API

需要啟用以下 API：

### 2.1 啟用 Google Photos Library API

1. 前往 [Photos Library API](https://console.cloud.google.com/apis/library/photoslibrary.googleapis.com)
2. 確認專案正確
3. 點擊 `啟用`

### 2.2 啟用 Google Docs API

1. 前往 [Docs API](https://console.cloud.google.com/apis/library/docs.googleapis.com)
2. 點擊 `啟用`

### 2.3 啟用 Google Drive API

1. 前往 [Drive API](https://console.cloud.google.com/apis/library/drive.googleapis.com)
2. 點擊 `啟用`

---

## 3. 設定 OAuth 同意畫面

1. 前往 [OAuth 同意畫面](https://console.cloud.google.com/apis/credentials/consent)
2. 選擇使用者類型：
   - 如果是個人使用：選 `外部`
   - 如果有 Google Workspace：可選 `內部`
3. 點擊 `建立`

### 填寫應用程式資訊

| 欄位 | 值 |
|------|-----|
| 應用程式名稱 | `台灣探險圖鑑` |
| 使用者支援電子郵件 | 你的 Email |
| 應用程式標誌 | （可選）上傳 logo |
| 應用程式首頁 | `https://your-app.onrender.com` |
| 應用程式隱私權政策連結 | （可選）|
| 應用程式服務條款連結 | （可選）|
| 開發人員聯絡資訊 | 你的 Email |

4. 點擊 `儲存並繼續`

### 設定範圍（Scopes）

1. 點擊 `新增或移除範圍`
2. 搜尋並勾選：
   - `https://www.googleapis.com/auth/photoslibrary` - 管理相簿
   - `https://www.googleapis.com/auth/photoslibrary.appendonly` - 上傳照片
   - `https://www.googleapis.com/auth/documents` - 管理文件
   - `https://www.googleapis.com/auth/drive.file` - 存取自建檔案
3. 點擊 `更新`
4. 點擊 `儲存並繼續`

### 新增測試使用者

1. 點擊 `ADD USERS`
2. 輸入你自己的 Gmail
3. 點擊 `新增`
4. 點擊 `儲存並繼續`

> ⚠️ **注意**：在「測試」模式下，只有測試使用者才能使用 OAuth。
> 若要開放所有人使用，需要提交驗證申請（需要隱私權政策等）。

---

## 4. 建立 OAuth 憑證

1. 前往 [憑證](https://console.cloud.google.com/apis/credentials)
2. 點擊 `建立憑證` → `OAuth 用戶端 ID`
3. 填寫：

| 欄位 | 值 |
|------|-----|
| 應用程式類型 | `網頁應用程式` |
| 名稱 | `taiwan-explorer-web` |
| 已授權的 JavaScript 來源 | `https://your-app.onrender.com` |
| 已授權的重新導向 URI | `https://your-app.onrender.com/auth/google/callback` |

> 📌 將 `your-app` 替換成你實際的 Render 網址

4. 點擊 `建立`
5. 會顯示 **用戶端 ID** 和 **用戶端密碼**
6. **複製並妥善保存這兩個值！**

---

## 5. 設定環境變數

在 Render Dashboard 新增以下環境變數：

| Key | Value |
|-----|-------|
| `GOOGLE_CLIENT_ID` | 剛才複製的用戶端 ID |
| `GOOGLE_CLIENT_SECRET` | 剛才複製的用戶端密碼 |
| `GOOGLE_REDIRECT_URI` | `https://your-app.onrender.com/auth/google/callback` |

---

## 6. 測試連動

### 方法一：透過 LINE Bot

1. 在 LINE Bot 輸入 `連動Google`
2. 點擊「開始連動」按鈕
3. 登入 Google 帳號
4. 授權存取相簿和文件
5. 看到「連動成功」頁面
6. 回到 LINE 會收到確認訊息

### 方法二：直接測試

1. 開啟網址：
   ```
   https://your-app.onrender.com/auth/google/callback?code=test
   ```
   （這會失敗，但可確認路由有運作）

### 測試打卡流程

1. 傳送位置給 LINE Bot
2. 收到景點提示後，傳送照片
3. 輸入心得（或輸入「跳過」）
4. 打卡成功後：
   - 照片會出現在 Google 相簿的「台灣探險圖鑑」相簿
   - 心得會寫入 Google 文件

---

## ❓ 常見問題

### Q: 出現「存取遭拒」錯誤？

**A:** 確認：
1. 你的 Gmail 有加入測試使用者名單
2. OAuth 範圍設定正確
3. API 都已啟用

### Q: 照片上傳失敗？

**A:** Google Photos API 有限制：
- 每日上傳上限：10,000 張
- 單檔大小上限：200MB
- 確認 `photoslibrary` 範圍已授權

### Q: 文件沒有圖片？

**A:** Google Docs API 插入圖片需要公開 URL。
解決方案：
1. 確認照片已上傳到 Google 相簿
2. 使用相簿的 baseUrl 作為圖片來源

### Q: Token 過期？

**A:** 系統會自動刷新 token。如果持續失敗：
1. 請用戶重新連動 Google
2. 檢查 refresh_token 是否正確儲存

---

## 🔒 安全注意事項

1. **永遠不要將 Client Secret 提交到 Git**
2. 使用環境變數儲存敏感資訊
3. 定期檢查 API 使用量
4. 考慮設定使用量警示

---

## 📊 API 配額

| API | 免費配額 |
|-----|---------|
| Photos Library API | 每日 10,000 次請求 |
| Docs API | 每日 3,000 次請求 |
| Drive API | 每日 10 億次請求 |

對於一般使用來說綽綽有餘！

---

完成以上設定後，你的台灣探險圖鑑就擁有完整的 Google 整合功能了！🎉
