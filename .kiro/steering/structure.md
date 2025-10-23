# 專案結構

## 檔案組織
```
waterlog/
├── index.html          # 主要應用程式進入點
├── script.js           # 遊戲邏輯與資料管理
├── style.css           # 所有樣式設計與動畫
├── README.md           # 專案說明文件
├── LICENSE             # 專案授權條款
├── .git/               # Git 版本控制
├── .kiro/              # Kiro AI 助理設定
└── .vscode/            # VS Code 工作區設定
```

## 核心應用程式檔案

### index.html
- 單頁應用程式結構
- 繁體中文介面文字與標籤
- 語意化 HTML 搭配適當無障礙設計
- 連結 CSS 和 JavaScript 檔案
- 包含所有 UI 元素和遊戲介面

### script.js
- 使用 `gameData` 物件管理遊戲狀態
- LocalStorage 整合實現資料持久化
- 5 級角色進化系統
- 預定義里程碑的成就系統
- 每日進度追蹤與歷史記錄
- 使用者互動的事件處理器

### style.css
- 行動優先的響應式設計
- CSS Grid 和 Flexbox 版面配置
- 漸層背景與現代化樣式設計
- 慶祝動畫與互動的關鍵影格
- 行動裝置優化的媒體查詢

## 資料架構

### 遊戲狀態結構
```javascript
gameData = {
    level: number,           // 角色等級（1-5）
    exp: number,            // 目前經驗值
    maxExp: number,         // 下一級所需經驗值
    todayAmount: number,    // 今日飲水量（毫升）
    dailyGoal: number,      // 每日目標（預設：2000ml）
    totalAmount: number,    // 累計飲水量
    history: array,         // 今日飲水記錄
    achievements: array     // 已解鎖成就 ID
}
```

### 角色進化
- 5 個不同的角色階段，各有獨特表情符號和名稱
- 根據等級漸進式尺寸縮放
- 每個進化階段使用中文名稱

## 命名慣例
- **檔案名稱**：小寫搭配連字號（kebab-case）
- **CSS 類別**：描述性名稱搭配連字號
- **JavaScript**：變數和函式使用 camelCase
- **ID**：DOM 元素 ID 使用 camelCase
- **常數**：設定物件使用 UPPER_SNAKE_CASE