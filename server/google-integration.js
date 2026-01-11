// ==========================================
// Google API 整合 - 相簿 + 文件
// ==========================================

const { google } = require('googleapis');
const stream = require('stream');

class GoogleIntegration {
    constructor(config) {
        this.config = config;
        this.oauth2Client = null;
        this.photosAlbumId = null;
        this.docsFileId = null;
        
        if (config.clientId && config.clientSecret) {
            this.oauth2Client = new google.auth.OAuth2(
                config.clientId,
                config.clientSecret,
                config.redirectUri
            );
        }
    }

    // ==================== OAuth 相關 ====================
    
    // 產生授權 URL
    getAuthUrl(userId) {
        if (!this.oauth2Client) return null;
        
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline',
            prompt: 'consent',
            scope: [
                'https://www.googleapis.com/auth/photoslibrary',
                'https://www.googleapis.com/auth/photoslibrary.appendonly',
                'https://www.googleapis.com/auth/documents',
                'https://www.googleapis.com/auth/drive.file'
            ],
            state: userId // 用於回調時識別用戶
        });
    }

    // 用授權碼換取 tokens
    async getTokensFromCode(code) {
        const { tokens } = await this.oauth2Client.getToken(code);
        return tokens;
    }

    // 設定用戶的 tokens
    setCredentials(tokens) {
        this.oauth2Client.setCredentials(tokens);
    }

    // 刷新 token
    async refreshTokens(refreshToken) {
        this.oauth2Client.setCredentials({ refresh_token: refreshToken });
        const { credentials } = await this.oauth2Client.refreshAccessToken();
        return credentials;
    }

    // ==================== Google 相簿 ====================

    // 建立或取得相簿
    async getOrCreateAlbum(tokens, albumTitle = '🗺️ 台灣探險圖鑑') {
        this.setCredentials(tokens);
        
        // Google Photos API 需要用 REST 直接呼叫
        const accessToken = tokens.access_token;
        
        // 先列出現有相簿
        const listResponse = await fetch('https://photoslibrary.googleapis.com/v1/albums?pageSize=50', {
            headers: { 'Authorization': `Bearer ${accessToken}` }
        });
        const listData = await listResponse.json();
        
        // 找現有相簿
        if (listData.albums) {
            const existing = listData.albums.find(a => a.title === albumTitle);
            if (existing) {
                return existing.id;
            }
        }
        
        // 建立新相簿
        const createResponse = await fetch('https://photoslibrary.googleapis.com/v1/albums', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                album: { title: albumTitle }
            })
        });
        const createData = await createResponse.json();
        
        return createData.id;
    }

    // 上傳照片到相簿
    async uploadPhotoToAlbum(tokens, albumId, photoBuffer, filename, description) {
        this.setCredentials(tokens);
        const accessToken = tokens.access_token;
        
        // Step 1: 上傳照片取得 upload token
        const uploadResponse = await fetch('https://photoslibrary.googleapis.com/v1/uploads', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/octet-stream',
                'X-Goog-Upload-Content-Type': 'image/jpeg',
                'X-Goog-Upload-Protocol': 'raw'
            },
            body: photoBuffer
        });
        const uploadToken = await uploadResponse.text();
        
        // Step 2: 建立媒體項目並加入相簿
        const createResponse = await fetch('https://photoslibrary.googleapis.com/v1/mediaItems:batchCreate', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                albumId: albumId,
                newMediaItems: [{
                    description: description,
                    simpleMediaItem: {
                        fileName: filename,
                        uploadToken: uploadToken
                    }
                }]
            })
        });
        
        const createData = await createResponse.json();
        
        if (createData.newMediaItemResults && createData.newMediaItemResults[0]) {
            return createData.newMediaItemResults[0].mediaItem;
        }
        
        throw new Error('上傳照片失敗');
    }

    // ==================== Google Docs ====================

    // 建立或取得文件
    async getOrCreateDoc(tokens, docTitle = '🗺️ 台灣探險圖鑑 - 旅行紀錄') {
        this.setCredentials(tokens);
        
        const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
        const docs = google.docs({ version: 'v1', auth: this.oauth2Client });
        
        // 搜尋現有文件
        const searchResponse = await drive.files.list({
            q: `name='${docTitle}' and mimeType='application/vnd.google-apps.document' and trashed=false`,
            fields: 'files(id, name)',
            spaces: 'drive'
        });
        
        if (searchResponse.data.files && searchResponse.data.files.length > 0) {
            return searchResponse.data.files[0].id;
        }
        
        // 建立新文件
        const createResponse = await docs.documents.create({
            requestBody: {
                title: docTitle
            }
        });
        
        const docId = createResponse.data.documentId;
        
        // 初始化文件內容
        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: {
                requests: [
                    {
                        insertText: {
                            location: { index: 1 },
                            text: '🗺️ 台灣探險圖鑑 - 旅行紀錄\n\n'
                        }
                    },
                    {
                        updateParagraphStyle: {
                            range: { startIndex: 1, endIndex: 25 },
                            paragraphStyle: {
                                namedStyleType: 'HEADING_1',
                                alignment: 'CENTER'
                            },
                            fields: 'namedStyleType,alignment'
                        }
                    },
                    {
                        insertText: {
                            location: { index: 27 },
                            text: '記錄每一個探險的足跡與回憶 ✨\n\n' +
                                  '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n'
                        }
                    }
                ]
            }
        });
        
        return docId;
    }

    // 新增打卡紀錄到文件
    async appendCheckinToDoc(tokens, docId, checkinData) {
        this.setCredentials(tokens);
        
        const docs = google.docs({ version: 'v1', auth: this.oauth2Client });
        const drive = google.drive({ version: 'v3', auth: this.oauth2Client });
        
        // 取得文件目前長度
        const docResponse = await docs.documents.get({ documentId: docId });
        const endIndex = docResponse.data.body.content.slice(-1)[0].endIndex - 1;
        
        const { spotName, county, note, photoUrl, timestamp } = checkinData;
        const dateStr = new Date(timestamp).toLocaleString('zh-TW', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit'
        });
        
        const requests = [];
        let currentIndex = endIndex;
        
        // 插入標題
        const titleText = `\n📍 ${spotName}\n`;
        requests.push({
            insertText: {
                location: { index: currentIndex },
                text: titleText
            }
        });
        currentIndex += titleText.length;
        
        // 插入資訊
        const infoText = `📅 ${dateStr}\n📌 ${county}\n\n`;
        requests.push({
            insertText: {
                location: { index: currentIndex },
                text: infoText
            }
        });
        currentIndex += infoText.length;
        
        // 插入照片（如果有）
        if (photoUrl) {
            requests.push({
                insertInlineImage: {
                    location: { index: currentIndex },
                    uri: photoUrl,
                    objectSize: {
                        height: { magnitude: 300, unit: 'PT' },
                        width: { magnitude: 400, unit: 'PT' }
                    }
                }
            });
            currentIndex += 1; // 圖片佔一個字元
            
            requests.push({
                insertText: {
                    location: { index: currentIndex },
                    text: '\n\n'
                }
            });
            currentIndex += 2;
        }
        
        // 插入心得
        if (note) {
            const noteText = `💭 ${note}\n\n`;
            requests.push({
                insertText: {
                    location: { index: currentIndex },
                    text: noteText
                }
            });
            currentIndex += noteText.length;
        }
        
        // 插入分隔線
        const divider = '━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n\n';
        requests.push({
            insertText: {
                location: { index: currentIndex },
                text: divider
            }
        });
        
        // 執行更新
        await docs.documents.batchUpdate({
            documentId: docId,
            requestBody: { requests }
        });
        
        return `https://docs.google.com/document/d/${docId}/edit`;
    }

    // 取得文件連結
    getDocUrl(docId) {
        return `https://docs.google.com/document/d/${docId}/edit`;
    }

    // 取得相簿連結
    async getAlbumUrl(tokens, albumId) {
        try {
            this.setCredentials(tokens);
            const accessToken = tokens.access_token;
            
            const response = await fetch(`https://photoslibrary.googleapis.com/v1/albums/${albumId}`, {
                headers: { 'Authorization': `Bearer ${accessToken}` }
            });
            const data = await response.json();
            
            // 確保有回傳值
            return data.productUrl || `https://photos.google.com/album/${albumId}`;
        } catch (error) {
            console.error('getAlbumUrl 錯誤:', error);
            return `https://photos.google.com/album/${albumId}`;
        }
    }
}

module.exports = GoogleIntegration;
