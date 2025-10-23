# 專案結構

## 目錄配置

```
waterlog/
├── index.html              # 主要應用程式入口
├── script.js               # 所有 JavaScript 邏輯
├── style.css               # 所有樣式和動畫
├── README.md               # 專案文件
├── LICENSE                 # MIT 授權
├── .kiro/                  # Kiro AI 助理配置
│   └── steering/           # AI 指導文件
├── .vscode/                # VS Code 工作區設定
└── tests/                  # 測試套件
    ├── test-unit.html
    ├── test-integration.html
    ├── test-accessibility.html
    ├── test-dashboard.html
    ├── test-export.html
    ├── test-performance-offline.html
    └── TESTING.md
```

## 程式碼組織

### script.js 結構（6127 行）

**常數與定義**（檔案頂部）：
- `ACHIEVEMENT_DEFINITIONS` - 成就配置
- `CHARACTER_STAGES` - 角色進化階段
- `DEFAULT_GAME_DATA` - 初始遊戲狀態
- `DEFAULT_SETTINGS` - 預設使用者偏好

**核心類別**（依序）：
1. `LocalStorageManager` - 數據持久化層
2. `AppStateManager` - 狀態管理和事件系統
3. `OnboardingSystem` - 教學流程
4. `SettingsPanel` - 使用者配置 UI
5. 其他系統（通知、主題、儀表板、匯出）

**全域函式**：
- `addWater()` - 主要使用者操作
- `showCelebration()` - UI 回饋
- `updateUI()` - 渲染狀態變更
- 初始化和事件處理器

### style.css 結構（1750 行）

**組織方式**：
1. 重置和基礎樣式
2. 無障礙工具（`.sr-only`、焦點指示器）
3. CSS 自訂屬性（`:root` 變數）
4. 深色主題覆寫
5. 元件樣式（header、character、stats、achievements、history）
6. 動畫關鍵影格
7. 響應式媒體查詢
8. 無障礙增強

### HTML 結構

**語義化區塊**：
- `<header>` - 標題、等級資訊、導航
- `<main>` - 主要內容區域
  - 角色區塊
  - 統計區塊（進度、快速操作、自訂輸入）
  - 成就區塊
  - 歷史記錄區塊
- 模態覆蓋層（慶祝、導覽、設定、儀表板、匯出）

**無障礙功能**：
- 跳過導航連結
- ARIA 地標（`role="banner"`、`role="main"`）
- ARIA 即時區域用於動態更新
- 完整的 ARIA 標籤和描述

## 測試結構

**測試類型**：
- **單元測試**: 核心邏輯驗證（LocalStorage、計算、日期處理）
- **整合測試**: 元件互動和數據流
- **無障礙測試**: 鍵盤導航、ARIA、螢幕閱讀器支援
- **儀表板測試**: 圖表渲染和統計
- **匯出測試**: 數據匯出/匯入功能
- **效能測試**: 載入時間、離線能力

## 慣例

### 命名規則
- 類別: PascalCase（`LocalStorageManager`）
- 函式: camelCase（`addWater`、`showCelebration`）
- 常數: UPPER_SNAKE_CASE（`DEFAULT_GAME_DATA`）
- CSS 類別: kebab-case（`.drink-btn`、`.custom-input-card`）

### 註解
- 區塊標題使用 `// ==================== 區塊名稱 ====================`
- JSDoc 風格的函式文件，包含 `@param` 和 `@returns`
- 複雜邏輯的行內註解

### 檔案組織
- 單檔案架構（無模組）
- 依功能邏輯分組
- 檔案內清楚的關注點分離
