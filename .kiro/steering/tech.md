# 技術架構

## 架構類型

**類型**: 靜態網頁應用程式（無需建置系統）

**核心技術**:
- 原生 JavaScript (ES6+)
- HTML5 語義化標記
- CSS3 自訂屬性（變數）

## 主要函式庫與 API

- **LocalStorage API**: 數據持久化和狀態管理
- **Notification API**: 可選的飲水提醒
- **Canvas API**: 用於儀表板的數據視覺化

## 檔案結構

- `index.html` - 主要應用程式入口
- `script.js` - 所有應用程式邏輯（6127 行）
- `style.css` - 所有樣式包含動畫（1750 行）
- `tests/` - 測試套件（單元、整合、無障礙、效能）

## JavaScript 架構

### 類別化元件

- `LocalStorageManager` - 數據驗證、儲存和讀取
- `AppStateManager` - 應用程式狀態和事件管理
- `OnboardingSystem` - 首次使用者教學流程
- `SettingsPanel` - 使用者偏好設定和配置
- 其他系統：通知、主題、儀表板、匯出

### 數據模型

```javascript
{
  level: number,
  exp: number,
  maxExp: number,
  todayAmount: number,
  dailyGoal: number,
  totalAmount: number,
  history: Array,
  achievements: Array,
  metadata: { version, createdAt, lastUpdated }
}
```

## 樣式方法

- **CSS 變數**: 主題感知的設計標記
- **響應式**: 行動優先的媒體查詢
- **動畫**: 大量使用 CSS 關鍵影格動畫
- **無障礙**: 焦點指示器、高對比度支援、減少動畫支援

## 常用指令

### 開發

```bash
# 本地伺服器（擇一使用）
python -m http.server 8000
npx serve .
php -S localhost:8000
```

### 測試

直接在瀏覽器中開啟測試檔案：
- `tests/test-unit.html` - 單元測試
- `tests/test-integration.html` - 整合測試
- `tests/test-accessibility.html` - 無障礙測試
- `tests/test-performance-offline.html` - 效能測試

或透過本地伺服器導航至測試 URL。

## 瀏覽器支援

- 支援 ES6+ 的現代瀏覽器
- 需要 LocalStorage API
- Notification API 為可選
- 不支援功能的優雅降級

## 效能考量

- 無外部依賴或建置流程
- 所有資源內嵌或本地
- 高效的 LocalStorage 使用與驗證
- 優化的動畫，支援 `prefers-reduced-motion`
