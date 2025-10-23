# Design Document

## Overview

本設計文件詳述水精靈養成記應用的全面增強架構，基於現有的遊戲化飲水追蹤系統，新增新手導覽、進階設定、多層級統計儀表板和數據管理功能。設計採用模組化架構，確保向後相容性並提供流暢的使用者體驗。

## Architecture

### 系統架構圖

```
┌─────────────────────────────────────────────────────────────┐
│                    Water Tracker App                        │
├─────────────────────────────────────────────────────────────┤
│  UI Layer                                                   │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ Onboarding  │ │ Main App    │ │ Settings Panel          │ │
│  │ System      │ │ Interface   │ │                         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Component Layer                                            │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ Dashboard   │ │ Water Entry │ │ Notification System     │ │
│  │ System      │ │ Manager     │ │                         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Service Layer                                              │
│  ┌─────────────┐ ┌─────────────┐ ┌─────────────────────────┐ │
│  │ Data Export │ │ Theme       │ │ LocalStorage Manager    │ │
│  │ System      │ │ System      │ │                         │ │
│  └─────────────┘ └─────────────┘ └─────────────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │              Browser LocalStorage                       │ │
│  └─────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

### 核心設計原則

1. **漸進式增強**: 在現有功能基礎上添加新功能，不破壞現有使用者體驗
2. **模組化設計**: 每個新功能作為獨立模組，便於維護和測試
3. **響應式優先**: 行動裝置優先的設計方法
4. **無障礙設計**: 遵循 WCAG 2.1 AA 標準
5. **效能優化**: 最小化 DOM 操作和記憶體使用

## Components and Interfaces

### 1. Onboarding System

**目的**: 為新使用者提供互動式導覽體驗

**介面設計**:
```javascript
class OnboardingSystem {
    constructor(container, gameData) {
        this.container = container;
        this.gameData = gameData;
        this.currentStep = 0;
        this.totalSteps = 4;
    }
    
    // 檢查是否需要顯示導覽
    shouldShowOnboarding() {
        return !localStorage.getItem('onboardingCompleted');
    }
    
    // 開始導覽流程
    startOnboarding() {
        this.createOverlay();
        this.showStep(0);
    }
    
    // 顯示特定步驟
    showStep(stepIndex) {
        const steps = [
            this.showWelcomeStep,
            this.showAddWaterStep,
            this.showProgressStep,
            this.showFeaturesStep
        ];
        steps[stepIndex].call(this);
    }
    
    // 完成導覽
    completeOnboarding() {
        localStorage.setItem('onboardingCompleted', 'true');
        this.hideOverlay();
    }
}
```

**視覺設計**:
- 半透明深色遮罩背景
- 白色卡片式步驟內容
- 高亮顯示相關UI元素
- 進度指示器和導航按鈕

### 2. Settings Panel

**目的**: 提供應用程式個人化設定功能

**資料結構**:
```javascript
const defaultSettings = {
    dailyGoal: 2000,           // 每日目標 (1000-5000ml)
    quickButtons: [250, 500, 100], // 快速按鈕水量
    notifications: {
        enabled: false,
        schedule: []           // 最多8個時間點
    },
    theme: 'auto',            // 'light', 'dark', 'auto'
    language: 'zh-TW'
};
```

**介面設計**:
```javascript
class SettingsPanel {
    constructor() {
        this.settings = this.loadSettings();
        this.isVisible = false;
    }
    
    // 載入設定
    loadSettings() {
        const saved = localStorage.getItem('appSettings');
        return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings;
    }
    
    // 儲存設定
    saveSettings() {
        localStorage.setItem('appSettings', JSON.stringify(this.settings));
        this.applySettings();
    }
    
    // 套用設定到應用程式
    applySettings() {
        this.updateDailyGoal();
        this.updateQuickButtons();
        this.updateNotifications();
        this.updateTheme();
    }
}
```

### 3. Dashboard System

**目的**: 提供多層級統計數據檢視

**資料處理**:
```javascript
class DashboardSystem {
    constructor(gameData) {
        this.gameData = gameData;
        this.currentView = 'daily'; // 'daily', 'weekly', 'monthly'
        this.chartInstances = {};
    }
    
    // 切換檢視
    switchView(viewType) {
        this.currentView = viewType;
        this.renderCurrentView();
    }
    
    // 計算統計數據
    calculateStats(period) {
        const history = this.getHistoryForPeriod(period);
        return {
            totalAmount: this.sumWaterAmount(history),
            averageDaily: this.calculateAverage(history),
            goalAchievementRate: this.calculateGoalRate(history),
            bestStreak: this.calculateBestStreak(history),
            trend: this.calculateTrend(history)
        };
    }
    
    // 渲染圖表
    renderChart(type, data, container) {
        // 使用 Canvas API 繪製簡單圖表
        const canvas = container.querySelector('canvas');
        const ctx = canvas.getContext('2d');
        
        switch(type) {
            case 'bar':
                this.drawBarChart(ctx, data);
                break;
            case 'line':
                this.drawLineChart(ctx, data);
                break;
            case 'pie':
                this.drawPieChart(ctx, data);
                break;
        }
    }
}
```

### 4. Enhanced Water Entry Manager

**目的**: 改善水量記錄功能，支援時間自訂和記錄編輯

**介面設計**:
```javascript
class WaterEntryManager {
    constructor(gameData) {
        this.gameData = gameData;
        this.editingEntry = null;
    }
    
    // 添加水量記錄
    addWaterEntry(amount, customTime = null) {
        const timestamp = customTime || new Date();
        const entry = {
            id: this.generateEntryId(),
            timestamp: timestamp,
            amount: amount,
            exp: Math.floor(amount / 10)
        };
        
        this.gameData.history.unshift(entry);
        this.updateTotals();
        this.saveData();
        this.renderHistory();
    }
    
    // 編輯記錄
    editEntry(entryId, newAmount, newTime) {
        const entry = this.findEntryById(entryId);
        if (entry) {
            entry.amount = newAmount;
            entry.timestamp = newTime;
            entry.exp = Math.floor(newAmount / 10);
            
            this.recalculateAll();
            this.saveData();
            this.renderHistory();
        }
    }
    
    // 刪除記錄
    deleteEntry(entryId) {
        this.gameData.history = this.gameData.history.filter(
            entry => entry.id !== entryId
        );
        this.recalculateAll();
        this.saveData();
        this.renderHistory();
    }
}
```

### 5. Notification System

**目的**: 提供瀏覽器通知提醒功能

**實作設計**:
```javascript
class NotificationSystem {
    constructor(settings) {
        this.settings = settings;
        this.permission = 'default';
        this.scheduledNotifications = [];
    }
    
    // 請求通知權限
    async requestPermission() {
        if ('Notification' in window) {
            this.permission = await Notification.requestPermission();
            return this.permission === 'granted';
        }
        return false;
    }
    
    // 排程通知
    scheduleNotifications() {
        this.clearScheduledNotifications();
        
        if (this.permission === 'granted' && this.settings.notifications.enabled) {
            this.settings.notifications.schedule.forEach(time => {
                this.scheduleNotificationForTime(time);
            });
        }
    }
    
    // 發送通知
    sendNotification(title, body, icon = '💧') {
        if (this.permission === 'granted') {
            new Notification(title, {
                body: body,
                icon: icon,
                badge: icon,
                tag: 'water-reminder'
            });
        }
    }
}
```

### 6. Data Export System

**目的**: 提供數據匯出和備份功能

**實作設計**:
```javascript
class DataExportSystem {
    constructor(gameData) {
        this.gameData = gameData;
    }
    
    // 匯出為 CSV
    exportToCSV(dateRange) {
        const data = this.getDataForRange(dateRange);
        const csvContent = this.convertToCSV(data);
        this.downloadFile(csvContent, 'water-data.csv', 'text/csv');
    }
    
    // 匯出為 JSON
    exportToJSON(dateRange) {
        const data = this.getDataForRange(dateRange);
        const jsonContent = JSON.stringify(data, null, 2);
        this.downloadFile(jsonContent, 'water-data.json', 'application/json');
    }
    
    // 備份所有數據
    backupAllData() {
        const backup = {
            gameData: this.gameData,
            settings: JSON.parse(localStorage.getItem('appSettings') || '{}'),
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        
        const backupContent = JSON.stringify(backup, null, 2);
        this.downloadFile(backupContent, 'water-tracker-backup.json', 'application/json');
    }
    
    // 從備份還原
    restoreFromBackup(backupFile) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const backup = JSON.parse(e.target.result);
                    this.validateBackup(backup);
                    this.applyBackup(backup);
                    resolve(true);
                } catch (error) {
                    reject(error);
                }
            };
            reader.readAsText(backupFile);
        });
    }
}
```

## Data Models

### 擴展的遊戲數據結構

```javascript
const enhancedGameData = {
    // 現有數據
    level: 1,
    exp: 0,
    maxExp: 100,
    todayAmount: 0,
    dailyGoal: 2000,
    totalAmount: 0,
    history: [],
    achievements: [],
    
    // 新增數據
    settings: {
        dailyGoal: 2000,
        quickButtons: [250, 500, 100],
        notifications: {
            enabled: false,
            schedule: []
        },
        theme: 'auto',
        onboardingCompleted: false
    },
    
    // 歷史統計數據
    weeklyHistory: [],      // 最近4週的每日總量
    monthlyHistory: [],     // 最近12個月的統計
    streakData: {
        current: 0,
        best: 0,
        lastGoalDate: null
    },
    
    // 應用程式元數據
    metadata: {
        version: '2.0',
        createdAt: null,
        lastUpdated: null,
        totalSessions: 0
    }
};
```

### 水量記錄項目結構

```javascript
const waterEntry = {
    id: 'uuid-string',           // 唯一識別碼
    timestamp: Date,             // 記錄時間
    amount: Number,              // 水量 (ml)
    exp: Number,                 // 獲得經驗值
    source: 'manual|quick',      // 記錄來源
    edited: Boolean,             // 是否已編輯
    editHistory: []              // 編輯歷史
};
```

## Error Handling

### 錯誤處理策略

1. **LocalStorage 錯誤**:
   - 儲存空間不足時顯示清理建議
   - 數據損壞時嘗試修復或重置
   - 提供數據匯出作為備份方案

2. **通知權限錯誤**:
   - 優雅降級，不影響核心功能
   - 提供替代提醒方案（視覺提示）

3. **數據匯入/匯出錯誤**:
   - 檔案格式驗證
   - 版本相容性檢查
   - 回滾機制

```javascript
class ErrorHandler {
    static handleStorageError(error) {
        console.error('Storage error:', error);
        
        if (error.name === 'QuotaExceededError') {
            this.showStorageFullDialog();
        } else {
            this.showGenericErrorDialog('數據儲存失敗，請重試');
        }
    }
    
    static handleNotificationError(error) {
        console.warn('Notification error:', error);
        // 靜默處理，不影響使用者體驗
    }
    
    static handleDataCorruption() {
        const backup = this.createEmergencyBackup();
        this.resetToDefaults();
        this.showDataRecoveryDialog(backup);
    }
}
```

## Testing Strategy

### 測試方法

1. **單元測試**:
   - 數據計算邏輯
   - LocalStorage 操作
   - 日期時間處理

2. **整合測試**:
   - 元件間互動
   - 數據流驗證
   - 設定同步

3. **使用者介面測試**:
   - 響應式設計
   - 無障礙功能
   - 跨瀏覽器相容性

4. **效能測試**:
   - 大量數據處理
   - 記憶體使用
   - 載入時間

### 測試工具和框架

- **手動測試**: 跨裝置和瀏覽器測試
- **自動化測試**: 使用 Jest 進行邏輯測試
- **無障礙測試**: 使用螢幕閱讀器和鍵盤導航
- **效能監控**: 使用瀏覽器開發者工具

## Implementation Phases

### Phase 1: 核心架構重構
- 模組化現有程式碼
- 實作 LocalStorage Manager
- 建立錯誤處理機制

### Phase 2: 新手導覽系統
- 設計導覽流程
- 實作互動式教學
- 整合到主應用程式

### Phase 3: 設定系統
- 建立設定介面
- 實作通知系統
- 主題切換功能

### Phase 4: 統計儀表板
- 數據計算邏輯
- 圖表繪製系統
- 多檢視切換

### Phase 5: 進階功能
- 記錄編輯功能
- 數據匯出系統
- 效能優化

這個設計確保了系統的可擴展性、維護性和使用者體驗，同時保持與