// ==========================================
// 台灣探險圖鑑 - 前端應用程式
// ==========================================

// Firebase 配置（部署時替換）
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    projectId: "YOUR_PROJECT_ID",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// 景點資料（完整版）
const spotsData = {
    "台北市": {
        icon: "🏙️",
        spots: [
            { id: "tp001", name: "台北101", lat: 25.0339, lng: 121.5645, desc: "台灣第一高樓", tags: ["地標", "購物"] },
            { id: "tp002", name: "故宮博物院", lat: 25.1024, lng: 121.5485, desc: "中華文化寶庫", tags: ["博物館", "文化"] },
            { id: "tp003", name: "中正紀念堂", lat: 25.0348, lng: 121.5218, desc: "歷史地標", tags: ["歷史", "地標"] },
            { id: "tp004", name: "士林夜市", lat: 25.0877, lng: 121.5241, desc: "台灣最大夜市", tags: ["夜市", "美食"] },
            { id: "tp005", name: "龍山寺", lat: 25.0372, lng: 121.4999, desc: "三百年古剎", tags: ["寺廟", "歷史"] },
            { id: "tp006", name: "象山步道", lat: 25.0275, lng: 121.5712, desc: "101最佳觀景點", tags: ["步道", "夜景"] },
            { id: "tp007", name: "北投溫泉", lat: 25.1367, lng: 121.5069, desc: "溫泉鄉", tags: ["溫泉", "休閒"] },
            { id: "tp008", name: "陽明山國家公園", lat: 25.1667, lng: 121.5500, desc: "花季賞花", tags: ["國家公園", "自然"] },
            { id: "tp009", name: "貓空纜車", lat: 24.9683, lng: 121.5794, desc: "茶園風光", tags: ["纜車", "茶園"] },
            { id: "tp010", name: "華山文創園區", lat: 25.0439, lng: 121.5294, desc: "文創基地", tags: ["文創", "展覽"] }
        ]
    },
    "新北市": {
        icon: "🌊",
        spots: [
            { id: "np001", name: "九份老街", lat: 25.1089, lng: 121.8443, desc: "山城風情", tags: ["老街", "夜景"] },
            { id: "np002", name: "野柳地質公園", lat: 25.2069, lng: 121.6904, desc: "女王頭奇岩", tags: ["地質", "自然"] },
            { id: "np003", name: "淡水老街", lat: 25.1698, lng: 121.4407, desc: "夕陽美景", tags: ["老街", "夕陽"] },
            { id: "np004", name: "平溪老街", lat: 25.0259, lng: 121.7382, desc: "天燈故鄉", tags: ["老街", "天燈"] },
            { id: "np005", name: "十分瀑布", lat: 25.0467, lng: 121.7778, desc: "台灣尼加拉瓜", tags: ["瀑布", "自然"] },
            { id: "np006", name: "烏來瀑布", lat: 24.8647, lng: 121.5506, desc: "原住民文化", tags: ["瀑布", "溫泉"] },
            { id: "np007", name: "金瓜石黃金博物館", lat: 25.1083, lng: 121.8583, desc: "礦業歷史", tags: ["博物館", "歷史"] },
            { id: "np008", name: "三貂角燈塔", lat: 25.0167, lng: 122.0000, desc: "台灣極東點", tags: ["燈塔", "海景"] },
            { id: "np009", name: "碧潭風景區", lat: 24.9500, lng: 121.5417, desc: "踩船遊湖", tags: ["湖泊", "休閒"] },
            { id: "np010", name: "鶯歌陶瓷老街", lat: 24.9500, lng: 121.3500, desc: "陶瓷之都", tags: ["老街", "陶藝"] }
        ]
    },
    "基隆市": {
        icon: "⚓",
        spots: [
            { id: "kl001", name: "和平島公園", lat: 25.1584, lng: 121.7631, desc: "奇岩地質", tags: ["地質", "海景"] },
            { id: "kl002", name: "基隆廟口夜市", lat: 25.1286, lng: 121.7420, desc: "美食天堂", tags: ["夜市", "美食"] },
            { id: "kl003", name: "正濱漁港彩色屋", lat: 25.1480, lng: 121.7589, desc: "彩虹漁村", tags: ["漁港", "拍照"] },
            { id: "kl004", name: "基隆嶼", lat: 25.1917, lng: 121.7833, desc: "登島探險", tags: ["離島", "自然"] },
            { id: "kl005", name: "望幽谷", lat: 25.1500, lng: 121.8000, desc: "海岸步道", tags: ["步道", "海景"] }
        ]
    },
    "桃園市": {
        icon: "✈️",
        spots: [
            { id: "ty001", name: "大溪老街", lat: 24.8833, lng: 121.2869, desc: "巴洛克建築", tags: ["老街", "古蹟"] },
            { id: "ty002", name: "拉拉山", lat: 24.7167, lng: 121.4333, desc: "神木群", tags: ["森林", "神木"] },
            { id: "ty003", name: "小烏來瀑布", lat: 24.8333, lng: 121.3667, desc: "天空步道", tags: ["瀑布", "步道"] },
            { id: "ty004", name: "角板山", lat: 24.8167, lng: 121.3500, desc: "北橫風景", tags: ["風景區", "賞花"] },
            { id: "ty005", name: "石門水庫", lat: 24.8167, lng: 121.2333, desc: "湖光山色", tags: ["水庫", "自然"] },
            { id: "ty006", name: "Xpark水族館", lat: 25.0167, lng: 121.2167, desc: "都會水族館", tags: ["水族館", "親子"] }
        ]
    },
    "新竹縣市": {
        icon: "🌬️",
        spots: [
            { id: "hc001", name: "內灣老街", lat: 24.7042, lng: 121.1875, desc: "客家風情", tags: ["老街", "客家"] },
            { id: "hc002", name: "新竹城隍廟", lat: 24.8050, lng: 120.9658, desc: "百年古廟", tags: ["寺廟", "美食"] },
            { id: "hc003", name: "司馬庫斯", lat: 24.5833, lng: 121.2500, desc: "上帝的部落", tags: ["部落", "神木"] },
            { id: "hc004", name: "南寮漁港", lat: 24.8417, lng: 120.9167, desc: "17公里海岸線", tags: ["漁港", "自行車"] },
            { id: "hc005", name: "綠世界生態農場", lat: 24.7333, lng: 121.0667, desc: "生態園區", tags: ["生態", "親子"] },
            { id: "hc006", name: "北埔老街", lat: 24.7000, lng: 121.0583, desc: "客家聚落", tags: ["老街", "客家"] }
        ]
    },
    "苗栗縣": {
        icon: "🏔️",
        spots: [
            { id: "ml001", name: "勝興車站", lat: 24.4167, lng: 120.7833, desc: "鐵道文化", tags: ["車站", "鐵道"] },
            { id: "ml002", name: "南庄老街", lat: 24.5972, lng: 120.9931, desc: "客家山城", tags: ["老街", "客家"] },
            { id: "ml003", name: "三義木雕街", lat: 24.3833, lng: 120.7500, desc: "木雕藝術", tags: ["老街", "藝術"] },
            { id: "ml004", name: "通霄神社", lat: 24.4917, lng: 120.6833, desc: "日式遺跡", tags: ["古蹟", "歷史"] },
            { id: "ml005", name: "飛牛牧場", lat: 24.4833, lng: 120.7667, desc: "親子牧場", tags: ["牧場", "親子"] },
            { id: "ml006", name: "龍騰斷橋", lat: 24.4000, lng: 120.7833, desc: "鐵道遺跡", tags: ["古蹟", "鐵道"] }
        ]
    },
    "台中市": {
        icon: "☀️",
        spots: [
            { id: "tc001", name: "高美濕地", lat: 24.3167, lng: 120.5500, desc: "夕陽美景", tags: ["濕地", "夕陽"] },
            { id: "tc002", name: "逢甲夜市", lat: 24.1791, lng: 120.6462, desc: "創意美食", tags: ["夜市", "美食"] },
            { id: "tc003", name: "彩虹眷村", lat: 24.1382, lng: 120.6196, desc: "彩繪藝術", tags: ["藝術", "拍照"] },
            { id: "tc004", name: "宮原眼科", lat: 24.1378, lng: 120.6845, desc: "日式建築冰店", tags: ["美食", "古蹟"] },
            { id: "tc005", name: "武陵農場", lat: 24.3500, lng: 121.3000, desc: "櫻花勝地", tags: ["農場", "賞花"] },
            { id: "tc006", name: "審計新村", lat: 24.1417, lng: 120.6583, desc: "文創聚落", tags: ["文創", "拍照"] },
            { id: "tc007", name: "台中國家歌劇院", lat: 24.1625, lng: 120.6403, desc: "建築藝術", tags: ["建築", "藝文"] },
            { id: "tc008", name: "大坑步道", lat: 24.1833, lng: 120.7333, desc: "登山健行", tags: ["步道", "自然"] },
            { id: "tc009", name: "梧棲漁港", lat: 24.2667, lng: 120.5167, desc: "海鮮美食", tags: ["漁港", "美食"] },
            { id: "tc010", name: "谷關溫泉", lat: 24.2000, lng: 121.0000, desc: "山中溫泉", tags: ["溫泉", "休閒"] }
        ]
    },
    "彰化縣": {
        icon: "🙏",
        spots: [
            { id: "ch001", name: "鹿港老街", lat: 24.0544, lng: 120.4347, desc: "一府二鹿", tags: ["老街", "古蹟"] },
            { id: "ch002", name: "八卦山大佛", lat: 24.0833, lng: 120.5417, desc: "地標大佛", tags: ["寺廟", "地標"] },
            { id: "ch003", name: "扇形車庫", lat: 24.0833, lng: 120.5333, desc: "鐵道遺產", tags: ["鐵道", "歷史"] },
            { id: "ch004", name: "田尾公路花園", lat: 23.8917, lng: 120.5250, desc: "花卉天堂", tags: ["花卉", "自行車"] },
            { id: "ch005", name: "王功漁港", lat: 23.9667, lng: 120.3167, desc: "蚵仔故鄉", tags: ["漁港", "美食"] }
        ]
    },
    "南投縣": {
        icon: "🌲",
        spots: [
            { id: "nt001", name: "日月潭", lat: 23.8583, lng: 120.9167, desc: "台灣之心", tags: ["湖泊", "自行車"] },
            { id: "nt002", name: "清境農場", lat: 24.0583, lng: 121.1667, desc: "高山草原", tags: ["農場", "高山"] },
            { id: "nt003", name: "溪頭森林", lat: 23.6750, lng: 120.7917, desc: "森林浴場", tags: ["森林", "自然"] },
            { id: "nt004", name: "集集車站", lat: 23.8333, lng: 120.7833, desc: "小火車站", tags: ["車站", "鐵道"] },
            { id: "nt005", name: "合歡山", lat: 24.1500, lng: 121.2750, desc: "雪季賞雪", tags: ["高山", "賞雪"] },
            { id: "nt006", name: "忘憂森林", lat: 23.6333, lng: 120.8000, desc: "夢幻秘境", tags: ["森林", "秘境"] },
            { id: "nt007", name: "中台禪寺", lat: 24.0167, lng: 120.9333, desc: "佛教聖地", tags: ["寺廟", "建築"] },
            { id: "nt008", name: "九族文化村", lat: 23.8667, lng: 120.9333, desc: "原民文化", tags: ["主題樂園", "文化"] }
        ]
    },
    "雲林縣": {
        icon: "🎭",
        spots: [
            { id: "yl001", name: "劍湖山", lat: 23.6333, lng: 120.5833, desc: "主題樂園", tags: ["主題樂園", "親子"] },
            { id: "yl002", name: "北港朝天宮", lat: 23.5667, lng: 120.3000, desc: "媽祖信仰中心", tags: ["寺廟", "宗教"] },
            { id: "yl003", name: "虎尾糖廠", lat: 23.7083, lng: 120.4333, desc: "糖業歷史", tags: ["歷史", "文創"] },
            { id: "yl004", name: "西螺大橋", lat: 23.7917, lng: 120.4667, desc: "歷史橋梁", tags: ["地標", "歷史"] },
            { id: "yl005", name: "草嶺", lat: 23.5833, lng: 120.7000, desc: "山區風光", tags: ["自然", "步道"] }
        ]
    },
    "嘉義縣市": {
        icon: "🌄",
        spots: [
            { id: "cy001", name: "阿里山", lat: 23.5103, lng: 120.8028, desc: "日出雲海", tags: ["高山", "日出"] },
            { id: "cy002", name: "奮起湖", lat: 23.5083, lng: 120.6917, desc: "便當傳奇", tags: ["車站", "美食"] },
            { id: "cy003", name: "檜意森活村", lat: 23.4833, lng: 120.4500, desc: "日式建築群", tags: ["古蹟", "文創"] },
            { id: "cy004", name: "故宮南院", lat: 23.4667, lng: 120.2917, desc: "亞洲藝術", tags: ["博物館", "藝術"] },
            { id: "cy005", name: "嘉義文化路夜市", lat: 23.4833, lng: 120.4500, desc: "雞肉飯故鄉", tags: ["夜市", "美食"] },
            { id: "cy006", name: "達娜伊谷", lat: 23.4167, lng: 120.6500, desc: "鄒族部落", tags: ["部落", "自然"] }
        ]
    },
    "台南市": {
        icon: "🏛️",
        spots: [
            { id: "tn001", name: "赤崁樓", lat: 22.9976, lng: 120.2023, desc: "古蹟巡禮", tags: ["古蹟", "歷史"] },
            { id: "tn002", name: "安平古堡", lat: 23.0017, lng: 120.1603, desc: "台灣第一城", tags: ["古蹟", "歷史"] },
            { id: "tn003", name: "神農街", lat: 22.9975, lng: 120.1958, desc: "老屋新生", tags: ["老街", "文創"] },
            { id: "tn004", name: "奇美博物館", lat: 22.9361, lng: 120.2264, desc: "藝術殿堂", tags: ["博物館", "藝術"] },
            { id: "tn005", name: "林百貨", lat: 22.9914, lng: 120.1997, desc: "日治百貨", tags: ["古蹟", "購物"] },
            { id: "tn006", name: "井仔腳鹽田", lat: 23.1500, lng: 120.0833, desc: "夕陽鹽田", tags: ["鹽田", "夕陽"] },
            { id: "tn007", name: "安平樹屋", lat: 23.0000, lng: 120.1583, desc: "榕樹奇觀", tags: ["古蹟", "自然"] },
            { id: "tn008", name: "花園夜市", lat: 23.0167, lng: 120.2083, desc: "台南夜市", tags: ["夜市", "美食"] },
            { id: "tn009", name: "四草綠色隧道", lat: 23.0333, lng: 120.1333, desc: "台版亞馬遜", tags: ["自然", "生態"] },
            { id: "tn010", name: "關子嶺溫泉", lat: 23.3333, lng: 120.5000, desc: "泥漿溫泉", tags: ["溫泉", "休閒"] }
        ]
    },
    "高雄市": {
        icon: "🌴",
        spots: [
            { id: "ks001", name: "駁二藝術特區", lat: 22.6203, lng: 120.2817, desc: "文創基地", tags: ["文創", "藝術"] },
            { id: "ks002", name: "旗津海岸", lat: 22.6000, lng: 120.2667, desc: "渡輪風情", tags: ["海灘", "美食"] },
            { id: "ks003", name: "蓮池潭", lat: 22.6833, lng: 120.2917, desc: "龍虎塔", tags: ["寺廟", "地標"] },
            { id: "ks004", name: "西子灣", lat: 22.6250, lng: 120.2583, desc: "夕陽美景", tags: ["夕陽", "海景"] },
            { id: "ks005", name: "佛光山", lat: 22.7500, lng: 120.4417, desc: "佛教聖地", tags: ["寺廟", "宗教"] },
            { id: "ks006", name: "美濃客家村", lat: 22.8917, lng: 120.5417, desc: "客家文化", tags: ["客家", "文化"] },
            { id: "ks007", name: "愛河", lat: 22.6333, lng: 120.2833, desc: "河岸風光", tags: ["河岸", "夜景"] },
            { id: "ks008", name: "六合夜市", lat: 22.6333, lng: 120.2917, desc: "觀光夜市", tags: ["夜市", "美食"] },
            { id: "ks009", name: "美麗島站", lat: 22.6317, lng: 120.2867, desc: "光之穹頂", tags: ["建築", "藝術"] },
            { id: "ks010", name: "茂林國家風景區", lat: 22.8833, lng: 120.6667, desc: "紫蝶幽谷", tags: ["自然", "生態"] }
        ]
    },
    "屏東縣": {
        icon: "🏝️",
        spots: [
            { id: "pt001", name: "墾丁國家公園", lat: 21.9500, lng: 120.7833, desc: "國境之南", tags: ["國家公園", "海灘"] },
            { id: "pt002", name: "鵝鑾鼻燈塔", lat: 21.9000, lng: 120.8500, desc: "台灣最南點", tags: ["燈塔", "地標"] },
            { id: "pt003", name: "恆春老街", lat: 22.0000, lng: 120.7500, desc: "海角七號", tags: ["老街", "電影"] },
            { id: "pt004", name: "小琉球", lat: 22.3333, lng: 120.3667, desc: "珊瑚島嶼", tags: ["離島", "潛水"] },
            { id: "pt005", name: "霧台部落", lat: 22.7500, lng: 120.7333, desc: "魯凱文化", tags: ["部落", "文化"] },
            { id: "pt006", name: "海生館", lat: 22.0500, lng: 120.7000, desc: "海洋世界", tags: ["水族館", "親子"] },
            { id: "pt007", name: "南灣", lat: 21.9583, lng: 120.7750, desc: "戲水天堂", tags: ["海灘", "水上活動"] },
            { id: "pt008", name: "龍磐公園", lat: 21.9167, lng: 120.8583, desc: "草原海景", tags: ["草原", "日出"] }
        ]
    },
    "宜蘭縣": {
        icon: "🌾",
        spots: [
            { id: "yl001", name: "礁溪溫泉", lat: 24.8333, lng: 121.7667, desc: "溫泉鄉", tags: ["溫泉", "休閒"] },
            { id: "yl002", name: "羅東夜市", lat: 24.6833, lng: 121.7667, desc: "在地美食", tags: ["夜市", "美食"] },
            { id: "yl003", name: "太平山", lat: 24.5167, lng: 121.5167, desc: "森林鐵道", tags: ["森林", "鐵道"] },
            { id: "yl004", name: "蘭陽博物館", lat: 24.8667, lng: 121.8333, desc: "建築美學", tags: ["博物館", "建築"] },
            { id: "yl005", name: "龜山島", lat: 24.8500, lng: 121.9500, desc: "神秘島嶼", tags: ["離島", "賞鯨"] },
            { id: "yl006", name: "幾米廣場", lat: 24.7583, lng: 121.7583, desc: "繪本世界", tags: ["藝術", "拍照"] },
            { id: "yl007", name: "冬山河親水公園", lat: 24.6500, lng: 121.7833, desc: "童玩節", tags: ["親水", "親子"] },
            { id: "yl008", name: "明池", lat: 24.6500, lng: 121.4667, desc: "森林秘境", tags: ["森林", "湖泊"] }
        ]
    },
    "花蓮縣": {
        icon: "⛰️",
        spots: [
            { id: "hl001", name: "太魯閣", lat: 24.1667, lng: 121.5000, desc: "峽谷地形", tags: ["國家公園", "峽谷"] },
            { id: "hl002", name: "七星潭", lat: 24.0333, lng: 121.6333, desc: "礫石海灘", tags: ["海灘", "日出"] },
            { id: "hl003", name: "清水斷崖", lat: 24.2333, lng: 121.6833, desc: "蘇花公路", tags: ["斷崖", "海景"] },
            { id: "hl004", name: "鯉魚潭", lat: 23.9333, lng: 121.5167, desc: "湖光山色", tags: ["湖泊", "自行車"] },
            { id: "hl005", name: "六十石山", lat: 23.3000, lng: 121.2167, desc: "金針花海", tags: ["花海", "季節"] },
            { id: "hl006", name: "瑞穗溫泉", lat: 23.5000, lng: 121.3667, desc: "黃金湯", tags: ["溫泉", "休閒"] },
            { id: "hl007", name: "石梯坪", lat: 23.4833, lng: 121.5167, desc: "海蝕地形", tags: ["地質", "海景"] },
            { id: "hl008", name: "慕谷慕魚", lat: 24.0167, lng: 121.4333, desc: "溪谷秘境", tags: ["溪谷", "秘境"] }
        ]
    },
    "台東縣": {
        icon: "🎈",
        spots: [
            { id: "tt001", name: "伯朗大道", lat: 23.0917, lng: 121.1917, desc: "金城武樹", tags: ["稻田", "自行車"] },
            { id: "tt002", name: "三仙台", lat: 23.1167, lng: 121.4167, desc: "八拱橋", tags: ["海岸", "日出"] },
            { id: "tt003", name: "知本溫泉", lat: 22.7000, lng: 121.0167, desc: "泡湯勝地", tags: ["溫泉", "休閒"] },
            { id: "tt004", name: "綠島", lat: 22.6667, lng: 121.4833, desc: "潛水天堂", tags: ["離島", "潛水"] },
            { id: "tt005", name: "蘭嶼", lat: 22.0500, lng: 121.5500, desc: "飛魚文化", tags: ["離島", "原民"] },
            { id: "tt006", name: "鹿野高台", lat: 22.9167, lng: 121.1167, desc: "熱氣球", tags: ["熱氣球", "草原"] },
            { id: "tt007", name: "多良車站", lat: 22.4500, lng: 120.9667, desc: "最美車站", tags: ["車站", "海景"] },
            { id: "tt008", name: "池上", lat: 23.1167, lng: 121.2167, desc: "池上便當", tags: ["稻田", "美食"] }
        ]
    },
    "澎湖縣": {
        icon: "🐚",
        spots: [
            { id: "ph001", name: "雙心石滬", lat: 23.5000, lng: 119.5000, desc: "浪漫地標", tags: ["地標", "拍照"] },
            { id: "ph002", name: "奎壁山摩西分海", lat: 23.5833, lng: 119.6167, desc: "潮汐奇觀", tags: ["奇觀", "海岸"] },
            { id: "ph003", name: "天后宮", lat: 23.5667, lng: 119.5667, desc: "最早媽祖廟", tags: ["寺廟", "歷史"] },
            { id: "ph004", name: "七美島", lat: 23.2167, lng: 119.4333, desc: "望安七美", tags: ["離島", "自然"] },
            { id: "ph005", name: "吉貝島", lat: 23.7333, lng: 119.6000, desc: "沙尾海灘", tags: ["離島", "海灘"] },
            { id: "ph006", name: "藍洞", lat: 23.5833, lng: 119.4500, desc: "海蝕洞穴", tags: ["秘境", "潛水"] }
        ]
    },
    "金門縣": {
        icon: "🏰",
        spots: [
            { id: "km001", name: "莒光樓", lat: 24.4333, lng: 118.3167, desc: "戰地印記", tags: ["地標", "歷史"] },
            { id: "km002", name: "翟山坑道", lat: 24.4167, lng: 118.3000, desc: "鬼斧神工", tags: ["坑道", "戰地"] },
            { id: "km003", name: "水頭聚落", lat: 24.4167, lng: 118.3333, desc: "閩式建築", tags: ["古厝", "建築"] },
            { id: "km004", name: "金門高粱", lat: 24.4500, lng: 118.3667, desc: "酒廠參觀", tags: ["酒廠", "特產"] },
            { id: "km005", name: "北山古洋樓", lat: 24.4833, lng: 118.3833, desc: "彈孔遺跡", tags: ["歷史", "戰地"] }
        ]
    },
    "馬祖": {
        icon: "🌙",
        spots: [
            { id: "mz001", name: "北海坑道", lat: 26.1500, lng: 119.9333, desc: "藍眼淚", tags: ["坑道", "藍眼淚"] },
            { id: "mz002", name: "芹壁聚落", lat: 26.2333, lng: 120.0000, desc: "石頭屋", tags: ["聚落", "建築"] },
            { id: "mz003", name: "東引燈塔", lat: 26.3667, lng: 120.5000, desc: "國之北疆", tags: ["燈塔", "地標"] },
            { id: "mz004", name: "大坵島", lat: 26.2000, lng: 119.9833, desc: "梅花鹿島", tags: ["離島", "生態"] }
        ]
    }
};

// 成就定義
const achievements = [
    { id: "first", name: "初心者", desc: "收集第一個景點", icon: "🌱", condition: (c) => c >= 1 },
    { id: "ten", name: "探索者", desc: "收集10個景點", icon: "🧭", condition: (c) => c >= 10 },
    { id: "thirty", name: "旅行家", desc: "收集30個景點", icon: "🎒", condition: (c) => c >= 30 },
    { id: "fifty", name: "冒險王", desc: "收集50個景點", icon: "👑", condition: (c) => c >= 50 },
    { id: "hundred", name: "台灣通", desc: "收集100個景點", icon: "🏆", condition: (c) => c >= 100 },
    { id: "all", name: "完全制霸", desc: "收集所有景點", icon: "🌟", condition: (c, d, t) => c >= t },
    { id: "taipei", name: "首都圈達人", desc: "收集台北市所有景點", icon: "🏙️", condition: (c, d) => isCountyComplete("台北市", d) },
    { id: "kaohsiung", name: "南台灣之光", desc: "收集高雄市所有景點", icon: "🌴", condition: (c, d) => isCountyComplete("高雄市", d) },
    { id: "tainan", name: "府城探險家", desc: "收集台南市所有景點", icon: "🏛️", condition: (c, d) => isCountyComplete("台南市", d) },
    { id: "island", name: "離島探險家", desc: "收集任一離島景點", icon: "🏝️", condition: (c, d) => hasIslandSpot(d) },
    { id: "east", name: "後山秘境", desc: "收集花蓮或台東任10個景點", icon: "⛰️", condition: (c, d) => getEastCount(d) >= 10 },
    { id: "hotspring", name: "溫泉達人", desc: "收集5個溫泉景點", icon: "♨️", condition: (c, d) => getTagCount(d, "溫泉") >= 5 },
    { id: "temple", name: "廟宇巡禮", desc: "收集10個寺廟景點", icon: "🙏", condition: (c, d) => getTagCount(d, "寺廟") >= 10 },
    { id: "nightmarket", name: "夜市吃貨", desc: "收集10個夜市景點", icon: "🍜", condition: (c, d) => getTagCount(d, "夜市") >= 10 },
    { id: "oldstreet", name: "老街漫步", desc: "收集10個老街景點", icon: "🏘️", condition: (c, d) => getTagCount(d, "老街") >= 10 },
    { id: "photo", name: "攝影師", desc: "上傳10張打卡照片", icon: "📷", condition: (c, d, t, p) => p >= 10 }
];

// 應用狀態
let app = {
    user: null,
    collectedSpots: [],
    spotPhotos: {},
    spotNotes: {},
    logs: [],
    unlockedAchievements: [],
    markers: {},
    map: null,
    userMarker: null,
    shareMap: null,
    currentCheckinSpot: null,
    currentFilter: 'all',
    authMode: 'login',
    isOnline: navigator.onLine
};

// 初始化 Firebase（如果配置存在）
let db, auth, storage;
function initFirebase() {
    if (firebaseConfig.apiKey !== "YOUR_API_KEY") {
        firebase.initializeApp(firebaseConfig);
        db = firebase.firestore();
        auth = firebase.auth();
        storage = firebase.storage();
        
        // 監聽登入狀態
        auth.onAuthStateChanged(handleAuthStateChange);
        return true;
    }
    return false;
}

// 處理登入狀態變化
function handleAuthStateChange(user) {
    app.user = user;
    updateAuthUI();
    
    if (user) {
        loadUserData();
    } else {
        loadLocalData();
    }
}

// 更新登入 UI
function updateAuthUI() {
    const authBtn = document.getElementById('auth-btn');
    const userInfo = document.getElementById('user-info');
    
    if (app.user) {
        authBtn.style.display = 'none';
        userInfo.style.display = 'flex';
        document.getElementById('user-name').textContent = app.user.displayName || app.user.email.split('@')[0];
        if (app.user.photoURL) {
            document.getElementById('user-avatar').innerHTML = `<img src="${app.user.photoURL}" style="width:100%;height:100%;border-radius:50%;">`;
        }
    } else {
        authBtn.style.display = 'block';
        userInfo.style.display = 'none';
    }
}

// 從 Firebase 載入用戶資料
async function loadUserData() {
    if (!db || !app.user) return;
    
    try {
        const doc = await db.collection('users').doc(app.user.uid).get();
        if (doc.exists) {
            const data = doc.data();
            app.collectedSpots = data.collectedSpots || [];
            app.spotPhotos = data.spotPhotos || {};
            app.spotNotes = data.spotNotes || {};
            app.logs = data.logs || [];
            app.unlockedAchievements = data.unlockedAchievements || [];
        }
        updateAll();
    } catch (error) {
        console.error('載入資料失敗:', error);
        loadLocalData();
    }
}

// 從本地儲存載入資料
function loadLocalData() {
    app.collectedSpots = JSON.parse(localStorage.getItem('tw_collected') || '[]');
    app.spotPhotos = JSON.parse(localStorage.getItem('tw_photos') || '{}');
    app.spotNotes = JSON.parse(localStorage.getItem('tw_notes') || '{}');
    app.logs = JSON.parse(localStorage.getItem('tw_logs') || '[]');
    app.unlockedAchievements = JSON.parse(localStorage.getItem('tw_achievements') || '[]');
    updateAll();
}

// 儲存資料
async function saveData() {
    // 本地儲存
    localStorage.setItem('tw_collected', JSON.stringify(app.collectedSpots));
    localStorage.setItem('tw_photos', JSON.stringify(app.spotPhotos));
    localStorage.setItem('tw_notes', JSON.stringify(app.spotNotes));
    localStorage.setItem('tw_logs', JSON.stringify(app.logs));
    localStorage.setItem('tw_achievements', JSON.stringify(app.unlockedAchievements));
    
    // Firebase 儲存
    if (db && app.user) {
        try {
            await db.collection('users').doc(app.user.uid).set({
                collectedSpots: app.collectedSpots,
                spotPhotos: app.spotPhotos,
                spotNotes: app.spotNotes,
                logs: app.logs,
                unlockedAchievements: app.unlockedAchievements,
                displayName: app.user.displayName || app.user.email.split('@')[0],
                lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
            }, { merge: true });
        } catch (error) {
            console.error('儲存到 Firebase 失敗:', error);
        }
    }
}

// ==================== 地圖相關 ====================

function initMap() {
    app.map = L.map('map').setView([23.7, 120.9], 7);
    
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; OSM &copy; CARTO',
        maxZoom: 19
    }).addTo(app.map);

    // 添加所有景點標記
    Object.entries(spotsData).forEach(([county, data]) => {
        data.spots.forEach(spot => {
            addMarker(county, spot);
        });
    });
}

function addMarker(county, spot) {
    const spotId = `${county}-${spot.id}`;
    const isCollected = app.collectedSpots.includes(spotId);
    const hasPhoto = app.spotPhotos[spotId];
    
    const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background: ${isCollected ? '#27ae60' : '#e74c3c'};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid ${isCollected ? '#f4d03f' : '#fff'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            position: relative;
        ">${isCollected ? '✓' : '📍'}
        ${hasPhoto ? '<span style="position:absolute;top:-5px;right:-5px;font-size:10px;">📷</span>' : ''}
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });

    const marker = L.marker([spot.lat, spot.lng], { icon })
        .addTo(app.map);
    
    marker.on('click', () => showSpotPopup(county, spot, marker));
    
    marker.spotId = spotId;
    marker.county = county;
    marker.spotData = spot;
    app.markers[spotId] = marker;
}

function showSpotPopup(county, spot, marker) {
    const spotId = `${county}-${spot.id}`;
    const isCollected = app.collectedSpots.includes(spotId);
    const photoUrl = app.spotPhotos[spotId];
    
    let photoHtml = '';
    if (photoUrl) {
        photoHtml = `<img src="${photoUrl}" class="popup-photo" alt="${spot.name}">`;
    }
    
    marker.bindPopup(`
        <div class="popup-content">
            ${photoHtml}
            <h3>${spot.name}</h3>
            <p>${spot.desc}</p>
            <p style="font-size: 0.7rem; color: #7f8c8d;">${county} · ${spot.tags.join(' · ')}</p>
            <button class="popup-btn ${isCollected ? 'collected' : ''}" 
                onclick="openCheckinModal('${county}', '${spot.id}')">
                ${isCollected ? '✓ 已收集' : '🎯 打卡'}
            </button>
            ${isCollected ? `<button class="popup-btn secondary" onclick="uncollectSpot('${county}', '${spot.id}')">取消收集</button>` : ''}
        </div>
    `).openPopup();
}

function updateMarker(spotId) {
    const marker = app.markers[spotId];
    if (!marker) return;
    
    const isCollected = app.collectedSpots.includes(spotId);
    const hasPhoto = app.spotPhotos[spotId];
    
    const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            background: ${isCollected ? '#27ae60' : '#e74c3c'};
            width: 28px;
            height: 28px;
            border-radius: 50%;
            border: 3px solid ${isCollected ? '#f4d03f' : '#fff'};
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 12px;
            box-shadow: 0 3px 10px rgba(0,0,0,0.3);
            position: relative;
        ">${isCollected ? '✓' : '📍'}
        ${hasPhoto ? '<span style="position:absolute;top:-5px;right:-5px;font-size:10px;">📷</span>' : ''}
        </div>`,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
    });
    
    marker.setIcon(icon);
}

// ==================== 打卡相關 ====================

function openCheckinModal(county, spotId) {
    const spot = spotsData[county].spots.find(s => s.id === spotId);
    if (!spot) return;
    
    app.currentCheckinSpot = { county, spotId: `${county}-${spotId}`, spot };
    document.getElementById('checkin-spot-name').textContent = `${spot.name} - ${county}`;
    document.getElementById('photo-preview').style.display = 'none';
    document.getElementById('photo-input').value = '';
    document.getElementById('checkin-note').value = app.spotNotes[app.currentCheckinSpot.spotId] || '';
    document.getElementById('photo-upload').classList.remove('has-photo');
    
    showModal('checkin-modal');
}

function handlePhotoSelect(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
        document.getElementById('photo-preview').src = e.target.result;
        document.getElementById('photo-preview').style.display = 'block';
        document.getElementById('photo-upload').classList.add('has-photo');
    };
    reader.readAsDataURL(file);
}

async function submitCheckin() {
    if (!app.currentCheckinSpot) return;
    
    const spotId = app.currentCheckinSpot.spotId;
    const note = document.getElementById('checkin-note').value;
    const photoInput = document.getElementById('photo-input');
    const photoFile = photoInput.files[0];
    
    // 儲存心得
    if (note) {
        app.spotNotes[spotId] = note;
    }
    
    // 上傳照片
    if (photoFile && storage && app.user) {
        try {
            const ref = storage.ref(`photos/${app.user.uid}/${spotId}_${Date.now()}.jpg`);
            await ref.put(photoFile);
            const url = await ref.getDownloadURL();
            app.spotPhotos[spotId] = url;
        } catch (error) {
            console.error('照片上傳失敗:', error);
            // 本地儲存 base64
            app.spotPhotos[spotId] = document.getElementById('photo-preview').src;
        }
    } else if (photoFile) {
        // 沒有 Firebase，使用本地 base64
        app.spotPhotos[spotId] = document.getElementById('photo-preview').src;
    }
    
    // 添加到收集
    if (!app.collectedSpots.includes(spotId)) {
        app.collectedSpots.push(spotId);
        
        // 添加打卡紀錄
        app.logs.unshift({
            spotId,
            county: app.currentCheckinSpot.county,
            name: app.currentCheckinSpot.spot.name,
            time: new Date().toISOString(),
            photo: app.spotPhotos[spotId] || null,
            note: note || null
        });
        
        showNotification(`🎉 成功收集「${app.currentCheckinSpot.spot.name}」！`);
        checkAchievements();
    } else {
        showNotification(`📝 已更新「${app.currentCheckinSpot.spot.name}」`);
    }
    
    closeModal('checkin-modal');
    saveData();
    updateAll();
}

function uncollectSpot(county, spotId) {
    const fullSpotId = `${county}-${spotId}`;
    app.collectedSpots = app.collectedSpots.filter(id => id !== fullSpotId);
    delete app.spotPhotos[fullSpotId];
    delete app.spotNotes[fullSpotId];
    app.logs = app.logs.filter(log => log.spotId !== fullSpotId);
    
    saveData();
    updateAll();
    app.map.closePopup();
    showNotification('已取消收集');
}

// ==================== 成就相關 ====================

function checkAchievements() {
    const count = app.collectedSpots.length;
    const total = getTotalSpots();
    const photoCount = Object.keys(app.spotPhotos).length;
    
    achievements.forEach(achievement => {
        if (!app.unlockedAchievements.includes(achievement.id) && 
            achievement.condition(count, app.collectedSpots, total, photoCount)) {
            app.unlockedAchievements.push(achievement.id);
            showAchievementPopup(achievement);
        }
    });
    
    saveData();
}

function showAchievementPopup(achievement) {
    showNotification(`🏆 成就解鎖：${achievement.name}！`);
}

// 輔助函數
function isCountyComplete(county, collected) {
    const spots = spotsData[county]?.spots || [];
    return spots.every(spot => collected.includes(`${county}-${spot.id}`));
}

function hasIslandSpot(collected) {
    const islands = ["澎湖縣", "金門縣", "馬祖", "小琉球", "綠島", "蘭嶼", "龜山島"];
    return collected.some(id => islands.some(island => id.includes(island)));
}

function getEastCount(collected) {
    return collected.filter(id => id.startsWith("花蓮縣") || id.startsWith("台東縣")).length;
}

function getTagCount(collected, tag) {
    let count = 0;
    collected.forEach(spotId => {
        const [county, id] = spotId.split('-');
        const spot = spotsData[county]?.spots.find(s => s.id === id);
        if (spot?.tags.includes(tag)) count++;
    });
    return count;
}

function getTotalSpots() {
    return Object.values(spotsData).reduce((sum, county) => sum + county.spots.length, 0);
}

// ==================== UI 更新 ====================

function updateAll() {
    updateStats();
    renderSpotsList();
    renderAchievements();
    renderLogs();
    renderLeaderboard();
    Object.keys(app.markers).forEach(updateMarker);
}

function updateStats() {
    const total = getTotalSpots();
    document.getElementById('collected-count').textContent = app.collectedSpots.length;
    document.getElementById('total-count').textContent = total;
    document.getElementById('achievement-count').textContent = app.unlockedAchievements.length;
}

function renderSpotsList() {
    const panel = document.getElementById('spots-list');
    const searchTerm = document.getElementById('search-input').value.toLowerCase();
    panel.innerHTML = '';

    Object.entries(spotsData).forEach(([county, data]) => {
        let filteredSpots = data.spots;
        
        // 搜尋過濾
        if (searchTerm) {
            filteredSpots = data.spots.filter(spot => 
                spot.name.includes(searchTerm) || 
                spot.desc.includes(searchTerm) ||
                spot.tags.some(tag => tag.includes(searchTerm))
            );
            if (filteredSpots.length === 0) return;
        }
        
        const collected = filteredSpots.filter(spot => 
            app.collectedSpots.includes(`${county}-${spot.id}`)
        ).length;
        const total = filteredSpots.length;
        const percentage = Math.round((collected / total) * 100);
        const isComplete = collected === total && total > 0;

        const card = document.createElement('div');
        card.className = `county-card ${isComplete ? 'complete' : ''}`;
        card.innerHTML = `
            <div class="county-header">
                <span class="county-name">${data.icon} ${county}</span>
                <div class="county-progress">
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${percentage}%"></div>
                    </div>
                    <span class="progress-text">${collected}/${total}</span>
                </div>
            </div>
            <div class="county-spots">
                ${filteredSpots.map(spot => {
                    const spotId = `${county}-${spot.id}`;
                    const isCollected = app.collectedSpots.includes(spotId);
                    const hasPhoto = app.spotPhotos[spotId];
                    return `
                        <div class="spot-item ${isCollected ? 'collected' : ''} ${hasPhoto ? 'has-photo' : ''}" 
                             onclick="flyToSpot('${spotId}')">
                            <span class="spot-name">${spot.name}</span>
                            <span class="spot-status">${hasPhoto ? '📷' : (isCollected ? '✅' : '⭕')}</span>
                        </div>
                    `;
                }).join('')}
            </div>
        `;

        card.querySelector('.county-header').addEventListener('click', () => {
            card.classList.toggle('expanded');
        });

        panel.appendChild(card);
    });
}

function renderAchievements() {
    const panel = document.getElementById('achievements-panel');
    panel.innerHTML = achievements.map(achievement => {
        const isUnlocked = app.unlockedAchievements.includes(achievement.id);
        return `
            <div class="achievement-card ${isUnlocked ? 'unlocked' : 'locked'}">
                <div class="achievement-icon">${achievement.icon}</div>
                <div class="achievement-info">
                    <h4>${achievement.name}</h4>
                    <p>${achievement.desc}</p>
                </div>
            </div>
        `;
    }).join('');
}

function renderLogs() {
    const list = document.getElementById('logs-list');
    const empty = document.getElementById('logs-empty');
    
    if (app.logs.length === 0) {
        empty.style.display = 'block';
        list.innerHTML = '';
        return;
    }

    empty.style.display = 'none';
    list.innerHTML = app.logs.slice(0, 50).map(log => `
        <div class="log-item" onclick="flyToSpot('${log.spotId}')">
            ${log.photo ? `<img src="${log.photo}" class="log-photo" alt="${log.name}">` : ''}
            <div class="log-info">
                <h4>${log.name}</h4>
                <p>${log.county} · ${new Date(log.time).toLocaleString('zh-TW')}</p>
                ${log.note ? `<p style="margin-top:0.25rem;font-style:italic;">"${log.note}"</p>` : ''}
            </div>
        </div>
    `).join('');
}

async function renderLeaderboard() {
    const list = document.getElementById('rank-list');
    const empty = document.getElementById('rank-empty');
    
    if (!db) {
        empty.style.display = 'block';
        list.innerHTML = '';
        return;
    }
    
    try {
        const snapshot = await db.collection('users')
            .orderBy('collectedSpots', 'desc')
            .limit(20)
            .get();
        
        if (snapshot.empty) {
            empty.style.display = 'block';
            list.innerHTML = '';
            return;
        }
        
        empty.style.display = 'none';
        let html = '';
        let rank = 1;
        
        snapshot.forEach(doc => {
            const data = doc.data();
            const count = data.collectedSpots?.length || 0;
            const rankClass = rank === 1 ? 'gold' : (rank === 2 ? 'silver' : (rank === 3 ? 'bronze' : ''));
            
            html += `
                <div class="leaderboard-item">
                    <div class="leaderboard-rank ${rankClass}">${rank}</div>
                    <div class="leaderboard-avatar">👤</div>
                    <div class="leaderboard-info">
                        <h4>${data.displayName || '旅人'}</h4>
                        <p>${data.unlockedAchievements?.length || 0} 個成就</p>
                    </div>
                    <div class="leaderboard-score">${count}</div>
                </div>
            `;
            rank++;
        });
        
        list.innerHTML = html;
    } catch (error) {
        console.error('載入排行榜失敗:', error);
        empty.style.display = 'block';
    }
}

// ==================== 篩選與搜尋 ====================

function searchSpots() {
    renderSpotsList();
}

function applyFilter() {
    const filterAll = document.getElementById('filter-all').checked;
    const filterCollected = document.getElementById('filter-collected').checked;
    const filterUncollected = document.getElementById('filter-uncollected').checked;
    const filterPhoto = document.getElementById('filter-photo').checked;
    
    Object.entries(app.markers).forEach(([spotId, marker]) => {
        const isCollected = app.collectedSpots.includes(spotId);
        const hasPhoto = app.spotPhotos[spotId];
        
        let show = false;
        if (filterAll) show = true;
        if (filterCollected && isCollected) show = true;
        if (filterUncollected && !isCollected) show = true;
        if (filterPhoto && hasPhoto) show = true;
        
        if (show) {
            marker.addTo(app.map);
        } else {
            app.map.removeLayer(marker);
        }
    });
}

// ==================== GPS ====================

document.getElementById('gps-btn').addEventListener('click', function() {
    const btn = this;
    btn.classList.add('locating');

    if (!navigator.geolocation) {
        showNotification('❌ 您的瀏覽器不支援定位功能');
        btn.classList.remove('locating');
        return;
    }

    navigator.geolocation.getCurrentPosition(
        (position) => {
            const { latitude, longitude } = position.coords;
            
            if (app.userMarker) {
                app.map.removeLayer(app.userMarker);
            }

            const userIcon = L.divIcon({
                className: 'user-marker',
                html: `<div style="
                    background: #3498db;
                    width: 20px;
                    height: 20px;
                    border-radius: 50%;
                    border: 4px solid white;
                    box-shadow: 0 0 20px rgba(52, 152, 219, 0.8);
                "></div>`,
                iconSize: [20, 20],
                iconAnchor: [10, 10]
            });

            app.userMarker = L.marker([latitude, longitude], { icon: userIcon })
                .addTo(app.map)
                .bindPopup('📍 你在這裡！');

            app.map.flyTo([latitude, longitude], 14, { duration: 1.5 });
            checkNearbySpots(latitude, longitude);
            btn.classList.remove('locating');
        },
        (error) => {
            showNotification('❌ 無法取得位置，請確認定位權限');
            btn.classList.remove('locating');
        },
        { enableHighAccuracy: true, timeout: 10000 }
    );
});

function checkNearbySpots(lat, lng) {
    const nearbyDistance = 0.5;
    let found = [];

    Object.entries(spotsData).forEach(([county, data]) => {
        data.spots.forEach(spot => {
            const spotId = `${county}-${spot.id}`;
            const distance = getDistance(lat, lng, spot.lat, spot.lng);
            if (distance <= nearbyDistance && !app.collectedSpots.includes(spotId)) {
                found.push({ county, spot, distance, spotId });
            }
        });
    });

    if (found.length > 0) {
        found.sort((a, b) => a.distance - b.distance);
        const nearest = found[0];
        showNotification(`🎯 發現附近景點：${nearest.spot.name}（${Math.round(nearest.distance * 1000)}公尺）`);
    }
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

function flyToSpot(spotId) {
    const marker = app.markers[spotId];
    if (marker) {
        const latlng = marker.getLatLng();
        app.map.flyTo(latlng, 15, { duration: 1 });
        marker.fire('click');
    }
}

// ==================== 分享功能 ====================

function showShareModal() {
    document.getElementById('share-collected').textContent = app.collectedSpots.length;
    
    // 計算踏足縣市數
    const counties = new Set(app.collectedSpots.map(id => id.split('-')[0]));
    document.getElementById('share-counties').textContent = counties.size;
    document.getElementById('share-achievements').textContent = app.unlockedAchievements.length;
    
    showModal('share-modal');
    
    // 初始化分享地圖預覽
    setTimeout(() => {
        if (app.shareMap) {
            app.shareMap.remove();
        }
        app.shareMap = L.map('share-map-preview', { zoomControl: false, attributionControl: false })
            .setView([23.7, 120.9], 6);
        
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png').addTo(app.shareMap);
        
        // 只顯示已收集的點
        app.collectedSpots.forEach(spotId => {
            const marker = app.markers[spotId];
            if (marker) {
                const latlng = marker.getLatLng();
                L.circleMarker(latlng, {
                    radius: 5,
                    fillColor: '#27ae60',
                    fillOpacity: 1,
                    color: '#f4d03f',
                    weight: 2
                }).addTo(app.shareMap);
            }
        });
    }, 100);
}

async function downloadShareCard() {
    const card = document.getElementById('share-card');
    try {
        const canvas = await html2canvas(card, { backgroundColor: '#1a1a2e' });
        const link = document.createElement('a');
        link.download = `taiwan-explorer-${Date.now()}.png`;
        link.href = canvas.toDataURL();
        link.click();
        showNotification('📷 圖片已下載！');
    } catch (error) {
        console.error('下載失敗:', error);
        showNotification('❌ 下載失敗');
    }
}

function copyShareLink() {
    const url = window.location.href;
    navigator.clipboard.writeText(url).then(() => {
        showNotification('🔗 連結已複製！');
    });
}

// ==================== 登入功能 ====================

function showAuthModal() {
    showModal('auth-modal');
}

function toggleAuthMode() {
    app.authMode = app.authMode === 'login' ? 'register' : 'login';
    document.getElementById('auth-submit').textContent = app.authMode === 'login' ? '登入' : '註冊';
    document.getElementById('auth-switch').textContent = app.authMode === 'login' ? '還沒有帳號？註冊' : '已有帳號？登入';
}

async function handleAuth() {
    const email = document.getElementById('auth-email').value;
    const password = document.getElementById('auth-password').value;
    
    if (!email || !password) {
        showNotification('❌ 請填寫 Email 和密碼');
        return;
    }
    
    if (!auth) {
        showNotification('❌ Firebase 未設定');
        return;
    }
    
    try {
        if (app.authMode === 'login') {
            await auth.signInWithEmailAndPassword(email, password);
        } else {
            await auth.createUserWithEmailAndPassword(email, password);
        }
        closeModal('auth-modal');
        showNotification('✅ 登入成功！');
    } catch (error) {
        console.error('Auth error:', error);
        showNotification(`❌ ${error.message}`);
    }
}

async function signInWithGoogle() {
    if (!auth) {
        showNotification('❌ Firebase 未設定');
        return;
    }
    
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
        closeModal('auth-modal');
        showNotification('✅ 登入成功！');
    } catch (error) {
        console.error('Google auth error:', error);
        showNotification(`❌ ${error.message}`);
    }
}

function showUserMenu() {
    if (confirm('要登出嗎？')) {
        auth.signOut();
        showNotification('已登出');
    }
}

// ==================== LINE 連動 ====================

function showLineConnectModal() {
    // 生成連動碼
    const code = app.user ? app.user.uid.substring(0, 8).toUpperCase() : generateLinkCode();
    document.getElementById('link-code').value = code;
    
    // QR Code（實際部署時替換為真實的 LINE Bot 連結）
    const lineUrl = `https://line.me/R/ti/p/@your-bot-id`;
    document.getElementById('line-qr').src = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(lineUrl)}`;
    
    showModal('line-modal');
}

function generateLinkCode() {
    return Math.random().toString(36).substring(2, 10).toUpperCase();
}

// ==================== 通用功能 ====================

function showModal(id) {
    document.getElementById(id).classList.add('show');
}

function closeModal(id) {
    document.getElementById(id).classList.remove('show');
}

function showNotification(message) {
    const notification = document.getElementById('notification');
    notification.textContent = message;
    notification.classList.add('show');
    setTimeout(() => notification.classList.remove('show'), 2500);
}

// 標籤切換
document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('active'));
        btn.classList.add('active');
        document.getElementById(`${btn.dataset.tab}-panel`).classList.add('active');
    });
});

// 篩選面板切換
document.getElementById('filter-btn').addEventListener('click', () => {
    document.getElementById('filter-panel').classList.toggle('show');
});

// 點擊外部關閉 modal
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('show');
        }
    });
});

// ==================== 初始化 ====================

document.addEventListener('DOMContentLoaded', () => {
    const hasFirebase = initFirebase();
    initMap();
    
    if (!hasFirebase) {
        loadLocalData();
    }
    
    // 隱藏載入畫面
    setTimeout(() => {
        document.getElementById('loading-screen').classList.add('hidden');
    }, 1000);
});

// 離線支援
window.addEventListener('online', () => {
    app.isOnline = true;
    showNotification('📶 已恢復網路連線');
});

window.addEventListener('offline', () => {
    app.isOnline = false;
    showNotification('📴 已離線，資料會在本地儲存');
});
