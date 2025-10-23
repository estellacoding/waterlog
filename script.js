// ==================== 常數定義 ====================

// 成就定義
const ACHIEVEMENT_DEFINITIONS = [
    { id: 'first_drink', name: '第一滴水', description: '記錄第一次喝水', icon: '💧', requirement: 1 },
    { id: 'daily_goal', name: '今日達標', description: '完成每日目標', icon: '🎯', requirement: 'daily' },
    { id: 'water_warrior', name: '水之戰士', description: '累計喝水5000ml', icon: '⚔️', requirement: 5000 },
    { id: 'hydration_master', name: '水分大師', description: '累計喝水10000ml', icon: '🏆', requirement: 10000 },
    { id: 'level_5', name: '五級水精靈', description: '達到5級', icon: '⭐', requirement: 'level_5' },
    { id: 'consistent', name: '堅持不懈', description: '連續7天達標', icon: '🔥', requirement: 'streak_7' }
];

// 角色進化階段
const CHARACTER_STAGES = {
    1: { emoji: '🌱', name: '小水滴' },
    2: { emoji: '🌿', name: '水苗' },
    3: { emoji: '🌊', name: '水精靈' },
    4: { emoji: '🐉', name: '水龍' },
    5: { emoji: '👑', name: '水之王' }
};

// 預設遊戲數據
const DEFAULT_GAME_DATA = {
    level: 1,
    exp: 0,
    maxExp: 100,
    todayAmount: 0,
    dailyGoal: 2000,
    totalAmount: 0,
    history: [],
    achievements: [],
    metadata: {
        version: '2.0',
        createdAt: null,
        lastUpdated: null
    }
};

// 預設設定
const DEFAULT_SETTINGS = {
    dailyGoal: 2000,           // 每日目標 (1000-5000ml)
    quickButtons: [250, 500, 100], // 快速按鈕水量
    notifications: {
        enabled: false,
        schedule: []           // 最多8個時間點
    },
    theme: 'auto',            // 'light', 'dark', 'auto'
    language: 'zh-TW'
};

// ==================== LocalStorage Manager 類別 ====================

class LocalStorageManager {
    constructor() {
        this.storageKeys = {
            gameData: 'waterGameData',
            lastPlayDate: 'lastPlayDate',
            settings: 'appSettings'
        };
    }

    /**
     * 驗證數據結構
     */
    validateGameData(data) {
        if (!data || typeof data !== 'object') {
            throw new Error('無效的遊戲數據格式');
        }

        // 驗證必要欄位
        const requiredFields = ['level', 'exp', 'maxExp', 'todayAmount', 'dailyGoal', 'totalAmount', 'history', 'achievements'];
        for (const field of requiredFields) {
            if (!(field in data)) {
                throw new Error(`缺少必要欄位: ${field}`);
            }
        }

        // 驗證數值範圍
        if (data.level < 1 || data.level > 100) {
            throw new Error('等級數值超出範圍');
        }

        if (data.exp < 0 || data.maxExp < 1) {
            throw new Error('經驗值數值無效');
        }

        if (data.todayAmount < 0 || data.totalAmount < 0) {
            throw new Error('水量數值不能為負數');
        }

        if (!Array.isArray(data.history) || !Array.isArray(data.achievements)) {
            throw new Error('歷史記錄或成就必須為陣列');
        }

        return true;
    }

    /**
     * 載入遊戲數據
     */
    loadGameData() {
        try {
            const saved = localStorage.getItem(this.storageKeys.gameData);
            
            if (!saved) {
                return this.createDefaultGameData();
            }

            const data = JSON.parse(saved);
            this.validateGameData(data);

            // 合併預設值以確保新欄位存在
            return { ...DEFAULT_GAME_DATA, ...data };

        } catch (error) {
            console.error('載入遊戲數據失敗:', error);
            this.handleStorageError(error);
            return this.createDefaultGameData();
        }
    }

    /**
     * 儲存遊戲數據
     */
    saveGameData(data) {
        try {
            this.validateGameData(data);
            
            // 更新元數據
            data.metadata = data.metadata || {};
            data.metadata.lastUpdated = new Date().toISOString();
            
            const jsonString = JSON.stringify(data);
            localStorage.setItem(this.storageKeys.gameData, jsonString);
            
            return true;

        } catch (error) {
            console.error('儲存遊戲數據失敗:', error);
            this.handleStorageError(error);
            return false;
        }
    }

    /**
     * 載入最後遊玩日期
     */
    loadLastPlayDate() {
        try {
            return localStorage.getItem(this.storageKeys.lastPlayDate);
        } catch (error) {
            console.error('載入日期失敗:', error);
            return null;
        }
    }

    /**
     * 儲存最後遊玩日期
     */
    saveLastPlayDate(date) {
        try {
            localStorage.setItem(this.storageKeys.lastPlayDate, date);
            return true;
        } catch (error) {
            console.error('儲存日期失敗:', error);
            return false;
        }
    }

    /**
     * 創建預設遊戲數據
     */
    createDefaultGameData() {
        const data = { ...DEFAULT_GAME_DATA };
        data.metadata.createdAt = new Date().toISOString();
        data.metadata.lastUpdated = new Date().toISOString();
        return data;
    }

    /**
     * 檢查 LocalStorage 可用性
     */
    isStorageAvailable() {
        try {
            const testKey = '__storage_test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 處理儲存錯誤
     */
    handleStorageError(error) {
        if (error.name === 'QuotaExceededError') {
            alert('儲存空間不足！請清理瀏覽器數據或匯出備份。');
        } else if (error.name === 'SecurityError') {
            alert('無法存取本地儲存，請檢查瀏覽器設定。');
        } else {
            alert(`數據操作失敗: ${error.message}`);
        }
    }

    /**
     * 清除所有數據
     */
    clearAllData() {
        try {
            Object.values(this.storageKeys).forEach(key => {
                localStorage.removeItem(key);
            });
            return true;
        } catch (error) {
            console.error('清除數據失敗:', error);
            return false;
        }
    }
}

// ==================== 應用程式狀態管理系統 ====================

class AppStateManager {
    constructor() {
        this.storageManager = new LocalStorageManager();
        this.gameData = null;
        this.listeners = {
            dataChange: [],
            levelUp: [],
            achievementUnlock: [],
            dailyGoalComplete: []
        };
    }

    /**
     * 初始化應用程式狀態
     */
    initialize() {
        try {
            // 檢查 LocalStorage 可用性
            if (!this.storageManager.isStorageAvailable()) {
                throw new Error('LocalStorage 不可用');
            }

            // 載入遊戲數據
            this.gameData = this.storageManager.loadGameData();

            // 檢查是否是新的一天
            this.checkNewDay();

            return true;

        } catch (error) {
            console.error('初始化失敗:', error);
            alert('應用程式初始化失敗，將使用預設數據');
            this.gameData = this.storageManager.createDefaultGameData();
            return false;
        }
    }

    /**
     * 檢查新的一天
     */
    checkNewDay() {
        const today = new Date().toDateString();
        const lastDate = this.storageManager.loadLastPlayDate();

        if (lastDate && lastDate !== today) {
            // 儲存昨天的數據到歷史記錄
            try {
                const key = `waterHistory_${lastDate}`;
                localStorage.setItem(key, this.gameData.todayAmount.toString());
            } catch (error) {
                console.error('儲存歷史數據失敗:', error);
            }
            
            // 新的一天，重置每日數據
            this.gameData.todayAmount = 0;
            this.gameData.history = [];
            this.storageManager.saveLastPlayDate(today);
            this.saveState();
        } else if (!lastDate) {
            // 首次使用
            this.storageManager.saveLastPlayDate(today);
        }
    }

    /**
     * 獲取遊戲數據
     */
    getGameData() {
        return { ...this.gameData };
    }

    /**
     * 更新遊戲數據
     */
    updateGameData(updates) {
        try {
            this.gameData = { ...this.gameData, ...updates };
            this.saveState();
            this.notifyListeners('dataChange', this.gameData);
            return true;
        } catch (error) {
            console.error('更新數據失敗:', error);
            return false;
        }
    }

    /**
     * 儲存狀態
     */
    saveState() {
        return this.storageManager.saveGameData(this.gameData);
    }

    /**
     * 添加事件監聽器
     */
    addEventListener(event, callback) {
        if (this.listeners[event]) {
            this.listeners[event].push(callback);
        }
    }

    /**
     * 通知監聽器
     */
    notifyListeners(event, data) {
        if (this.listeners[event]) {
            this.listeners[event].forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error('監聽器執行失敗:', error);
                }
            });
        }
    }

    /**
     * 重置應用程式狀態
     */
    reset() {
        this.storageManager.clearAllData();
        this.gameData = this.storageManager.createDefaultGameData();
        this.saveState();
        this.notifyListeners('dataChange', this.gameData);
    }
}

// ==================== 新手導覽系統 ====================

class OnboardingSystem {
    constructor(container, appState) {
        this.container = container;
        this.appState = appState;
        this.currentStep = 0;
        this.totalSteps = 4;
        this.overlay = null;
        this.contentBox = null;
        this.storageKey = 'onboardingCompleted';
    }

    /**
     * 檢查是否需要顯示導覽
     */
    shouldShowOnboarding() {
        try {
            return !localStorage.getItem(this.storageKey);
        } catch (error) {
            console.error('檢查導覽狀態失敗:', error);
            return false;
        }
    }

    /**
     * 開始導覽流程
     */
    startOnboarding() {
        try {
            this.currentStep = 0;
            this.createOverlay();
            this.showStep(0);
        } catch (error) {
            console.error('開始導覽失敗:', error);
            this.completeOnboarding();
        }
    }

    /**
     * 創建遮罩和內容容器
     */
    createOverlay() {
        // 創建遮罩
        this.overlay = document.createElement('div');
        this.overlay.className = 'onboarding-overlay';
        this.overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 9998;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-in;
        `;

        // 創建內容框
        this.contentBox = document.createElement('div');
        this.contentBox.className = 'onboarding-content';
        this.contentBox.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 32px;
            max-width: 500px;
            width: 90%;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            position: relative;
            z-index: 9999;
            animation: slideUp 0.4s ease-out;
        `;

        this.overlay.appendChild(this.contentBox);
        document.body.appendChild(this.overlay);
    }

    /**
     * 顯示特定步驟
     */
    showStep(stepIndex) {
        this.currentStep = stepIndex;

        const steps = [
            this.getWelcomeStep.bind(this),
            this.getAddWaterStep.bind(this),
            this.getProgressStep.bind(this),
            this.getFeaturesStep.bind(this)
        ];

        if (stepIndex >= 0 && stepIndex < steps.length) {
            const stepContent = steps[stepIndex]();
            this.renderStep(stepContent);
        }
    }

    /**
     * 渲染步驟內容
     */
    renderStep(stepContent) {
        if (!this.contentBox) return;

        this.contentBox.innerHTML = `
            <div style="text-align: center; margin-bottom: 24px;">
                <div style="font-size: 64px; margin-bottom: 16px;">${stepContent.icon}</div>
                <h2 style="margin: 0 0 12px 0; color: #333; font-size: 24px;">${stepContent.title}</h2>
                <p style="margin: 0; color: #666; font-size: 16px; line-height: 1.6;">${stepContent.description}</p>
            </div>
            
            ${stepContent.highlight ? this.createHighlight(stepContent.highlight) : ''}
            
            <div style="display: flex; justify-content: space-between; align-items: center; margin-top: 24px;">
                <div style="color: #999; font-size: 14px;">
                    ${this.currentStep + 1} / ${this.totalSteps}
                </div>
                <div style="display: flex; gap: 12px;">
                    ${this.currentStep === 0 ? `
                        <button onclick="onboardingSystem.skipOnboarding()" 
                                style="padding: 10px 20px; border: 1px solid #ddd; background: white; 
                                       border-radius: 8px; cursor: pointer; font-size: 14px;">
                            跳過
                        </button>
                    ` : ''}
                    <button onclick="onboardingSystem.${this.currentStep < this.totalSteps - 1 ? 'nextStep()' : 'completeOnboarding()'}" 
                            style="padding: 10px 24px; border: none; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                                   color: white; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold;">
                        ${this.currentStep < this.totalSteps - 1 ? '下一步' : '開始使用'}
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * 創建高亮效果
     */
    createHighlight(selector) {
        try {
            const element = document.querySelector(selector);
            if (element) {
                // 移除之前的高亮
                document.querySelectorAll('.onboarding-highlight').forEach(el => {
                    el.classList.remove('onboarding-highlight');
                });

                // 添加高亮類別
                element.classList.add('onboarding-highlight');
                
                // 滾動到元素
                setTimeout(() => {
                    element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
            }
            return '';
        } catch (error) {
            console.error('創建高亮失敗:', error);
            return '';
        }
    }

    /**
     * 步驟 1: 歡迎
     */
    getWelcomeStep() {
        return {
            icon: '👋',
            title: '歡迎來到水精靈養成記！',
            description: '這是一個有趣的喝水追蹤應用程式。透過記錄每天的飲水量，你可以培養健康的喝水習慣，並看著你的水精靈一起成長進化！讓我們快速了解如何使用吧。'
        };
    }

    /**
     * 步驟 2: 添加水量
     */
    getAddWaterStep() {
        return {
            icon: '💧',
            title: '記錄你的飲水量',
            description: '點擊快速按鈕（250ml、500ml、100ml）或輸入自訂水量來記錄你喝的水。每次記錄都會獲得經驗值，幫助你的水精靈升級！',
            highlight: '.quick-buttons'
        };
    }

    /**
     * 步驟 3: 查看進度
     */
    getProgressStep() {
        return {
            icon: '📊',
            title: '追蹤你的進度',
            description: '在這裡可以看到你今天的飲水進度和每日目標。進度條會隨著你喝水而增長，達成目標後還能解鎖成就！',
            highlight: '.progress-section'
        };
    }

    /**
     * 步驟 4: 功能介紹
     */
    getFeaturesStep() {
        return {
            icon: '⭐',
            title: '探索更多功能',
            description: '你可以查看歷史記錄、解鎖各種成就，還能看著你的水精靈從小水滴進化成水之王！每天堅持喝水，讓我們一起變得更健康吧！'
        };
    }

    /**
     * 下一步
     */
    nextStep() {
        if (this.currentStep < this.totalSteps - 1) {
            this.showStep(this.currentStep + 1);
        }
    }

    /**
     * 跳過導覽
     */
    skipOnboarding() {
        if (confirm('確定要跳過導覽嗎？你可以稍後在設定中重新觀看。')) {
            this.completeOnboarding();
        }
    }

    /**
     * 完成導覽
     */
    completeOnboarding() {
        try {
            // 儲存完成狀態
            localStorage.setItem(this.storageKey, 'true');

            // 移除高亮
            document.querySelectorAll('.onboarding-highlight').forEach(el => {
                el.classList.remove('onboarding-highlight');
            });

            // 移除遮罩
            this.hideOverlay();

            // 顯示歡迎訊息
            if (this.currentStep === this.totalSteps - 1) {
                setTimeout(() => {
                    showCelebration('🎉 歡迎加入！開始你的喝水之旅吧！');
                }, 300);
            }
        } catch (error) {
            console.error('完成導覽失敗:', error);
            this.hideOverlay();
        }
    }

    /**
     * 隱藏遮罩
     */
    hideOverlay() {
        if (this.overlay) {
            this.overlay.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (this.overlay && this.overlay.parentNode) {
                    this.overlay.parentNode.removeChild(this.overlay);
                }
                this.overlay = null;
                this.contentBox = null;
            }, 300);
        }
    }

    /**
     * 重新開始導覽
     */
    restartOnboarding() {
        localStorage.removeItem(this.storageKey);
        this.startOnboarding();
    }
}

// ==================== 設定面板系統 ====================

class SettingsPanel {
    constructor(appState) {
        this.appState = appState;
        this.settings = this.loadSettings();
        this.isVisible = false;
        this.panel = null;
    }

    /**
     * 載入設定
     */
    loadSettings() {
        try {
            const saved = localStorage.getItem('appSettings');
            return saved ? { ...DEFAULT_SETTINGS, ...JSON.parse(saved) } : { ...DEFAULT_SETTINGS };
        } catch (error) {
            console.error('載入設定失敗:', error);
            return { ...DEFAULT_SETTINGS };
        }
    }

    /**
     * 儲存設定
     */
    saveSettings() {
        try {
            localStorage.setItem('appSettings', JSON.stringify(this.settings));
            this.applySettings();
            return true;
        } catch (error) {
            console.error('儲存設定失敗:', error);
            alert('儲存設定失敗，請重試');
            return false;
        }
    }

    /**
     * 驗證設定數值
     */
    validateSettings(settings) {
        // 驗證每日目標
        if (settings.dailyGoal < 1000 || settings.dailyGoal > 5000) {
            throw new Error('每日目標必須在 1000-5000ml 之間');
        }

        // 驗證快速按鈕
        if (!Array.isArray(settings.quickButtons) || settings.quickButtons.length !== 3) {
            throw new Error('快速按鈕必須有3個');
        }

        settings.quickButtons.forEach((amount, index) => {
            if (amount < 50 || amount > 1000) {
                throw new Error(`快速按鈕 ${index + 1} 的水量必須在 50-1000ml 之間`);
            }
        });

        // 驗證通知時間表
        if (settings.notifications.schedule.length > 8) {
            throw new Error('最多只能設定8個提醒時間');
        }

        return true;
    }

    /**
     * 套用設定到應用程式
     */
    applySettings() {
        try {
            // 更新每日目標
            this.updateDailyGoal();

            // 更新快速按鈕
            this.updateQuickButtons();

            // 更新通知（如果通知系統已初始化）
            if (notificationSystem) {
                notificationSystem.updateSettings(this.settings.notifications);
            }

            // 更新主題（如果主題系統已初始化）
            if (themeSystem) {
                themeSystem.applyTheme(this.settings.theme);
            }

            return true;
        } catch (error) {
            console.error('套用設定失敗:', error);
            return false;
        }
    }

    /**
     * 更新每日目標
     */
    updateDailyGoal() {
        const gameData = this.appState.getGameData();
        gameData.dailyGoal = this.settings.dailyGoal;
        this.appState.updateGameData(gameData);

        // 更新UI顯示
        const goalElement = document.querySelector('.daily-goal h3');
        if (goalElement) {
            goalElement.textContent = `今日目標: ${this.settings.dailyGoal}ml`;
        }

        const progressText = document.querySelector('.progress-text');
        if (progressText) {
            const todayAmount = gameData.todayAmount;
            progressText.innerHTML = `<span id="todayAmount">${todayAmount}</span>ml / ${this.settings.dailyGoal}ml`;
        }
    }

    /**
     * 更新快速按鈕
     */
    updateQuickButtons() {
        const buttons = document.querySelectorAll('.quick-buttons .drink-btn');
        const icons = ['🥤', '🍶', '☕'];
        const labels = ['一杯水', '水瓶', '小口'];

        buttons.forEach((button, index) => {
            if (index < this.settings.quickButtons.length) {
                const amount = this.settings.quickButtons[index];
                button.onclick = () => addWater(amount);
                button.innerHTML = `
                    <span class="icon">${icons[index]}</span>
                    <span>${labels[index]}<br>${amount}ml</span>
                `;
            }
        });
    }

    /**
     * 顯示設定面板
     */
    show() {
        if (this.isVisible) return;

        this.createPanel();
        this.isVisible = true;
    }

    /**
     * 隱藏設定面板
     */
    hide() {
        if (!this.isVisible || !this.panel) return;

        this.panel.style.animation = 'fadeOut 0.3s ease-out';
        setTimeout(() => {
            if (this.panel && this.panel.parentNode) {
                this.panel.parentNode.removeChild(this.panel);
            }
            this.panel = null;
            this.isVisible = false;
        }, 300);
    }

    /**
     * 創建設定面板UI
     */
    createPanel() {
        // 創建遮罩
        this.panel = document.createElement('div');
        this.panel.className = 'settings-overlay';
        this.panel.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 9998;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-in;
            overflow-y: auto;
            padding: 20px;
        `;

        // 創建內容框
        const content = document.createElement('div');
        content.className = 'settings-content';
        content.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 32px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            position: relative;
            animation: slideUp 0.4s ease-out;
            max-height: 90vh;
            overflow-y: auto;
        `;

        content.innerHTML = this.getSettingsHTML();
        this.panel.appendChild(content);
        document.body.appendChild(this.panel);

        // 綁定事件
        this.bindEvents();

        // 點擊遮罩關閉
        this.panel.addEventListener('click', (e) => {
            if (e.target === this.panel) {
                this.hide();
            }
        });
    }

    /**
     * 獲取設定面板HTML
     */
    getSettingsHTML() {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="margin: 0; color: #333;">⚙️ 設定</h2>
                <button onclick="settingsPanel.hide()" style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">✕</button>
            </div>

            <!-- 每日目標設定 -->
            <div class="settings-section" style="margin-bottom: 24px;">
                <h3 style="color: #0984e3; margin-bottom: 12px;">💧 每日飲水目標</h3>
                <div style="display: flex; align-items: center; gap: 12px;">
                    <input type="range" id="dailyGoalSlider" min="1000" max="5000" step="100" value="${this.settings.dailyGoal}" 
                           style="flex: 1; height: 8px; border-radius: 4px;">
                    <input type="number" id="dailyGoalInput" min="1000" max="5000" step="100" value="${this.settings.dailyGoal}"
                           style="width: 100px; padding: 8px; border: 2px solid #ddd; border-radius: 8px; font-size: 1em;">
                    <span style="color: #666;">ml</span>
                </div>
            </div>

            <!-- 快速按鈕設定 -->
            <div class="settings-section" style="margin-bottom: 24px;">
                <h3 style="color: #0984e3; margin-bottom: 12px;">🎯 快速按鈕水量</h3>
                <div style="display: grid; gap: 12px;">
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="width: 80px; color: #666;">按鈕 1:</span>
                        <input type="number" id="quickBtn1" min="50" max="1000" step="50" value="${this.settings.quickButtons[0]}"
                               style="flex: 1; padding: 8px; border: 2px solid #ddd; border-radius: 8px; font-size: 1em;">
                        <span style="color: #666;">ml</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="width: 80px; color: #666;">按鈕 2:</span>
                        <input type="number" id="quickBtn2" min="50" max="1000" step="50" value="${this.settings.quickButtons[1]}"
                               style="flex: 1; padding: 8px; border: 2px solid #ddd; border-radius: 8px; font-size: 1em;">
                        <span style="color: #666;">ml</span>
                    </div>
                    <div style="display: flex; align-items: center; gap: 12px;">
                        <span style="width: 80px; color: #666;">按鈕 3:</span>
                        <input type="number" id="quickBtn3" min="50" max="1000" step="50" value="${this.settings.quickButtons[2]}"
                               style="flex: 1; padding: 8px; border: 2px solid #ddd; border-radius: 8px; font-size: 1em;">
                        <span style="color: #666;">ml</span>
                    </div>
                </div>
            </div>

            <!-- 通知設定 -->
            <div class="settings-section" style="margin-bottom: 24px;">
                <h3 style="color: #0984e3; margin-bottom: 12px;">🔔 喝水提醒</h3>
                <div style="display: flex; align-items: center; gap: 12px; margin-bottom: 12px;">
                    <label style="display: flex; align-items: center; gap: 8px; cursor: pointer; flex: 1;">
                        <input type="checkbox" id="notificationsEnabled" ${this.settings.notifications.enabled ? 'checked' : ''}
                               style="width: 20px; height: 20px; cursor: pointer;">
                        <span style="color: #666;">啟用瀏覽器通知</span>
                    </label>
                    <button onclick="notificationSystem && notificationSystem.testNotification()" 
                            style="padding: 6px 12px; border: 1px solid #ddd; background: white; 
                                   border-radius: 8px; cursor: pointer; font-size: 0.85em; color: #666;">
                        測試通知
                    </button>
                </div>
                <div id="notificationSchedule" style="display: ${this.settings.notifications.enabled ? 'block' : 'none'};">
                    <p style="color: #999; font-size: 0.9em; margin-bottom: 8px;">設定提醒時間（最多8個）</p>
                    <div id="scheduleList" style="display: grid; gap: 8px; margin-bottom: 12px;">
                        ${this.getScheduleItemsHTML()}
                    </div>
                    <button onclick="settingsPanel.addScheduleTime()" 
                            style="width: 100%; padding: 10px; border: 2px dashed #ddd; background: white; 
                                   border-radius: 8px; cursor: pointer; color: #666; font-size: 0.9em;"
                            ${this.settings.notifications.schedule.length >= 8 ? 'disabled' : ''}>
                        + 新增提醒時間
                    </button>
                </div>
            </div>

            <!-- 主題設定 -->
            <div class="settings-section" style="margin-bottom: 24px;">
                <h3 style="color: #0984e3; margin-bottom: 12px;">🎨 主題設定</h3>
                <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px;">
                    <button onclick="settingsPanel.setTheme('light')" 
                            class="theme-btn ${this.settings.theme === 'light' ? 'active' : ''}"
                            style="padding: 12px; border: 2px solid ${this.settings.theme === 'light' ? '#0984e3' : '#ddd'}; 
                                   background: white; border-radius: 8px; cursor: pointer; font-size: 0.9em;">
                        ☀️ 淺色
                    </button>
                    <button onclick="settingsPanel.setTheme('dark')" 
                            class="theme-btn ${this.settings.theme === 'dark' ? 'active' : ''}"
                            style="padding: 12px; border: 2px solid ${this.settings.theme === 'dark' ? '#0984e3' : '#ddd'}; 
                                   background: white; border-radius: 8px; cursor: pointer; font-size: 0.9em;">
                        🌙 深色
                    </button>
                    <button onclick="settingsPanel.setTheme('auto')" 
                            class="theme-btn ${this.settings.theme === 'auto' ? 'active' : ''}"
                            style="padding: 12px; border: 2px solid ${this.settings.theme === 'auto' ? '#0984e3' : '#ddd'}; 
                                   background: white; border-radius: 8px; cursor: pointer; font-size: 0.9em;">
                        🔄 自動
                    </button>
                </div>
            </div>

            <!-- 儲存按鈕 -->
            <div style="display: flex; gap: 12px; margin-top: 24px;">
                <button onclick="settingsPanel.hide()" 
                        style="flex: 1; padding: 12px; border: 1px solid #ddd; background: white; 
                               border-radius: 8px; cursor: pointer; font-size: 1em;">
                    取消
                </button>
                <button onclick="settingsPanel.saveAndApply()" 
                        style="flex: 1; padding: 12px; border: none; background: linear-gradient(135deg, #667eea, #764ba2); 
                               color: white; border-radius: 8px; cursor: pointer; font-size: 1em; font-weight: bold;">
                    儲存設定
                </button>
            </div>
        `;
    }

    /**
     * 獲取時間表項目HTML
     */
    getScheduleItemsHTML() {
        if (this.settings.notifications.schedule.length === 0) {
            return '<p style="color: #999; text-align: center; padding: 12px;">尚未設定提醒時間</p>';
        }

        return this.settings.notifications.schedule.map((time, index) => `
            <div style="display: flex; align-items: center; gap: 8px;">
                <input type="time" value="${time}" onchange="settingsPanel.updateScheduleTime(${index}, this.value)"
                       style="flex: 1; padding: 8px; border: 2px solid #ddd; border-radius: 8px; font-size: 1em;">
                <button onclick="settingsPanel.removeScheduleTime(${index})"
                        style="padding: 8px 12px; border: none; background: #ff7675; color: white; 
                               border-radius: 8px; cursor: pointer;">
                    刪除
                </button>
            </div>
        `).join('');
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // 每日目標滑桿和輸入框同步
        const slider = document.getElementById('dailyGoalSlider');
        const input = document.getElementById('dailyGoalInput');

        if (slider && input) {
            slider.addEventListener('input', (e) => {
                input.value = e.target.value;
            });

            input.addEventListener('input', (e) => {
                const value = Math.max(1000, Math.min(5000, parseInt(e.target.value) || 1000));
                slider.value = value;
                e.target.value = value;
            });
        }

        // 通知開關切換
        const notifCheckbox = document.getElementById('notificationsEnabled');
        const scheduleDiv = document.getElementById('notificationSchedule');

        if (notifCheckbox && scheduleDiv) {
            notifCheckbox.addEventListener('change', (e) => {
                scheduleDiv.style.display = e.target.checked ? 'block' : 'none';
            });
        }
    }

    /**
     * 新增提醒時間
     */
    addScheduleTime() {
        if (this.settings.notifications.schedule.length >= 8) {
            alert('最多只能設定8個提醒時間');
            return;
        }

        // 預設時間為下一個整點
        const now = new Date();
        const nextHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours() + 1, 0);
        const timeString = nextHour.toTimeString().slice(0, 5);

        this.settings.notifications.schedule.push(timeString);
        this.refreshScheduleList();
    }

    /**
     * 更新提醒時間
     */
    updateScheduleTime(index, newTime) {
        if (index >= 0 && index < this.settings.notifications.schedule.length) {
            this.settings.notifications.schedule[index] = newTime;
        }
    }

    /**
     * 移除提醒時間
     */
    removeScheduleTime(index) {
        if (index >= 0 && index < this.settings.notifications.schedule.length) {
            this.settings.notifications.schedule.splice(index, 1);
            this.refreshScheduleList();
        }
    }

    /**
     * 刷新時間表列表
     */
    refreshScheduleList() {
        const scheduleList = document.getElementById('scheduleList');
        if (scheduleList) {
            scheduleList.innerHTML = this.getScheduleItemsHTML();
        }

        // 更新新增按鈕狀態
        const addButton = this.panel.querySelector('button[onclick="settingsPanel.addScheduleTime()"]');
        if (addButton) {
            addButton.disabled = this.settings.notifications.schedule.length >= 8;
        }
    }

    /**
     * 設定主題
     */
    setTheme(theme) {
        this.settings.theme = theme;

        // 更新按鈕樣式
        const buttons = this.panel.querySelectorAll('.theme-btn');
        buttons.forEach(btn => {
            btn.style.borderColor = '#ddd';
        });

        const activeBtn = Array.from(buttons).find(btn => 
            btn.textContent.includes(theme === 'light' ? '淺色' : theme === 'dark' ? '深色' : '自動')
        );
        if (activeBtn) {
            activeBtn.style.borderColor = '#0984e3';
        }
    }

    /**
     * 儲存並套用設定
     */
    async saveAndApply() {
        try {
            // 收集設定值
            const dailyGoal = parseInt(document.getElementById('dailyGoalInput').value);
            const quickBtn1 = parseInt(document.getElementById('quickBtn1').value);
            const quickBtn2 = parseInt(document.getElementById('quickBtn2').value);
            const quickBtn3 = parseInt(document.getElementById('quickBtn3').value);
            const notificationsEnabled = document.getElementById('notificationsEnabled').checked;

            // 更新設定物件
            this.settings.dailyGoal = dailyGoal;
            this.settings.quickButtons = [quickBtn1, quickBtn2, quickBtn3];

            // 處理通知設定
            const wasEnabled = this.settings.notifications.enabled;
            this.settings.notifications.enabled = notificationsEnabled;

            // 如果啟用通知且之前未啟用，請求權限
            if (notificationsEnabled && !wasEnabled && notificationSystem) {
                const granted = await notificationSystem.requestPermission();
                if (!granted) {
                    this.settings.notifications.enabled = false;
                    document.getElementById('notificationsEnabled').checked = false;
                    return;
                }
            }

            // 驗證設定
            this.validateSettings(this.settings);

            // 儲存設定
            if (this.saveSettings()) {
                showCelebration('✅ 設定已儲存！');
                this.hide();
            }

        } catch (error) {
            console.error('儲存設定失敗:', error);
            alert(error.message || '儲存設定失敗，請檢查輸入值');
        }
    }
}

// ==================== 通知系統 ====================

class NotificationSystem {
    constructor(settings) {
        this.settings = settings || { enabled: false, schedule: [] };
        this.permission = 'default';
        this.scheduledNotifications = [];
        this.checkIntervals = [];
        this.lastNotificationTime = {};
    }

    /**
     * 初始化通知系統
     */
    async initialize() {
        try {
            // 檢查瀏覽器是否支援通知
            if (!('Notification' in window)) {
                console.warn('此瀏覽器不支援通知功能');
                return false;
            }

            // 獲取當前權限狀態
            this.permission = Notification.permission;

            // 如果已啟用通知且有權限，開始排程
            if (this.settings.enabled && this.permission === 'granted') {
                this.scheduleNotifications();
            }

            return true;

        } catch (error) {
            console.error('初始化通知系統失敗:', error);
            return false;
        }
    }

    /**
     * 請求通知權限
     */
    async requestPermission() {
        try {
            if (!('Notification' in window)) {
                throw new Error('此瀏覽器不支援通知功能');
            }

            if (this.permission === 'granted') {
                return true;
            }

            this.permission = await Notification.requestPermission();

            if (this.permission === 'granted') {
                // 發送測試通知
                this.sendNotification('通知已啟用', '你將會在設定的時間收到喝水提醒 💧');
                return true;
            } else if (this.permission === 'denied') {
                alert('通知權限被拒絕。請在瀏覽器設定中允許通知。');
                return false;
            }

            return false;

        } catch (error) {
            console.error('請求通知權限失敗:', error);
            alert('無法啟用通知功能，請檢查瀏覽器設定');
            return false;
        }
    }

    /**
     * 更新設定
     */
    updateSettings(newSettings) {
        this.settings = newSettings;

        // 清除現有排程
        this.clearScheduledNotifications();

        // 如果啟用通知，重新排程
        if (this.settings.enabled && this.permission === 'granted') {
            this.scheduleNotifications();
        }
    }

    /**
     * 排程通知
     */
    scheduleNotifications() {
        try {
            // 清除現有排程
            this.clearScheduledNotifications();

            if (!this.settings.enabled || this.permission !== 'granted') {
                return;
            }

            // 為每個時間點設定檢查間隔
            this.settings.schedule.forEach(time => {
                this.scheduleNotificationForTime(time);
            });

        } catch (error) {
            console.error('排程通知失敗:', error);
        }
    }

    /**
     * 為特定時間排程通知
     */
    scheduleNotificationForTime(timeString) {
        try {
            // 每分鐘檢查一次是否到達提醒時間
            const intervalId = setInterval(() => {
                const now = new Date();
                const currentTime = now.toTimeString().slice(0, 5); // HH:MM

                // 檢查是否到達提醒時間
                if (currentTime === timeString) {
                    // 檢查是否已在這一分鐘內發送過通知
                    const notifKey = `${timeString}_${now.toDateString()}`;
                    
                    if (!this.lastNotificationTime[notifKey]) {
                        this.sendWaterReminder();
                        this.lastNotificationTime[notifKey] = true;

                        // 清理舊的記錄（保留今天的）
                        const today = now.toDateString();
                        Object.keys(this.lastNotificationTime).forEach(key => {
                            if (!key.endsWith(today)) {
                                delete this.lastNotificationTime[key];
                            }
                        });
                    }
                }
            }, 60000); // 每分鐘檢查一次

            this.checkIntervals.push(intervalId);

            // 立即檢查一次（如果剛好是提醒時間）
            const now = new Date();
            const currentTime = now.toTimeString().slice(0, 5);
            if (currentTime === timeString) {
                const notifKey = `${timeString}_${now.toDateString()}`;
                if (!this.lastNotificationTime[notifKey]) {
                    this.sendWaterReminder();
                    this.lastNotificationTime[notifKey] = true;
                }
            }

        } catch (error) {
            console.error('為時間排程通知失敗:', error);
        }
    }

    /**
     * 清除所有排程的通知
     */
    clearScheduledNotifications() {
        this.checkIntervals.forEach(intervalId => {
            clearInterval(intervalId);
        });
        this.checkIntervals = [];
    }

    /**
     * 發送喝水提醒通知
     */
    sendWaterReminder() {
        const messages = [
            '該喝水囉！💧',
            '記得補充水分喔！🥤',
            '喝水時間到了！💦',
            '別忘了喝水！🌊',
            '來杯水吧！☕'
        ];

        const bodies = [
            '保持水分充足，讓身體更健康！',
            '你的水精靈在等你記錄喝水喔！',
            '定時喝水，養成好習慣！',
            '補充水分，保持活力！',
            '喝水讓你更有精神！'
        ];

        const randomMessage = messages[Math.floor(Math.random() * messages.length)];
        const randomBody = bodies[Math.floor(Math.random() * bodies.length)];

        this.sendNotification(randomMessage, randomBody);
    }

    /**
     * 發送通知
     */
    sendNotification(title, body, icon = '💧') {
        try {
            if (this.permission !== 'granted') {
                console.warn('沒有通知權限');
                return;
            }

            const notification = new Notification(title, {
                body: body,
                icon: icon,
                badge: icon,
                tag: 'water-reminder',
                requireInteraction: false,
                silent: false
            });

            // 點擊通知時聚焦到應用程式
            notification.onclick = () => {
                window.focus();
                notification.close();
            };

            // 自動關閉通知
            setTimeout(() => {
                notification.close();
            }, 10000);

        } catch (error) {
            console.error('發送通知失敗:', error);
        }
    }

    /**
     * 測試通知
     */
    testNotification() {
        if (this.permission !== 'granted') {
            alert('請先允許通知權限');
            return;
        }

        this.sendNotification('測試通知', '如果你看到這個通知，表示通知功能正常運作！💧');
    }

    /**
     * 停用通知系統
     */
    disable() {
        this.clearScheduledNotifications();
        this.settings.enabled = false;
    }

    /**
     * 啟用通知系統
     */
    async enable() {
        if (this.permission !== 'granted') {
            const granted = await this.requestPermission();
            if (!granted) {
                return false;
            }
        }

        this.settings.enabled = true;
        this.scheduleNotifications();
        return true;
    }
}

// ==================== 主題系統 ====================

class ThemeSystem {
    constructor() {
        this.currentTheme = 'auto';
        this.prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
    }

    /**
     * 初始化主題系統
     */
    initialize(savedTheme = 'auto') {
        try {
            this.currentTheme = savedTheme;

            // 監聽系統主題變化
            this.prefersDarkScheme.addEventListener('change', (e) => {
                if (this.currentTheme === 'auto') {
                    this.applyTheme('auto');
                }
            });

            // 套用主題
            this.applyTheme(this.currentTheme);

            return true;

        } catch (error) {
            console.error('初始化主題系統失敗:', error);
            return false;
        }
    }

    /**
     * 套用主題
     */
    applyTheme(theme) {
        try {
            this.currentTheme = theme;

            let isDark = false;

            switch (theme) {
                case 'light':
                    isDark = false;
                    break;
                case 'dark':
                    isDark = true;
                    break;
                case 'auto':
                    isDark = this.prefersDarkScheme.matches;
                    break;
                default:
                    isDark = false;
            }

            // 套用主題到 body
            if (isDark) {
                document.body.classList.add('dark-theme');
                document.body.classList.remove('light-theme');
            } else {
                document.body.classList.add('light-theme');
                document.body.classList.remove('dark-theme');
            }

            // 儲存主題偏好
            this.saveThemePreference(theme);

        } catch (error) {
            console.error('套用主題失敗:', error);
        }
    }

    /**
     * 儲存主題偏好
     */
    saveThemePreference(theme) {
        try {
            localStorage.setItem('themePreference', theme);
        } catch (error) {
            console.error('儲存主題偏好失敗:', error);
        }
    }

    /**
     * 載入主題偏好
     */
    loadThemePreference() {
        try {
            return localStorage.getItem('themePreference') || 'auto';
        } catch (error) {
            console.error('載入主題偏好失敗:', error);
            return 'auto';
        }
    }

    /**
     * 切換主題
     */
    toggleTheme() {
        const themes = ['light', 'dark', 'auto'];
        const currentIndex = themes.indexOf(this.currentTheme);
        const nextIndex = (currentIndex + 1) % themes.length;
        this.applyTheme(themes[nextIndex]);
    }

    /**
     * 獲取當前主題
     */
    getCurrentTheme() {
        return this.currentTheme;
    }

    /**
     * 檢查是否為深色模式
     */
    isDarkMode() {
        return document.body.classList.contains('dark-theme');
    }
}

// ==================== 統計儀表板系統 ====================

class DashboardSystem {
    constructor(appState) {
        this.appState = appState;
        this.currentView = 'daily'; // 'daily', 'weekly', 'monthly'
        this.cache = {
            daily: null,
            weekly: null,
            monthly: null,
            lastUpdate: null
        };
        this.cacheTimeout = 60000; // 快取1分鐘
    }

    /**
     * 切換檢視
     */
    switchView(viewType) {
        if (['daily', 'weekly', 'monthly'].includes(viewType)) {
            this.currentView = viewType;
            this.renderCurrentView();
        }
    }

    /**
     * 渲染當前檢視
     */
    renderCurrentView() {
        const stats = this.getStats(this.currentView);
        
        switch (this.currentView) {
            case 'daily':
                this.renderDailyView(stats);
                break;
            case 'weekly':
                this.renderWeeklyView(stats);
                break;
            case 'monthly':
                this.renderMonthlyView(stats);
                break;
        }
    }

    /**
     * 獲取統計數據（帶快取）
     */
    getStats(period) {
        const now = Date.now();
        
        // 檢查快取是否有效
        if (this.cache[period] && this.cache.lastUpdate && 
            (now - this.cache.lastUpdate) < this.cacheTimeout) {
            return this.cache[period];
        }

        // 計算新的統計數據
        const stats = this.calculateStats(period);
        
        // 更新快取
        this.cache[period] = stats;
        this.cache.lastUpdate = now;
        
        return stats;
    }

    /**
     * 計算統計數據
     */
    calculateStats(period) {
        const gameData = this.appState.getGameData();
        
        switch (period) {
            case 'daily':
                return this.calculateDailyStats(gameData);
            case 'weekly':
                return this.calculateWeeklyStats(gameData);
            case 'monthly':
                return this.calculateMonthlyStats(gameData);
            default:
                return null;
        }
    }

    /**
     * 計算每日統計
     */
    calculateDailyStats(gameData) {
        const today = new Date().toDateString();
        
        return {
            date: today,
            totalAmount: gameData.todayAmount,
            goal: gameData.dailyGoal,
            progress: Math.min((gameData.todayAmount / gameData.dailyGoal) * 100, 100),
            goalAchieved: gameData.todayAmount >= gameData.dailyGoal,
            entries: gameData.history || [],
            entryCount: (gameData.history || []).length,
            averagePerEntry: (gameData.history || []).length > 0 
                ? Math.round(gameData.todayAmount / gameData.history.length) 
                : 0,
            remainingAmount: Math.max(0, gameData.dailyGoal - gameData.todayAmount)
        };
    }

    /**
     * 計算每週統計
     */
    calculateWeeklyStats(gameData) {
        // 獲取本週數據（從週一到今天）
        const weekData = this.getWeekData();
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=週日, 1=週一, ...
        const daysInWeek = dayOfWeek === 0 ? 7 : dayOfWeek; // 週日算作第7天
        
        // 計算本週總量和平均值
        const weekTotal = weekData.reduce((sum, day) => sum + day.amount, 0);
        const weekAverage = daysInWeek > 0 ? Math.round(weekTotal / daysInWeek) : 0;
        
        // 計算達標天數
        const goalsAchieved = weekData.filter(day => day.amount >= gameData.dailyGoal).length;
        const goalRate = daysInWeek > 0 ? Math.round((goalsAchieved / daysInWeek) * 100) : 0;
        
        // 計算趨勢（與上週比較）
        const trend = this.calculateTrend(weekData);
        
        return {
            weekData: weekData,
            totalAmount: weekTotal,
            averageDaily: weekAverage,
            goalsAchieved: goalsAchieved,
            goalAchievementRate: goalRate,
            daysTracked: daysInWeek,
            trend: trend,
            bestDay: this.getBestDay(weekData),
            worstDay: this.getWorstDay(weekData)
        };
    }

    /**
     * 計算每月統計
     */
    calculateMonthlyStats(gameData) {
        // 獲取本月數據
        const monthData = this.getMonthData();
        const today = new Date();
        const dayOfMonth = today.getDate();
        
        // 計算本月總量和平均值
        const monthTotal = monthData.reduce((sum, day) => sum + day.amount, 0);
        const monthAverage = dayOfMonth > 0 ? Math.round(monthTotal / dayOfMonth) : 0;
        
        // 計算達標天數
        const goalsAchieved = monthData.filter(day => day.amount >= gameData.dailyGoal).length;
        const goalRate = dayOfMonth > 0 ? Math.round((goalsAchieved / dayOfMonth) * 100) : 0;
        
        // 計算最佳連續達標天數
        const bestStreak = this.calculateBestStreak(monthData, gameData.dailyGoal);
        
        // 計算月度成長趨勢
        const growthTrend = this.calculateMonthlyGrowth(monthData);
        
        return {
            monthData: monthData,
            totalAmount: monthTotal,
            averageDaily: monthAverage,
            goalsAchieved: goalsAchieved,
            goalAchievementRate: goalRate,
            daysTracked: dayOfMonth,
            bestStreak: bestStreak,
            growthTrend: growthTrend,
            bestDay: this.getBestDay(monthData),
            worstDay: this.getWorstDay(monthData),
            projectedMonthTotal: this.projectMonthTotal(monthAverage)
        };
    }

    /**
     * 獲取本週數據
     */
    getWeekData() {
        const today = new Date();
        const dayOfWeek = today.getDay(); // 0=週日, 1=週一, ...
        const mondayOffset = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // 計算到週一的天數
        
        const weekData = [];
        const gameData = this.appState.getGameData();
        
        // 從週一到今天
        for (let i = mondayOffset; i >= 0; i--) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            
            const dateStr = date.toDateString();
            const dayName = ['週日', '週一', '週二', '週三', '週四', '週五', '週六'][date.getDay()];
            
            // 如果是今天，使用當前數據
            if (dateStr === today.toDateString()) {
                weekData.push({
                    date: dateStr,
                    dayName: dayName,
                    amount: gameData.todayAmount,
                    isToday: true
                });
            } else {
                // 從 localStorage 獲取歷史數據（如果有的話）
                const historicalAmount = this.getHistoricalAmount(dateStr);
                weekData.push({
                    date: dateStr,
                    dayName: dayName,
                    amount: historicalAmount,
                    isToday: false
                });
            }
        }
        
        return weekData;
    }

    /**
     * 獲取本月數據
     */
    getMonthData() {
        const today = new Date();
        const dayOfMonth = today.getDate();
        
        const monthData = [];
        const gameData = this.appState.getGameData();
        
        // 從本月1號到今天
        for (let i = 1; i <= dayOfMonth; i++) {
            const date = new Date(today.getFullYear(), today.getMonth(), i);
            const dateStr = date.toDateString();
            
            // 如果是今天，使用當前數據
            if (dateStr === today.toDateString()) {
                monthData.push({
                    date: dateStr,
                    day: i,
                    amount: gameData.todayAmount,
                    isToday: true
                });
            } else {
                // 從 localStorage 獲取歷史數據
                const historicalAmount = this.getHistoricalAmount(dateStr);
                monthData.push({
                    date: dateStr,
                    day: i,
                    amount: historicalAmount,
                    isToday: false
                });
            }
        }
        
        return monthData;
    }

    /**
     * 獲取歷史數據（從 localStorage）
     */
    getHistoricalAmount(dateStr) {
        try {
            const key = `waterHistory_${dateStr}`;
            const saved = localStorage.getItem(key);
            return saved ? parseInt(saved) : 0;
        } catch (error) {
            console.error('獲取歷史數據失敗:', error);
            return 0;
        }
    }

    /**
     * 儲存今日數據到歷史記錄
     */
    saveHistoricalData() {
        try {
            const today = new Date().toDateString();
            const gameData = this.appState.getGameData();
            const key = `waterHistory_${today}`;
            localStorage.setItem(key, gameData.todayAmount.toString());
        } catch (error) {
            console.error('儲存歷史數據失敗:', error);
        }
    }

    /**
     * 計算趨勢
     */
    calculateTrend(data) {
        if (data.length < 2) return 'stable';
        
        // 計算前半段和後半段的平均值
        const midPoint = Math.floor(data.length / 2);
        const firstHalf = data.slice(0, midPoint);
        const secondHalf = data.slice(midPoint);
        
        const firstAvg = firstHalf.reduce((sum, d) => sum + d.amount, 0) / firstHalf.length;
        const secondAvg = secondHalf.reduce((sum, d) => sum + d.amount, 0) / secondHalf.length;
        
        const change = ((secondAvg - firstAvg) / firstAvg) * 100;
        
        if (change > 10) return 'increasing';
        if (change < -10) return 'decreasing';
        return 'stable';
    }

    /**
     * 計算最佳連續達標天數
     */
    calculateBestStreak(data, dailyGoal) {
        let currentStreak = 0;
        let bestStreak = 0;
        
        data.forEach(day => {
            if (day.amount >= dailyGoal) {
                currentStreak++;
                bestStreak = Math.max(bestStreak, currentStreak);
            } else {
                currentStreak = 0;
            }
        });
        
        return bestStreak;
    }

    /**
     * 計算月度成長趨勢
     */
    calculateMonthlyGrowth(data) {
        if (data.length < 7) return 'insufficient_data';
        
        // 比較第一週和最後一週的平均值
        const firstWeek = data.slice(0, 7);
        const lastWeekStart = Math.max(0, data.length - 7);
        const lastWeek = data.slice(lastWeekStart);
        
        const firstWeekAvg = firstWeek.reduce((sum, d) => sum + d.amount, 0) / firstWeek.length;
        const lastWeekAvg = lastWeek.reduce((sum, d) => sum + d.amount, 0) / lastWeek.length;
        
        const growthRate = ((lastWeekAvg - firstWeekAvg) / firstWeekAvg) * 100;
        
        return {
            rate: Math.round(growthRate),
            direction: growthRate > 5 ? 'improving' : growthRate < -5 ? 'declining' : 'stable'
        };
    }

    /**
     * 獲取最佳日
     */
    getBestDay(data) {
        if (data.length === 0) return null;
        
        return data.reduce((best, current) => 
            current.amount > best.amount ? current : best
        );
    }

    /**
     * 獲取最差日
     */
    getWorstDay(data) {
        if (data.length === 0) return null;
        
        // 只考慮有記錄的日子
        const daysWithData = data.filter(d => d.amount > 0);
        if (daysWithData.length === 0) return null;
        
        return daysWithData.reduce((worst, current) => 
            current.amount < worst.amount ? current : worst
        );
    }

    /**
     * 預測本月總量
     */
    projectMonthTotal(dailyAverage) {
        const today = new Date();
        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        return Math.round(dailyAverage * daysInMonth);
    }

    /**
     * 計算達標率
     */
    calculateGoalRate(data, dailyGoal) {
        if (data.length === 0) return 0;
        
        const goalsAchieved = data.filter(day => day.amount >= dailyGoal).length;
        return Math.round((goalsAchieved / data.length) * 100);
    }

    /**
     * 清除快取
     */
    clearCache() {
        this.cache = {
            daily: null,
            weekly: null,
            monthly: null,
            lastUpdate: null
        };
    }

    /**
     * 渲染每日檢視
     */
    renderDailyView(stats) {
        console.log('每日統計:', stats);
        
        // 準備圖表數據 - 顯示今日每次喝水記錄
        if (stats.entries && stats.entries.length > 0 && chartRenderer) {
            const chartData = stats.entries.slice(0, 10).reverse().map(entry => ({
                label: entry.time,
                value: entry.amount
            }));

            // 如果有畫布元素，繪製長條圖
            const canvas = document.getElementById('dailyChart');
            if (canvas) {
                chartRenderer.drawBarChart(canvas, chartData, {
                    title: '今日飲水記錄',
                    yLabel: '水量 (ml)',
                    xLabel: '時間',
                    showValues: true
                });
            }
        }
    }

    /**
     * 渲染每週檢視
     */
    renderWeeklyView(stats) {
        console.log('每週統計:', stats);
        
        // 準備圖表數據 - 顯示本週每日總量
        if (stats.weekData && stats.weekData.length > 0 && chartRenderer) {
            const chartData = stats.weekData.map(day => ({
                label: day.dayName,
                value: day.amount
            }));

            // 繪製長條圖
            const barCanvas = document.getElementById('weeklyBarChart');
            if (barCanvas) {
                const gameData = this.appState.getGameData();
                chartRenderer.drawBarChart(barCanvas, chartData, {
                    title: '本週飲水趨勢',
                    yLabel: '水量 (ml)',
                    xLabel: '日期',
                    showValues: true,
                    maxValue: gameData.dailyGoal * 1.2
                });
            }

            // 繪製折線圖
            const lineCanvas = document.getElementById('weeklyLineChart');
            if (lineCanvas) {
                chartRenderer.drawLineChart(lineCanvas, chartData, {
                    title: '本週飲水趨勢',
                    yLabel: '水量 (ml)',
                    xLabel: '日期',
                    showPoints: true,
                    showArea: true
                });
            }
        }
    }

    /**
     * 渲染每月檢視
     */
    renderMonthlyView(stats) {
        console.log('每月統計:', stats);
        
        // 準備圖表數據 - 顯示本月每日總量
        if (stats.monthData && stats.monthData.length > 0 && chartRenderer) {
            // 長條圖數據
            const chartData = stats.monthData.map(day => ({
                label: `${day.day}日`,
                value: day.amount
            }));

            // 繪製長條圖
            const barCanvas = document.getElementById('monthlyBarChart');
            if (barCanvas) {
                const gameData = this.appState.getGameData();
                chartRenderer.drawBarChart(barCanvas, chartData, {
                    title: '本月飲水記錄',
                    yLabel: '水量 (ml)',
                    xLabel: '日期',
                    showValues: false, // 太多數據點，不顯示數值
                    maxValue: gameData.dailyGoal * 1.2
                });
            }

            // 準備圓餅圖數據 - 達標 vs 未達標
            const gameData = this.appState.getGameData();
            const pieData = [
                {
                    label: '已達標',
                    value: stats.goalsAchieved
                },
                {
                    label: '未達標',
                    value: stats.daysTracked - stats.goalsAchieved
                }
            ];

            // 繪製圓餅圖
            const pieCanvas = document.getElementById('monthlyPieChart');
            if (pieCanvas) {
                chartRenderer.drawPieChart(pieCanvas, pieData, {
                    title: '本月達標率',
                    showLabels: true,
                    showPercentages: true,
                    colors: ['#00b894', '#dfe6e9']
                });
            }
        }
    }

    /**
     * 獲取統計摘要（用於顯示）
     */
    getStatsSummary(period = 'daily') {
        const stats = this.getStats(period);
        
        switch (period) {
            case 'daily':
                return {
                    title: '今日統計',
                    mainValue: `${stats.totalAmount}ml`,
                    subValue: `目標: ${stats.goal}ml`,
                    progress: stats.progress,
                    status: stats.goalAchieved ? '已達標' : '進行中'
                };
            
            case 'weekly':
                return {
                    title: '本週統計',
                    mainValue: `${stats.totalAmount}ml`,
                    subValue: `平均: ${stats.averageDaily}ml/天`,
                    progress: stats.goalAchievementRate,
                    status: `${stats.goalsAchieved}/${stats.daysTracked} 天達標`
                };
            
            case 'monthly':
                return {
                    title: '本月統計',
                    mainValue: `${stats.totalAmount}ml`,
                    subValue: `平均: ${stats.averageDaily}ml/天`,
                    progress: stats.goalAchievementRate,
                    status: `${stats.goalsAchieved}/${stats.daysTracked} 天達標`
                };
            
            default:
                return null;
        }
    }

    /**
     * 顯示儀表板面板
     */
    showDashboard() {
        // 創建儀表板面板 UI
        const overlay = document.createElement('div');
        overlay.className = 'dashboard-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 9998;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-in;
            overflow-y: auto;
            padding: 20px;
        `;

        const content = document.createElement('div');
        content.className = 'dashboard-content';
        content.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 32px;
            max-width: 900px;
            width: 100%;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            position: relative;
            animation: slideUp 0.4s ease-out;
            max-height: 90vh;
            overflow-y: auto;
        `;

        content.innerHTML = this.getDashboardHTML();
        overlay.appendChild(content);
        document.body.appendChild(overlay);

        // 綁定事件
        this.bindDashboardEvents(overlay);

        // 點擊遮罩關閉
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideDashboard(overlay);
            }
        });

        // 初始化圖表
        setTimeout(() => {
            this.renderCurrentView();
        }, 100);
    }

    /**
     * 隱藏儀表板面板
     */
    hideDashboard(overlay) {
        if (overlay) {
            overlay.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    }

    /**
     * 獲取儀表板 HTML
     */
    getDashboardHTML() {
        const summary = this.getStatsSummary(this.currentView);
        
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="margin: 0; color: #333;">📊 統計儀表板</h2>
                <button onclick="dashboardSystem.hideDashboard(document.querySelector('.dashboard-overlay'))" 
                        style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">✕</button>
            </div>

            <!-- 檢視切換按鈕 -->
            <div style="display: flex; gap: 12px; margin-bottom: 24px; justify-content: center;">
                <button onclick="dashboardSystem.switchView('daily')" 
                        class="view-btn ${this.currentView === 'daily' ? 'active' : ''}"
                        style="padding: 10px 20px; border: 2px solid ${this.currentView === 'daily' ? '#0984e3' : '#ddd'}; 
                               background: ${this.currentView === 'daily' ? '#0984e3' : 'white'}; 
                               color: ${this.currentView === 'daily' ? 'white' : '#666'};
                               border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.3s;">
                    📅 每日
                </button>
                <button onclick="dashboardSystem.switchView('weekly')" 
                        class="view-btn ${this.currentView === 'weekly' ? 'active' : ''}"
                        style="padding: 10px 20px; border: 2px solid ${this.currentView === 'weekly' ? '#0984e3' : '#ddd'}; 
                               background: ${this.currentView === 'weekly' ? '#0984e3' : 'white'}; 
                               color: ${this.currentView === 'weekly' ? 'white' : '#666'};
                               border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.3s;">
                    📆 每週
                </button>
                <button onclick="dashboardSystem.switchView('monthly')" 
                        class="view-btn ${this.currentView === 'monthly' ? 'active' : ''}"
                        style="padding: 10px 20px; border: 2px solid ${this.currentView === 'monthly' ? '#0984e3' : '#ddd'}; 
                               background: ${this.currentView === 'monthly' ? '#0984e3' : 'white'}; 
                               color: ${this.currentView === 'monthly' ? 'white' : '#666'};
                               border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.3s;">
                    📊 每月
                </button>
            </div>

            <!-- 統計摘要卡片 -->
            <div style="background: linear-gradient(135deg, #667eea, #764ba2); color: white; padding: 24px; 
                        border-radius: 12px; margin-bottom: 24px; text-align: center;">
                <h3 style="margin: 0 0 8px 0; font-size: 1.2em;">${summary.title}</h3>
                <div style="font-size: 2.5em; font-weight: bold; margin: 12px 0;">${summary.mainValue}</div>
                <div style="font-size: 1.1em; opacity: 0.9;">${summary.subValue}</div>
                <div style="margin-top: 12px; font-size: 1em; opacity: 0.9;">${summary.status}</div>
            </div>

            <!-- 圖表容器 -->
            <div id="chartContainer" style="margin-top: 24px;">
                ${this.getChartContainerHTML()}
            </div>
        `;
    }

    /**
     * 獲取圖表容器 HTML
     */
    getChartContainerHTML() {
        switch (this.currentView) {
            case 'daily':
                return `
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 12px;">
                        <canvas id="dailyChart" width="800" height="400" 
                                style="max-width: 100%; height: auto;"></canvas>
                    </div>
                `;
            
            case 'weekly':
                return `
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                        <canvas id="weeklyBarChart" width="800" height="400" 
                                style="max-width: 100%; height: auto;"></canvas>
                    </div>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 12px;">
                        <canvas id="weeklyLineChart" width="800" height="400" 
                                style="max-width: 100%; height: auto;"></canvas>
                    </div>
                `;
            
            case 'monthly':
                return `
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 12px; margin-bottom: 20px;">
                        <canvas id="monthlyBarChart" width="800" height="400" 
                                style="max-width: 100%; height: auto;"></canvas>
                    </div>
                    <div style="background: #f8f9fa; padding: 20px; border-radius: 12px;">
                        <canvas id="monthlyPieChart" width="400" height="400" 
                                style="max-width: 100%; height: auto; margin: 0 auto; display: block;"></canvas>
                    </div>
                `;
            
            default:
                return '';
        }
    }

    /**
     * 綁定儀表板事件
     */
    bindDashboardEvents(overlay) {
        // 檢視切換按鈕已經通過 onclick 綁定
        // 這裡可以添加其他互動事件
    }
}

// ==================== 圖表繪製系統 ====================

class ChartRenderer {
    constructor() {
        this.colors = {
            primary: '#0984e3',
            secondary: '#74b9ff',
            success: '#00b894',
            warning: '#fdcb6e',
            danger: '#d63031',
            text: '#2d3436',
            grid: '#dfe6e9'
        };
        this.padding = 40;
        this.fontSize = 12;
    }

    /**
     * 繪製長條圖
     */
    drawBarChart(canvas, data, options = {}) {
        if (!canvas || !data || data.length === 0) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // 清除畫布
        ctx.clearRect(0, 0, width, height);

        // 設定選項
        const {
            title = '',
            xLabel = '',
            yLabel = '',
            showValues = true,
            barColor = this.colors.primary,
            maxValue = null
        } = options;

        // 計算繪圖區域
        const chartWidth = width - this.padding * 2;
        const chartHeight = height - this.padding * 2;
        const barWidth = chartWidth / data.length * 0.7;
        const barSpacing = chartWidth / data.length * 0.3;

        // 找出最大值
        const max = maxValue || Math.max(...data.map(d => d.value));
        const scale = chartHeight / (max * 1.1); // 留10%空間

        // 繪製標題
        if (title) {
            ctx.font = `bold ${this.fontSize + 2}px Arial`;
            ctx.fillStyle = this.colors.text;
            ctx.textAlign = 'center';
            ctx.fillText(title, width / 2, 20);
        }

        // 繪製座標軸
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;
        
        // Y軸
        ctx.beginPath();
        ctx.moveTo(this.padding, this.padding);
        ctx.lineTo(this.padding, height - this.padding);
        ctx.stroke();

        // X軸
        ctx.beginPath();
        ctx.moveTo(this.padding, height - this.padding);
        ctx.lineTo(width - this.padding, height - this.padding);
        ctx.stroke();

        // 繪製Y軸刻度和網格線
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const y = height - this.padding - (chartHeight / ySteps * i);
            const value = Math.round(max / ySteps * i);

            // 網格線
            ctx.strokeStyle = this.colors.grid;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(this.padding, y);
            ctx.lineTo(width - this.padding, y);
            ctx.stroke();
            ctx.globalAlpha = 1;

            // 刻度標籤
            ctx.font = `${this.fontSize}px Arial`;
            ctx.fillStyle = this.colors.text;
            ctx.textAlign = 'right';
            ctx.fillText(value, this.padding - 5, y + 4);
        }

        // 繪製長條
        data.forEach((item, index) => {
            const x = this.padding + (barWidth + barSpacing) * index + barSpacing / 2;
            const barHeight = item.value * scale;
            const y = height - this.padding - barHeight;

            // 繪製長條
            const gradient = ctx.createLinearGradient(x, y, x, height - this.padding);
            gradient.addColorStop(0, barColor);
            gradient.addColorStop(1, this.colors.secondary);

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, barWidth, barHeight);

            // 繪製長條邊框
            ctx.strokeStyle = barColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, barWidth, barHeight);

            // 繪製數值
            if (showValues && item.value > 0) {
                ctx.font = `bold ${this.fontSize}px Arial`;
                ctx.fillStyle = this.colors.text;
                ctx.textAlign = 'center';
                ctx.fillText(item.value, x + barWidth / 2, y - 5);
            }

            // 繪製X軸標籤
            ctx.font = `${this.fontSize}px Arial`;
            ctx.fillStyle = this.colors.text;
            ctx.textAlign = 'center';
            ctx.save();
            ctx.translate(x + barWidth / 2, height - this.padding + 15);
            if (item.label.length > 4) {
                ctx.rotate(-Math.PI / 6); // 旋轉30度
            }
            ctx.fillText(item.label, 0, 0);
            ctx.restore();
        });

        // 繪製軸標籤
        if (yLabel) {
            ctx.font = `${this.fontSize}px Arial`;
            ctx.fillStyle = this.colors.text;
            ctx.textAlign = 'center';
            ctx.save();
            ctx.translate(15, height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(yLabel, 0, 0);
            ctx.restore();
        }

        if (xLabel) {
            ctx.font = `${this.fontSize}px Arial`;
            ctx.fillStyle = this.colors.text;
            ctx.textAlign = 'center';
            ctx.fillText(xLabel, width / 2, height - 5);
        }
    }

    /**
     * 繪製折線圖
     */
    drawLineChart(canvas, data, options = {}) {
        if (!canvas || !data || data.length === 0) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // 清除畫布
        ctx.clearRect(0, 0, width, height);

        // 設定選項
        const {
            title = '',
            xLabel = '',
            yLabel = '',
            showPoints = true,
            showArea = true,
            lineColor = this.colors.primary,
            maxValue = null
        } = options;

        // 計算繪圖區域
        const chartWidth = width - this.padding * 2;
        const chartHeight = height - this.padding * 2;

        // 找出最大值
        const max = maxValue || Math.max(...data.map(d => d.value));
        const scale = chartHeight / (max * 1.1);

        // 繪製標題
        if (title) {
            ctx.font = `bold ${this.fontSize + 2}px Arial`;
            ctx.fillStyle = this.colors.text;
            ctx.textAlign = 'center';
            ctx.fillText(title, width / 2, 20);
        }

        // 繪製座標軸
        ctx.strokeStyle = this.colors.grid;
        ctx.lineWidth = 1;
        
        // Y軸
        ctx.beginPath();
        ctx.moveTo(this.padding, this.padding);
        ctx.lineTo(this.padding, height - this.padding);
        ctx.stroke();

        // X軸
        ctx.beginPath();
        ctx.moveTo(this.padding, height - this.padding);
        ctx.lineTo(width - this.padding, height - this.padding);
        ctx.stroke();

        // 繪製Y軸刻度和網格線
        const ySteps = 5;
        for (let i = 0; i <= ySteps; i++) {
            const y = height - this.padding - (chartHeight / ySteps * i);
            const value = Math.round(max / ySteps * i);

            // 網格線
            ctx.strokeStyle = this.colors.grid;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.moveTo(this.padding, y);
            ctx.lineTo(width - this.padding, y);
            ctx.stroke();
            ctx.globalAlpha = 1;

            // 刻度標籤
            ctx.font = `${this.fontSize}px Arial`;
            ctx.fillStyle = this.colors.text;
            ctx.textAlign = 'right';
            ctx.fillText(value, this.padding - 5, y + 4);
        }

        // 計算點的位置
        const points = data.map((item, index) => {
            const x = this.padding + (chartWidth / (data.length - 1)) * index;
            const y = height - this.padding - (item.value * scale);
            return { x, y, value: item.value, label: item.label };
        });

        // 繪製填充區域
        if (showArea) {
            ctx.beginPath();
            ctx.moveTo(points[0].x, height - this.padding);
            points.forEach(point => {
                ctx.lineTo(point.x, point.y);
            });
            ctx.lineTo(points[points.length - 1].x, height - this.padding);
            ctx.closePath();

            const gradient = ctx.createLinearGradient(0, this.padding, 0, height - this.padding);
            gradient.addColorStop(0, lineColor + '40'); // 25% 透明度
            gradient.addColorStop(1, lineColor + '10'); // 6% 透明度
            ctx.fillStyle = gradient;
            ctx.fill();
        }

        // 繪製折線
        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        points.forEach(point => {
            ctx.lineTo(point.x, point.y);
        });
        ctx.strokeStyle = lineColor;
        ctx.lineWidth = 3;
        ctx.stroke();

        // 繪製數據點
        if (showPoints) {
            points.forEach(point => {
                // 外圈
                ctx.beginPath();
                ctx.arc(point.x, point.y, 6, 0, Math.PI * 2);
                ctx.fillStyle = 'white';
                ctx.fill();
                ctx.strokeStyle = lineColor;
                ctx.lineWidth = 3;
                ctx.stroke();

                // 內圈
                ctx.beginPath();
                ctx.arc(point.x, point.y, 3, 0, Math.PI * 2);
                ctx.fillStyle = lineColor;
                ctx.fill();
            });
        }

        // 繪製X軸標籤
        points.forEach(point => {
            ctx.font = `${this.fontSize}px Arial`;
            ctx.fillStyle = this.colors.text;
            ctx.textAlign = 'center';
            ctx.save();
            ctx.translate(point.x, height - this.padding + 15);
            if (point.label.length > 4) {
                ctx.rotate(-Math.PI / 6);
            }
            ctx.fillText(point.label, 0, 0);
            ctx.restore();
        });

        // 繪製軸標籤
        if (yLabel) {
            ctx.font = `${this.fontSize}px Arial`;
            ctx.fillStyle = this.colors.text;
            ctx.textAlign = 'center';
            ctx.save();
            ctx.translate(15, height / 2);
            ctx.rotate(-Math.PI / 2);
            ctx.fillText(yLabel, 0, 0);
            ctx.restore();
        }

        if (xLabel) {
            ctx.font = `${this.fontSize}px Arial`;
            ctx.fillStyle = this.colors.text;
            ctx.textAlign = 'center';
            ctx.fillText(xLabel, width / 2, height - 5);
        }
    }

    /**
     * 繪製圓餅圖
     */
    drawPieChart(canvas, data, options = {}) {
        if (!canvas || !data || data.length === 0) return;

        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;

        // 清除畫布
        ctx.clearRect(0, 0, width, height);

        // 設定選項
        const {
            title = '',
            showLabels = true,
            showPercentages = true,
            colors = [
                this.colors.primary,
                this.colors.success,
                this.colors.warning,
                this.colors.danger,
                this.colors.secondary
            ]
        } = options;

        // 計算總值
        const total = data.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) return;

        // 繪製標題
        if (title) {
            ctx.font = `bold ${this.fontSize + 2}px Arial`;
            ctx.fillStyle = this.colors.text;
            ctx.textAlign = 'center';
            ctx.fillText(title, width / 2, 20);
        }

        // 計算圓心和半徑
        const centerX = width / 2;
        const centerY = height / 2 + (title ? 10 : 0);
        const radius = Math.min(width, height) / 2 - this.padding - (title ? 20 : 0);

        // 繪製圓餅
        let currentAngle = -Math.PI / 2; // 從12點鐘方向開始

        data.forEach((item, index) => {
            const sliceAngle = (item.value / total) * Math.PI * 2;
            const color = colors[index % colors.length];

            // 繪製扇形
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = color;
            ctx.fill();
            ctx.strokeStyle = 'white';
            ctx.lineWidth = 2;
            ctx.stroke();

            // 繪製標籤
            if (showLabels || showPercentages) {
                const labelAngle = currentAngle + sliceAngle / 2;
                const labelRadius = radius * 0.7;
                const labelX = centerX + Math.cos(labelAngle) * labelRadius;
                const labelY = centerY + Math.sin(labelAngle) * labelRadius;

                ctx.font = `bold ${this.fontSize}px Arial`;
                ctx.fillStyle = 'white';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';

                if (showPercentages) {
                    const percentage = Math.round((item.value / total) * 100);
                    ctx.fillText(`${percentage}%`, labelX, labelY);
                }
            }

            currentAngle += sliceAngle;
        });

        // 繪製圖例
        if (showLabels) {
            const legendX = width - this.padding - 100;
            const legendY = this.padding + (title ? 30 : 0);
            const legendItemHeight = 25;

            data.forEach((item, index) => {
                const y = legendY + index * legendItemHeight;
                const color = colors[index % colors.length];

                // 顏色方塊
                ctx.fillStyle = color;
                ctx.fillRect(legendX, y, 15, 15);
                ctx.strokeStyle = this.colors.text;
                ctx.lineWidth = 1;
                ctx.strokeRect(legendX, y, 15, 15);

                // 標籤文字
                ctx.font = `${this.fontSize}px Arial`;
                ctx.fillStyle = this.colors.text;
                ctx.textAlign = 'left';
                ctx.textBaseline = 'middle';
                ctx.fillText(`${item.label}: ${item.value}`, legendX + 20, y + 7);
            });
        }
    }

    /**
     * 使畫布響應式
     */
    makeResponsive(canvas, container) {
        const resizeCanvas = () => {
            const rect = container.getBoundingClientRect();
            canvas.width = rect.width;
            canvas.height = rect.height;
        };

        resizeCanvas();
        window.addEventListener('resize', resizeCanvas);

        return () => {
            window.removeEventListener('resize', resizeCanvas);
        };
    }

    /**
     * 格式化數據標籤
     */
    formatLabel(value, type = 'number') {
        switch (type) {
            case 'ml':
                return `${value}ml`;
            case 'percentage':
                return `${value}%`;
            case 'date':
                return new Date(value).toLocaleDateString('zh-TW', { month: 'short', day: 'numeric' });
            default:
                return value.toString();
        }
    }
}

// ==================== 水量記錄管理系統 ====================

class WaterEntryManager {
    constructor(appState) {
        this.appState = appState;
        this.editingEntry = null;
    }

    /**
     * 添加水量記錄（支援自訂時間）
     */
    addWaterEntry(amount, customTime = null) {
        try {
            // 驗證輸入
            if (!amount || amount <= 0 || amount > 10000) {
                throw new Error('水量數值無效');
            }

            const gameData = this.appState.getGameData();
            const wasGoalComplete = gameData.todayAmount >= gameData.dailyGoal;

            // 使用自訂時間或當前時間
            const timestamp = customTime ? new Date(customTime) : new Date();
            
            // 驗證時間不能是未來
            if (timestamp > new Date()) {
                throw new Error('不能記錄未來的時間');
            }

            // 驗證時間必須是今天
            const today = new Date().toDateString();
            if (timestamp.toDateString() !== today) {
                throw new Error('只能記錄今天的飲水量');
            }

            // 更新水量
            gameData.todayAmount += amount;
            gameData.totalAmount += amount;

            // 添加經驗值
            const expGain = Math.floor(amount / 10);
            this.addExp(expGain);

            // 創建記錄項目
            const entry = {
                id: this.generateEntryId(),
                time: timestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
                timestamp: timestamp.toISOString(),
                amount: amount,
                exp: expGain,
                edited: false,
                editHistory: []
            };

            // 添加到歷史記錄（按時間排序插入）
            this.insertEntryByTime(gameData.history, entry);

            // 更新狀態
            this.appState.updateGameData(gameData);

            // 儲存今日數據到歷史記錄
            if (dashboardSystem) {
                dashboardSystem.saveHistoricalData();
                dashboardSystem.clearCache();
            }

            // 檢查成就
            checkAchievements();

            // 檢查每日目標完成
            if (!wasGoalComplete && gameData.todayAmount >= gameData.dailyGoal) {
                this.appState.notifyListeners('dailyGoalComplete');
            }

            return entry;

        } catch (error) {
            console.error('添加水量失敗:', error);
            throw error;
        }
    }

    /**
     * 按時間順序插入記錄
     */
    insertEntryByTime(history, entry) {
        const entryTime = new Date(entry.timestamp);
        
        // 找到插入位置（保持降序排列，最新的在前面）
        let insertIndex = history.findIndex(item => {
            const itemTime = new Date(item.timestamp);
            return entryTime > itemTime;
        });

        if (insertIndex === -1) {
            // 如果沒找到，說明是最舊的記錄，放在最後
            history.push(entry);
        } else {
            // 插入到找到的位置
            history.splice(insertIndex, 0, entry);
        }
    }

    /**
     * 編輯記錄
     */
    editEntry(entryId, newAmount, newTime) {
        try {
            const gameData = this.appState.getGameData();
            const entry = this.findEntryById(entryId, gameData.history);

            if (!entry) {
                throw new Error('找不到該記錄');
            }

            // 驗證新水量
            if (!newAmount || newAmount <= 0 || newAmount > 10000) {
                throw new Error('水量數值無效');
            }

            // 驗證新時間
            const newTimestamp = new Date(newTime);
            if (newTimestamp > new Date()) {
                throw new Error('不能設定未來的時間');
            }

            const today = new Date().toDateString();
            if (newTimestamp.toDateString() !== today) {
                throw new Error('只能設定今天的時間');
            }

            // 保存編輯歷史
            entry.editHistory = entry.editHistory || [];
            entry.editHistory.push({
                timestamp: new Date().toISOString(),
                oldAmount: entry.amount,
                oldTime: entry.timestamp
            });

            // 更新記錄
            const oldAmount = entry.amount;
            entry.amount = newAmount;
            entry.timestamp = newTimestamp.toISOString();
            entry.time = newTimestamp.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' });
            entry.exp = Math.floor(newAmount / 10);
            entry.edited = true;

            // 重新排序歷史記錄
            gameData.history.sort((a, b) => {
                return new Date(b.timestamp) - new Date(a.timestamp);
            });

            // 重新計算所有數據
            this.recalculateAll();

            return true;

        } catch (error) {
            console.error('編輯記錄失敗:', error);
            throw error;
        }
    }

    /**
     * 刪除記錄
     */
    deleteEntry(entryId) {
        try {
            const gameData = this.appState.getGameData();
            const entryIndex = gameData.history.findIndex(entry => entry.id === entryId);

            if (entryIndex === -1) {
                throw new Error('找不到該記錄');
            }

            // 移除記錄
            gameData.history.splice(entryIndex, 1);

            // 重新計算所有數據
            this.recalculateAll();

            return true;

        } catch (error) {
            console.error('刪除記錄失敗:', error);
            throw error;
        }
    }

    /**
     * 重新計算所有數據
     */
    recalculateAll() {
        try {
            const gameData = this.appState.getGameData();

            // 重新計算今日總量和總經驗值
            let todayAmount = 0;
            let totalExp = 0;

            gameData.history.forEach(entry => {
                todayAmount += entry.amount;
                totalExp += entry.exp;
            });

            gameData.todayAmount = todayAmount;

            // 重新計算等級和經驗值
            // 注意：這裡簡化處理，實際上應該從0開始重新計算等級
            // 但為了不影響已有的等級進度，我們只更新當前經驗值
            
            // 更新狀態
            this.appState.updateGameData(gameData);

            // 儲存今日數據
            if (dashboardSystem) {
                dashboardSystem.saveHistoricalData();
                dashboardSystem.clearCache();
            }

            // 重新檢查成就
            checkAchievements();

        } catch (error) {
            console.error('重新計算數據失敗:', error);
            throw error;
        }
    }

    /**
     * 根據ID查找記錄
     */
    findEntryById(entryId, history) {
        return history.find(entry => entry.id === entryId);
    }

    /**
     * 生成記錄ID
     */
    generateEntryId() {
        return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 添加經驗值
     */
    addExp(exp) {
        const gameData = this.appState.getGameData();
        gameData.exp += exp;

        // 檢查升級
        while (gameData.exp >= gameData.maxExp) {
            this.levelUp(gameData);
        }

        this.appState.updateGameData(gameData);
    }

    /**
     * 升級
     */
    levelUp(gameData) {
        gameData.exp -= gameData.maxExp;
        gameData.level++;
        gameData.maxExp = Math.floor(gameData.maxExp * 1.2);

        // 通知升級事件
        this.appState.notifyListeners('levelUp', { level: gameData.level });
    }

    /**
     * 顯示確認對話框
     */
    showConfirmDialog(message, onConfirm, onCancel) {
        // 創建自訂確認對話框
        const overlay = document.createElement('div');
        overlay.className = 'confirm-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease-in;
        `;

        const dialog = document.createElement('div');
        dialog.className = 'confirm-dialog';
        dialog.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease-out;
        `;

        dialog.innerHTML = `
            <div style="margin-bottom: 20px; color: #333; font-size: 16px; line-height: 1.5;">
                ${message}
            </div>
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="cancel-btn" style="padding: 10px 20px; border: 1px solid #ddd; background: white; 
                       border-radius: 8px; cursor: pointer; font-size: 14px;">
                    取消
                </button>
                <button class="confirm-btn" style="padding: 10px 20px; border: none; background: linear-gradient(135deg, #667eea, #764ba2); 
                       color: white; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold;">
                    確定
                </button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // 綁定事件
        const confirmBtn = dialog.querySelector('.confirm-btn');
        const cancelBtn = dialog.querySelector('.cancel-btn');

        const closeDialog = () => {
            overlay.style.animation = 'fadeOut 0.2s ease-out';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 200);
        };

        confirmBtn.addEventListener('click', () => {
            closeDialog();
            if (onConfirm) onConfirm();
        });

        cancelBtn.addEventListener('click', () => {
            closeDialog();
            if (onCancel) onCancel();
        });

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog();
                if (onCancel) onCancel();
            }
        });
    }

    /**
     * 顯示編輯對話框
     */
    showEditDialog(entry, onSave) {
        const overlay = document.createElement('div');
        overlay.className = 'edit-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.7);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.2s ease-in;
        `;

        const dialog = document.createElement('div');
        dialog.className = 'edit-dialog';
        dialog.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 24px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            animation: slideUp 0.3s ease-out;
        `;

        // 從 ISO 時間戳提取時間
        const entryDate = new Date(entry.timestamp);
        const timeValue = entryDate.toTimeString().slice(0, 5); // HH:MM
        
        // 計算今天的時間範圍（00:00 到當前時間）
        const now = new Date();
        const maxTime = now.toTimeString().slice(0, 5); // 當前時間 HH:MM

        dialog.innerHTML = `
            <h3 style="margin: 0 0 20px 0; color: #333;">編輯記錄</h3>
            
            <div style="margin-bottom: 16px;">
                <label style="display: block; margin-bottom: 8px; color: #666; font-size: 14px;">水量 (ml)</label>
                <input type="number" id="editAmount" value="${entry.amount}" min="1" max="10000"
                       style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
            </div>
            
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 8px; color: #666; font-size: 14px;">時間</label>
                <input type="time" id="editTime" value="${timeValue}" min="00:00" max="${maxTime}"
                       style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; font-size: 16px;">
                <p style="margin: 4px 0 0 0; color: #999; font-size: 12px;">只能設定今天 00:00 到 ${maxTime} 之間的時間</p>
            </div>
            
            <div style="display: flex; gap: 12px; justify-content: flex-end;">
                <button class="cancel-btn" style="padding: 10px 20px; border: 1px solid #ddd; background: white; 
                       border-radius: 8px; cursor: pointer; font-size: 14px;">
                    取消
                </button>
                <button class="save-btn" style="padding: 10px 20px; border: none; background: linear-gradient(135deg, #667eea, #764ba2); 
                       color: white; border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: bold;">
                    儲存
                </button>
            </div>
        `;

        overlay.appendChild(dialog);
        document.body.appendChild(overlay);

        // 綁定事件
        const saveBtn = dialog.querySelector('.save-btn');
        const cancelBtn = dialog.querySelector('.cancel-btn');
        const amountInput = dialog.querySelector('#editAmount');
        const timeInput = dialog.querySelector('#editTime');

        // 驗證時間輸入
        const validateTime = () => {
            const selectedTime = timeInput.value;
            if (selectedTime > maxTime) {
                timeInput.value = maxTime;
                alert(`時間不能超過當前時間 ${maxTime}`);
            }
        };

        timeInput.addEventListener('change', validateTime);
        timeInput.addEventListener('blur', validateTime);

        const closeDialog = () => {
            overlay.style.animation = 'fadeOut 0.2s ease-out';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 200);
        };

        saveBtn.addEventListener('click', () => {
            const newAmount = parseInt(amountInput.value);
            const newTime = timeInput.value;

            if (!newAmount || newAmount <= 0 || newAmount > 10000) {
                alert('請輸入有效的水量（1-10000ml）');
                return;
            }

            if (!newTime) {
                alert('請選擇時間');
                return;
            }

            // 驗證時間不能超過當前時間
            if (newTime > maxTime) {
                alert(`時間不能超過當前時間 ${maxTime}`);
                return;
            }

            // 組合日期和時間
            const today = new Date();
            const [hours, minutes] = newTime.split(':');
            const newDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
                                        parseInt(hours), parseInt(minutes));

            // 最後驗證：確保不是未來時間
            if (newDateTime > new Date()) {
                alert('不能設定未來的時間');
                return;
            }

            closeDialog();
            if (onSave) onSave(newAmount, newDateTime);
        });

        cancelBtn.addEventListener('click', closeDialog);

        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeDialog();
            }
        });
    }
}

// ==================== 數據匯出和備份系統 ====================

class DataExportSystem {
    constructor(appState) {
        this.appState = appState;
        this.storageManager = new LocalStorageManager();
    }

    /**
     * 匯出為 CSV 格式
     */
    exportToCSV(dateRange = 7) {
        try {
            const data = this.getDataForRange(dateRange);
            
            if (data.length === 0) {
                alert('選擇的日期範圍內沒有數據');
                return;
            }

            // 建立 CSV 標題
            const headers = ['日期', '時間', '水量(ml)', '經驗值', '等級', '已解鎖成就'];
            
            // 建立 CSV 內容
            const csvRows = [headers.join(',')];
            
            data.forEach(entry => {
                const row = [
                    entry.date,
                    entry.time,
                    entry.amount,
                    entry.exp,
                    entry.level,
                    `"${entry.achievements.join(', ')}"` // 用引號包裹以處理逗號
                ];
                csvRows.push(row.join(','));
            });

            const csvContent = csvRows.join('\n');
            
            // 添加 BOM 以支援中文
            const BOM = '\uFEFF';
            const blob = new Blob([BOM + csvContent], { type: 'text/csv;charset=utf-8;' });
            
            this.downloadFile(blob, `water-tracker-data-${this.getDateString()}.csv`);
            this.showSuccessMessage('CSV 檔案已匯出！');

        } catch (error) {
            console.error('匯出 CSV 失敗:', error);
            alert('匯出失敗，請重試');
        }
    }

    /**
     * 匯出為 JSON 格式
     */
    exportToJSON(dateRange = 7) {
        try {
            const data = this.getDataForRange(dateRange);
            
            if (data.length === 0) {
                alert('選擇的日期範圍內沒有數據');
                return;
            }

            const exportData = {
                exportDate: new Date().toISOString(),
                dateRange: dateRange,
                totalEntries: data.length,
                data: data
            };

            const jsonContent = JSON.stringify(exportData, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            
            this.downloadFile(blob, `water-tracker-data-${this.getDateString()}.json`);
            this.showSuccessMessage('JSON 檔案已匯出！');

        } catch (error) {
            console.error('匯出 JSON 失敗:', error);
            alert('匯出失敗，請重試');
        }
    }

    /**
     * 獲取指定日期範圍的數據
     */
    getDataForRange(days) {
        const result = [];
        const gameData = this.appState.getGameData();
        const today = new Date();

        // 收集指定天數的數據
        for (let i = 0; i < days; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            const dateStr = date.toDateString();

            // 如果是今天，使用當前數據
            if (i === 0) {
                gameData.history.forEach(entry => {
                    result.push({
                        date: date.toLocaleDateString('zh-TW'),
                        time: entry.time,
                        timestamp: entry.timestamp,
                        amount: entry.amount,
                        exp: entry.exp,
                        level: gameData.level,
                        achievements: [...gameData.achievements]
                    });
                });
            } else {
                // 從 localStorage 獲取歷史數據
                const historicalAmount = this.getHistoricalAmount(dateStr);
                
                if (historicalAmount > 0) {
                    result.push({
                        date: date.toLocaleDateString('zh-TW'),
                        time: '全日總計',
                        timestamp: date.toISOString(),
                        amount: historicalAmount,
                        exp: Math.floor(historicalAmount / 10),
                        level: gameData.level,
                        achievements: [...gameData.achievements]
                    });
                }
            }
        }

        return result;
    }

    /**
     * 獲取歷史數據
     */
    getHistoricalAmount(dateStr) {
        try {
            const key = `waterHistory_${dateStr}`;
            const saved = localStorage.getItem(key);
            return saved ? parseInt(saved) : 0;
        } catch (error) {
            console.error('獲取歷史數據失敗:', error);
            return 0;
        }
    }

    /**
     * 備份所有數據
     */
    backupAllData() {
        try {
            const gameData = this.appState.getGameData();
            const settings = settingsPanel ? settingsPanel.loadSettings() : {};

            // 收集所有歷史數據
            const historicalData = this.collectAllHistoricalData();

            const backup = {
                version: '2.0',
                exportDate: new Date().toISOString(),
                gameData: gameData,
                settings: settings,
                historicalData: historicalData,
                metadata: {
                    totalDays: historicalData.length,
                    totalAmount: gameData.totalAmount,
                    currentLevel: gameData.level,
                    achievementsCount: gameData.achievements.length
                }
            };

            const jsonContent = JSON.stringify(backup, null, 2);
            const blob = new Blob([jsonContent], { type: 'application/json;charset=utf-8;' });
            
            this.downloadFile(blob, `water-tracker-backup-${this.getDateString()}.json`);
            this.showSuccessMessage('✅ 備份已完成！');

        } catch (error) {
            console.error('備份失敗:', error);
            alert('備份失敗，請重試');
        }
    }

    /**
     * 收集所有歷史數據
     */
    collectAllHistoricalData() {
        const historicalData = [];
        
        try {
            // 遍歷 localStorage 尋找所有歷史記錄
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                
                if (key && key.startsWith('waterHistory_')) {
                    const dateStr = key.replace('waterHistory_', '');
                    const amount = parseInt(localStorage.getItem(key));
                    
                    if (amount > 0) {
                        historicalData.push({
                            date: dateStr,
                            amount: amount
                        });
                    }
                }
            }

            // 按日期排序（最新的在前）
            historicalData.sort((a, b) => {
                return new Date(b.date) - new Date(a.date);
            });

        } catch (error) {
            console.error('收集歷史數據失敗:', error);
        }

        return historicalData;
    }

    /**
     * 從備份還原數據
     */
    async restoreFromBackup(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();

                reader.onload = (e) => {
                    try {
                        const backup = JSON.parse(e.target.result);
                        
                        // 驗證備份檔案
                        this.validateBackup(backup);
                        
                        // 套用備份
                        this.applyBackup(backup);
                        
                        this.showSuccessMessage('✅ 數據已還原！頁面將重新載入...');
                        
                        // 延遲重新載入以顯示訊息
                        setTimeout(() => {
                            window.location.reload();
                        }, 1500);
                        
                        resolve(true);

                    } catch (error) {
                        console.error('還原備份失敗:', error);
                        reject(error);
                    }
                };

                reader.onerror = () => {
                    reject(new Error('讀取檔案失敗'));
                };

                reader.readAsText(file);

            } catch (error) {
                console.error('還原備份失敗:', error);
                reject(error);
            }
        });
    }

    /**
     * 驗證備份檔案
     */
    validateBackup(backup) {
        // 檢查版本
        if (!backup.version) {
            throw new Error('無效的備份檔案：缺少版本資訊');
        }

        // 檢查必要欄位
        if (!backup.gameData) {
            throw new Error('無效的備份檔案：缺少遊戲數據');
        }

        // 驗證遊戲數據結構
        const requiredFields = ['level', 'exp', 'maxExp', 'todayAmount', 'dailyGoal', 'totalAmount', 'history', 'achievements'];
        for (const field of requiredFields) {
            if (!(field in backup.gameData)) {
                throw new Error(`無效的備份檔案：缺少必要欄位 ${field}`);
            }
        }

        // 版本相容性檢查
        const backupVersion = parseFloat(backup.version);
        const currentVersion = 2.0;

        if (backupVersion > currentVersion) {
            throw new Error('備份檔案版本過新，請更新應用程式');
        }

        return true;
    }

    /**
     * 套用備份
     */
    applyBackup(backup) {
        try {
            // 還原遊戲數據
            this.storageManager.saveGameData(backup.gameData);

            // 還原設定
            if (backup.settings) {
                localStorage.setItem('appSettings', JSON.stringify(backup.settings));
            }

            // 還原歷史數據
            if (backup.historicalData && Array.isArray(backup.historicalData)) {
                backup.historicalData.forEach(record => {
                    const key = `waterHistory_${record.date}`;
                    localStorage.setItem(key, record.amount.toString());
                });
            }

            // 還原最後遊玩日期
            const today = new Date().toDateString();
            this.storageManager.saveLastPlayDate(today);

            return true;

        } catch (error) {
            console.error('套用備份失敗:', error);
            throw new Error('套用備份失敗，請檢查備份檔案');
        }
    }

    /**
     * 下載檔案
     */
    downloadFile(blob, filename) {
        try {
            // 建立下載連結
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // 觸發下載
            document.body.appendChild(link);
            link.click();
            
            // 清理
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

        } catch (error) {
            console.error('下載檔案失敗:', error);
            throw new Error('下載檔案失敗');
        }
    }

    /**
     * 獲取日期字串（用於檔名）
     */
    getDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}${month}${day}`;
    }

    /**
     * 顯示成功訊息
     */
    showSuccessMessage(message) {
        if (typeof showCelebration === 'function') {
            showCelebration(message);
        } else {
            alert(message);
        }
    }

    /**
     * 顯示匯出/備份面板
     */
    showExportPanel() {
        const overlay = document.createElement('div');
        overlay.className = 'export-overlay';
        overlay.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.8);
            z-index: 9998;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-in;
            overflow-y: auto;
            padding: 20px;
        `;

        const content = document.createElement('div');
        content.className = 'export-content';
        content.style.cssText = `
            background: white;
            border-radius: 16px;
            padding: 32px;
            max-width: 600px;
            width: 100%;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
            position: relative;
            animation: slideUp 0.4s ease-out;
            max-height: 90vh;
            overflow-y: auto;
        `;

        content.innerHTML = this.getExportPanelHTML();
        overlay.appendChild(content);
        document.body.appendChild(overlay);

        // 綁定事件
        this.bindExportPanelEvents(overlay);

        // 點擊遮罩關閉
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                this.hideExportPanel(overlay);
            }
        });
    }

    /**
     * 獲取匯出面板 HTML
     */
    getExportPanelHTML() {
        return `
            <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                <h2 style="margin: 0; color: #333;">💾 數據匯出與備份</h2>
                <button onclick="dataExportSystem.hideExportPanel(document.querySelector('.export-overlay'))" 
                        style="background: none; border: none; font-size: 24px; cursor: pointer; color: #999;">✕</button>
            </div>

            <!-- 數據匯出區域 -->
            <div class="export-section" style="margin-bottom: 32px;">
                <h3 style="color: #0984e3; margin-bottom: 16px;">📊 匯出數據</h3>
                <p style="color: #666; font-size: 0.9em; margin-bottom: 16px;">
                    選擇日期範圍並匯出為 CSV 或 JSON 格式
                </p>

                <div style="margin-bottom: 16px;">
                    <label style="display: block; margin-bottom: 8px; color: #666; font-size: 0.9em;">
                        選擇日期範圍
                    </label>
                    <select id="exportDateRange" 
                            style="width: 100%; padding: 10px; border: 2px solid #ddd; border-radius: 8px; 
                                   font-size: 1em; cursor: pointer;">
                        <option value="7">最近 7 天</option>
                        <option value="14">最近 14 天</option>
                        <option value="30">最近 30 天</option>
                        <option value="60">最近 60 天</option>
                        <option value="90">最近 90 天</option>
                    </select>
                </div>

                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
                    <button onclick="dataExportSystem.exportToCSV(parseInt(document.getElementById('exportDateRange').value))"
                            style="padding: 12px; border: 2px solid #0984e3; background: white; color: #0984e3;
                                   border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.2s;"
                            onmouseover="this.style.background='#0984e3'; this.style.color='white';"
                            onmouseout="this.style.background='white'; this.style.color='#0984e3';">
                        📄 匯出 CSV
                    </button>
                    <button onclick="dataExportSystem.exportToJSON(parseInt(document.getElementById('exportDateRange').value))"
                            style="padding: 12px; border: 2px solid #00b894; background: white; color: #00b894;
                                   border-radius: 8px; cursor: pointer; font-weight: bold; transition: all 0.2s;"
                            onmouseover="this.style.background='#00b894'; this.style.color='white';"
                            onmouseout="this.style.background='white'; this.style.color='#00b894';">
                        📋 匯出 JSON
                    </button>
                </div>
            </div>

            <!-- 備份與還原區域 -->
            <div class="backup-section">
                <h3 style="color: #0984e3; margin-bottom: 16px;">💾 完整備份</h3>
                <p style="color: #666; font-size: 0.9em; margin-bottom: 16px;">
                    備份包含所有遊戲數據、設定和歷史記錄
                </p>

                <div style="display: grid; gap: 12px;">
                    <button onclick="dataExportSystem.backupAllData()"
                            style="padding: 14px; border: none; background: linear-gradient(135deg, #667eea, #764ba2);
                                   color: white; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;
                                   transition: all 0.2s;"
                            onmouseover="this.style.transform='translateY(-2px)'; this.style.boxShadow='0 4px 12px rgba(102, 126, 234, 0.4)';"
                            onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='none';">
                        💾 建立完整備份
                    </button>

                    <div style="position: relative;">
                        <input type="file" id="restoreFileInput" accept=".json" 
                               style="display: none;"
                               onchange="dataExportSystem.handleRestoreFile(this.files[0])">
                        <button onclick="document.getElementById('restoreFileInput').click()"
                                style="width: 100%; padding: 14px; border: 2px solid #fdcb6e; background: white; 
                                       color: #fdcb6e; border-radius: 8px; cursor: pointer; font-weight: bold; font-size: 1em;
                                       transition: all 0.2s;"
                                onmouseover="this.style.background='#fdcb6e'; this.style.color='white';"
                                onmouseout="this.style.background='white'; this.style.color='#fdcb6e';">
                            📂 從備份還原
                        </button>
                    </div>
                </div>

                <div style="margin-top: 16px; padding: 12px; background: #fff3cd; border-radius: 8px; 
                            border-left: 4px solid #ffc107;">
                    <p style="margin: 0; color: #856404; font-size: 0.85em;">
                        ⚠️ 還原備份將會覆蓋目前的所有數據，請先建立備份以防萬一。
                    </p>
                </div>
            </div>
        `;
    }

    /**
     * 綁定匯出面板事件
     */
    bindExportPanelEvents(overlay) {
        // 事件已經通過 onclick 綁定
    }

    /**
     * 隱藏匯出面板
     */
    hideExportPanel(overlay) {
        if (overlay) {
            overlay.style.animation = 'fadeOut 0.3s ease-out';
            setTimeout(() => {
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
            }, 300);
        }
    }

    /**
     * 處理還原檔案
     */
    async handleRestoreFile(file) {
        if (!file) return;

        // 確認對話框
        if (!confirm('確定要從備份還原數據嗎？這將會覆蓋目前的所有數據！')) {
            return;
        }

        try {
            await this.restoreFromBackup(file);
        } catch (error) {
            console.error('還原失敗:', error);
            alert(`還原失敗：${error.message}`);
        }
    }
}

// ==================== 全域應用程式實例 ====================

const appState = new AppStateManager();
let onboardingSystem = null;
let settingsPanel = null;
let notificationSystem = null;
let themeSystem = null;
let dashboardSystem = null;
let chartRenderer = null;
let waterEntryManager = null;
let dataExportSystem = null;

// ==================== 遊戲邏輯函式 ====================

/**
 * 初始化遊戲
 */
function initGame() {
    try {
        // 初始化應用程式狀態
        appState.initialize();

        // 設置事件監聽器
        setupEventListeners();

        // 初始化設定面板
        settingsPanel = new SettingsPanel(appState);
        
        // 初始化通知系統
        const savedSettings = settingsPanel.loadSettings();
        notificationSystem = new NotificationSystem(savedSettings.notifications);
        notificationSystem.initialize();
        
        // 初始化主題系統
        themeSystem = new ThemeSystem();
        themeSystem.initialize(savedSettings.theme);
        
        // 初始化儀表板系統
        dashboardSystem = new DashboardSystem(appState);
        
        // 初始化圖表繪製器
        chartRenderer = new ChartRenderer();
        
        // 初始化水量記錄管理器
        waterEntryManager = new WaterEntryManager(appState);
        
        // 初始化數據匯出系統
        dataExportSystem = new DataExportSystem(appState);
        
        // 套用已儲存的設定
        settingsPanel.applySettings();

        // 更新UI
        updateUI();
        renderAchievements();
        renderHistory();

        // 初始化新手導覽系統
        onboardingSystem = new OnboardingSystem(document.body, appState);

        // 檢查是否需要顯示導覽
        if (onboardingSystem.shouldShowOnboarding()) {
            // 延遲顯示導覽，讓UI先渲染完成
            setTimeout(() => {
                onboardingSystem.startOnboarding();
            }, 500);
        }

    } catch (error) {
        console.error('遊戲初始化失敗:', error);
        alert('遊戲載入失敗，請重新整理頁面');
    }
}

/**
 * 顯示設定面板
 */
function showSettings() {
    if (settingsPanel) {
        settingsPanel.show();
    }
}

/**
 * 顯示匯出面板
 */
function showExportPanel() {
    if (dataExportSystem) {
        dataExportSystem.showExportPanel();
    }
}

/**
 * 設置事件監聽器
 */
function setupEventListeners() {
    // 監聽數據變化
    appState.addEventListener('dataChange', () => {
        updateUI();
        renderHistory();
    });

    // 監聽升級事件
    appState.addEventListener('levelUp', (data) => {
        showCelebration(`🎊 升級了！現在是 ${data.level} 級！`);
        updateCharacter();
    });

    // 監聽成就解鎖
    appState.addEventListener('achievementUnlock', (achievement) => {
        showCelebration(`🏆 解鎖成就：${achievement.name}！`);
        renderAchievements();
    });

    // 監聽每日目標完成
    appState.addEventListener('dailyGoalComplete', () => {
        showCelebration('🎉 恭喜完成今日目標！');
    });
}

/**
 * 添加水量
 */
function addWater(amount, customTime = null) {
    try {
        if (waterEntryManager) {
            waterEntryManager.addWaterEntry(amount, customTime);
        } else {
            throw new Error('水量記錄管理器尚未初始化');
        }
    } catch (error) {
        console.error('添加水量失敗:', error);
        alert(error.message || '添加水量失敗，請重試');
    }
}

/**
 * 添加自訂水量
 */
function addCustomWater() {
    try {
        const amountInput = document.getElementById('customAmount');
        const amount = parseInt(amountInput.value);

        if (isNaN(amount) || amount <= 0 || amount > 1000) {
            alert('請輸入1-1000之間的數字');
            return;
        }

        // 檢查是否使用自訂時間
        const useCustomTime = document.getElementById('useCustomTime');
        const customTimeInput = document.getElementById('customTime');
        
        let customDateTime = null;
        
        if (useCustomTime && useCustomTime.checked) {
            const timeValue = customTimeInput.value;
            
            if (!timeValue) {
                alert('請選擇時間');
                return;
            }
            
            // 組合日期和時間
            const today = new Date();
            const [hours, minutes] = timeValue.split(':');
            customDateTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
                                     parseInt(hours), parseInt(minutes));
            
            // 驗證時間不能是未來
            if (customDateTime > new Date()) {
                alert('不能設定未來的時間');
                return;
            }
        }

        addWater(amount, customDateTime);
        
        // 清空輸入
        amountInput.value = '';
        if (customTimeInput) {
            customTimeInput.value = '';
        }
        if (useCustomTime) {
            useCustomTime.checked = false;
            const customTimeContainer = document.getElementById('customTimeContainer');
            if (customTimeContainer) {
                customTimeContainer.style.display = 'none';
            }
        }

    } catch (error) {
        console.error('添加自訂水量失敗:', error);
        alert(error.message || '操作失敗，請重試');
    }
}

/**
 * 添加經驗值（向後相容）
 */
function addExp(exp) {
    if (waterEntryManager) {
        waterEntryManager.addExp(exp);
    }
}

/**
 * 升級（向後相容）
 */
function levelUp(gameData) {
    if (waterEntryManager) {
        waterEntryManager.levelUp(gameData);
    }
}

/**
 * 更新角色外觀（增強版）
 */
function updateCharacter() {
    try {
        const character = document.querySelector('.water-sprite');
        const characterName = document.querySelector('.character-name');
        const characterContainer = document.getElementById('character');

        if (!character || !characterName) {
            throw new Error('找不到角色元素');
        }

        const gameData = appState.getGameData();
        const level = Math.min(gameData.level, 5);
        const stage = CHARACTER_STAGES[level];
        
        // 檢查是否進化（等級改變）
        const oldLevel = character.dataset.level || '1';
        const hasEvolved = parseInt(oldLevel) !== level;

        character.textContent = stage.emoji;
        character.className = `water-sprite sprite-level-${level}`;
        characterName.textContent = stage.name;
        character.dataset.level = level;
        
        // 如果進化，添加進化動畫
        if (hasEvolved && typeof addAnimationClass === 'function') {
            addAnimationClass(character, 'character-evolve-animation', 1200);
            
            // 宣告進化訊息
            if (typeof announceToScreenReader === 'function') {
                announceToScreenReader(`恭喜！你的水精靈進化成 ${stage.name} 了！`, true);
            }
        }

        // 更新 ARIA 標籤
        if (characterContainer) {
            characterContainer.setAttribute('aria-label', `水精靈角色：${stage.name}，等級${level}`);
        }

    } catch (error) {
        console.error('更新角色失敗:', error);
    }
}

/**
 * 更新UI
 */
function updateUI() {
    try {
        const gameData = appState.getGameData();

        // 更新等級和經驗值
        const levelEl = document.getElementById('level');
        const currentExpEl = document.getElementById('currentExp');
        const maxExpEl = document.getElementById('maxExp');
        const expFillEl = document.getElementById('expFill');
        const expBar = expFillEl?.parentElement;

        if (levelEl) levelEl.textContent = gameData.level;
        if (currentExpEl) currentExpEl.textContent = gameData.exp;
        if (maxExpEl) maxExpEl.textContent = gameData.maxExp;

        if (expFillEl) {
            const expPercent = (gameData.exp / gameData.maxExp) * 100;
            expFillEl.style.width = `${expPercent}%`;
            
            // 添加經驗值增加動畫
            expFillEl.classList.add('exp-gain-animation');
            setTimeout(() => {
                expFillEl.classList.remove('exp-gain-animation');
            }, 500);
        }

        // 更新經驗值進度條 ARIA 屬性
        if (expBar) {
            expBar.setAttribute('aria-valuenow', gameData.exp);
            expBar.setAttribute('aria-valuemax', gameData.maxExp);
            expBar.setAttribute('aria-label', `經驗值：${gameData.exp} / ${gameData.maxExp}`);
        }

        // 更新每日進度
        const todayAmountEl = document.getElementById('todayAmount');
        const dailyProgressEl = document.getElementById('dailyProgress');
        const dailyProgressBar = dailyProgressEl?.parentElement;

        if (todayAmountEl) todayAmountEl.textContent = gameData.todayAmount;

        if (dailyProgressEl) {
            const dailyPercent = Math.min((gameData.todayAmount / gameData.dailyGoal) * 100, 100);
            dailyProgressEl.style.width = `${dailyPercent}%`;
            
            // 添加達標動畫
            if (gameData.todayAmount >= gameData.dailyGoal) {
                dailyProgressEl.classList.add('goal-reached');
            } else {
                dailyProgressEl.classList.remove('goal-reached');
            }
        }

        // 更新每日進度條 ARIA 屬性
        if (dailyProgressBar) {
            dailyProgressBar.setAttribute('aria-valuenow', gameData.todayAmount);
            dailyProgressBar.setAttribute('aria-valuemax', gameData.dailyGoal);
        }

        // 更新角色
        updateCharacter();

    } catch (error) {
        console.error('更新UI失敗:', error);
    }
}

/**
 * 檢查成就
 */
function checkAchievements() {
    try {
        const gameData = appState.getGameData();

        ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
            if (gameData.achievements.includes(achievement.id)) return;

            let unlocked = false;

            switch (achievement.requirement) {
                case 1:
                    unlocked = gameData.totalAmount >= 1;
                    break;
                case 'daily':
                    unlocked = gameData.todayAmount >= gameData.dailyGoal;
                    break;
                case 5000:
                    unlocked = gameData.totalAmount >= 5000;
                    break;
                case 10000:
                    unlocked = gameData.totalAmount >= 10000;
                    break;
                case 'level_5':
                    unlocked = gameData.level >= 5;
                    break;
                default:
                    if (typeof achievement.requirement === 'number') {
                        unlocked = gameData.totalAmount >= achievement.requirement;
                    }
            }

            if (unlocked) {
                gameData.achievements.push(achievement.id);
                appState.updateGameData(gameData);
                appState.notifyListeners('achievementUnlock', achievement);
            }
        });

    } catch (error) {
        console.error('檢查成就失敗:', error);
    }
}

/**
 * 渲染成就
 */
function renderAchievements() {
    try {
        const container = document.getElementById('achievementList');
        if (!container) return;

        container.innerHTML = '';
        const gameData = appState.getGameData();

        ACHIEVEMENT_DEFINITIONS.forEach(achievement => {
            const isUnlocked = gameData.achievements.includes(achievement.id);
            const item = document.createElement('div');
            item.className = `achievement-item ${isUnlocked ? 'unlocked' : ''}`;

            item.innerHTML = `
                <span class="achievement-icon">${achievement.icon}</span>
                <div>
                    <div style="font-weight: bold;">${achievement.name}</div>
                    <div style="font-size: 0.9em; opacity: 0.8;">${achievement.description}</div>
                </div>
            `;

            container.appendChild(item);
        });

    } catch (error) {
        console.error('渲染成就失敗:', error);
    }
}

/**
 * 渲染歷史記錄
 */
function renderHistory() {
    try {
        const container = document.getElementById('historyList');
        if (!container) return;

        container.innerHTML = '';
        const gameData = appState.getGameData();

        if (gameData.history.length === 0) {
            container.innerHTML = '<div style="text-align: center; color: #999;">今天還沒有記錄喔！</div>';
            return;
        }

        gameData.history.forEach(record => {
            const item = document.createElement('div');
            item.className = 'history-item';
            item.setAttribute('role', 'listitem');
            item.setAttribute('aria-label', `${record.time} 記錄了 ${record.amount} 毫升，獲得 ${record.exp} 經驗值${record.edited ? '，已編輯' : ''}`);
            item.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                padding: 12px;
                background: #f8f9fa;
                border-radius: 8px;
                margin-bottom: 8px;
                transition: all 0.2s ease;
            `;

            // 添加編輯標記
            const editedBadge = record.edited ? '<span style="color: #999; font-size: 0.8em; margin-left: 4px;" aria-hidden="true">✏️</span>' : '';

            item.innerHTML = `
                <div style="flex: 1;">
                    <span style="font-weight: 500;">${record.time}</span>${editedBadge}
                    <div style="color: #666; font-size: 0.9em;">+${record.amount}ml (+${record.exp} EXP)</div>
                </div>
                <div style="display: flex; gap: 8px;">
                    <button onclick="editWaterEntry('${record.id}')" 
                            style="padding: 6px 12px; border: 1px solid #0984e3; background: white; 
                                   color: #0984e3; border-radius: 6px; cursor: pointer; font-size: 0.85em;
                                   transition: all 0.2s ease;"
                            onmouseover="this.style.background='#0984e3'; this.style.color='white';"
                            onmouseout="this.style.background='white'; this.style.color='#0984e3';"
                            aria-label="編輯 ${record.time} 的記錄"
                            title="編輯記錄">
                        編輯
                    </button>
                    <button onclick="deleteWaterEntry('${record.id}')" 
                            style="padding: 6px 12px; border: 1px solid #d63031; background: white; 
                                   color: #d63031; border-radius: 6px; cursor: pointer; font-size: 0.85em;
                                   transition: all 0.2s ease;"
                            onmouseover="this.style.background='#d63031'; this.style.color='white';"
                            onmouseout="this.style.background='white'; this.style.color='#d63031';"
                            aria-label="刪除 ${record.time} 的記錄"
                            title="刪除記錄">
                        刪除
                    </button>
                </div>
            `;

            container.appendChild(item);
        });
        
        // 添加交錯動畫
        if (typeof addStaggerAnimation === 'function') {
            addStaggerAnimation(container);
        }

    } catch (error) {
        console.error('渲染歷史記錄失敗:', error);
    }
}

/**
 * 顯示慶祝動畫（增強版）
 */
function showCelebration(message, emoji = '🎉') {
    try {
        const celebration = document.getElementById('celebration');
        const text = document.getElementById('celebrationText');
        const emojiEl = celebration?.querySelector('.celebration-emoji');

        if (!celebration || !text) return;

        text.textContent = message;
        if (emojiEl) {
            emojiEl.textContent = emoji;
        }
        
        celebration.style.display = 'flex';
        celebration.setAttribute('aria-hidden', 'false');
        
        // 宣告給螢幕閱讀器
        if (typeof announceToScreenReader === 'function') {
            announceToScreenReader(message, true);
        }
        
        // 添加額外的視覺效果
        const content = celebration.querySelector('.celebration-content');
        if (content) {
            content.style.animation = 'none';
            setTimeout(() => {
                content.style.animation = 'celebrationPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            }, 10);
        }

        setTimeout(() => {
            celebration.style.display = 'none';
            celebration.setAttribute('aria-hidden', 'true');
        }, 2000);

    } catch (error) {
        console.error('顯示慶祝動畫失敗:', error);
    }
}

/**
 * 生成記錄ID（向後相容）
 */
function generateEntryId() {
    if (waterEntryManager) {
        return waterEntryManager.generateEntryId();
    }
    return `entry_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * 重新開始導覽
 */
function restartOnboarding() {
    if (onboardingSystem) {
        onboardingSystem.restartOnboarding();
    } else {
        alert('導覽系統尚未初始化');
    }
}

/**
 * 顯示統計儀表板
 */
function showDashboard() {
    if (dashboardSystem) {
        dashboardSystem.showDashboard();
    } else {
        alert('儀表板系統尚未初始化');
    }
}

/**
 * 編輯水量記錄
 */
function editWaterEntry(entryId) {
    try {
        if (!waterEntryManager) {
            throw new Error('水量記錄管理器尚未初始化');
        }

        const gameData = appState.getGameData();
        const entry = waterEntryManager.findEntryById(entryId, gameData.history);

        if (!entry) {
            throw new Error('找不到該記錄');
        }

        // 顯示編輯對話框
        waterEntryManager.showEditDialog(entry, (newAmount, newDateTime) => {
            try {
                waterEntryManager.editEntry(entryId, newAmount, newDateTime);
                showCelebration('✅ 記錄已更新！');
                updateUI();
                renderHistory();
            } catch (error) {
                console.error('編輯記錄失敗:', error);
                alert(error.message || '編輯記錄失敗，請重試');
            }
        });

    } catch (error) {
        console.error('編輯記錄失敗:', error);
        alert(error.message || '編輯記錄失敗，請重試');
    }
}

/**
 * 刪除水量記錄
 */
function deleteWaterEntry(entryId) {
    try {
        if (!waterEntryManager) {
            throw new Error('水量記錄管理器尚未初始化');
        }

        const gameData = appState.getGameData();
        const entry = waterEntryManager.findEntryById(entryId, gameData.history);

        if (!entry) {
            throw new Error('找不到該記錄');
        }

        // 顯示確認對話框
        waterEntryManager.showConfirmDialog(
            `確定要刪除這筆記錄嗎？<br><br><strong>${entry.time} - ${entry.amount}ml</strong>`,
            () => {
                try {
                    waterEntryManager.deleteEntry(entryId);
                    showCelebration('🗑️ 記錄已刪除');
                    updateUI();
                    renderHistory();
                } catch (error) {
                    console.error('刪除記錄失敗:', error);
                    alert(error.message || '刪除記錄失敗，請重試');
                }
            }
        );

    } catch (error) {
        console.error('刪除記錄失敗:', error);
        alert(error.message || '刪除記錄失敗，請重試');
    }
}

// ==================== 事件處理器 ====================

// 點擊慶祝動畫關閉
document.addEventListener('DOMContentLoaded', () => {
    const celebration = document.getElementById('celebration');
    if (celebration) {
        celebration.addEventListener('click', function() {
            this.style.display = 'none';
        });
    }

    // 設定自訂時間切換
    const useCustomTimeCheckbox = document.getElementById('useCustomTime');
    const customTimeContainer = document.getElementById('customTimeContainer');
    const customTimeInput = document.getElementById('customTime');
    
    if (useCustomTimeCheckbox && customTimeContainer && customTimeInput) {
        useCustomTimeCheckbox.addEventListener('change', function() {
            if (this.checked) {
                customTimeContainer.classList.add('show');
                customTimeContainer.style.display = 'block';
                // 設定最大時間為當前時間
                const now = new Date();
                const maxTime = now.toTimeString().slice(0, 5);
                customTimeInput.setAttribute('max', maxTime);
                // 預設為當前時間
                customTimeInput.value = maxTime;
            } else {
                customTimeContainer.classList.remove('show');
                setTimeout(() => {
                    customTimeContainer.style.display = 'none';
                }, 300); // 等待動畫完成
                customTimeInput.value = '';
            }
        });
        
        // 驗證時間輸入
        customTimeInput.addEventListener('change', function() {
            const now = new Date();
            const maxTime = now.toTimeString().slice(0, 5);
            if (this.value > maxTime) {
                this.value = maxTime;
                alert(`時間不能超過當前時間 ${maxTime}`);
            }
        });
    }

    // 初始化遊戲
    initGame();
});

// ==================== 鍵盤導航系統 ====================

/**
 * 初始化鍵盤導航
 */
function initKeyboardNavigation() {
    // Enter 鍵快速添加自訂水量
    document.addEventListener('keydown', function(e) {
        // 自訂水量輸入框按 Enter
        if (e.key === 'Enter' && document.getElementById('customAmount') === document.activeElement) {
            e.preventDefault();
            addCustomWater();
        }
        
        // 快捷鍵支援（當沒有輸入框聚焦時）
        const activeElement = document.activeElement;
        const isInputFocused = activeElement.tagName === 'INPUT' || 
                              activeElement.tagName === 'TEXTAREA' || 
                              activeElement.tagName === 'SELECT';
        
        if (!isInputFocused) {
            switch(e.key) {
                case '1':
                    // 快速按鈕 1
                    e.preventDefault();
                    const btn1 = document.querySelector('.quick-buttons .drink-btn:nth-child(1)');
                    if (btn1) {
                        btn1.click();
                        btn1.focus();
                    }
                    break;
                    
                case '2':
                    // 快速按鈕 2
                    e.preventDefault();
                    const btn2 = document.querySelector('.quick-buttons .drink-btn:nth-child(2)');
                    if (btn2) {
                        btn2.click();
                        btn2.focus();
                    }
                    break;
                    
                case '3':
                    // 快速按鈕 3
                    e.preventDefault();
                    const btn3 = document.querySelector('.quick-buttons .drink-btn:nth-child(3)');
                    if (btn3) {
                        btn3.click();
                        btn3.focus();
                    }
                    break;
                    
                case 'c':
                case 'C':
                    // 聚焦到自訂水量輸入框
                    e.preventDefault();
                    const customInput = document.getElementById('customAmount');
                    if (customInput) {
                        customInput.focus();
                        customInput.select();
                    }
                    break;
                    
                case 's':
                case 'S':
                    // 開啟設定
                    e.preventDefault();
                    showSettings();
                    break;
                    
                case 'd':
                case 'D':
                    // 開啟統計儀表板
                    e.preventDefault();
                    showDashboard();
                    break;
                    
                case 'h':
                case 'H':
                case '?':
                    // 顯示說明
                    e.preventDefault();
                    restartOnboarding();
                    break;
                    
                case 'Escape':
                    // ESC 關閉所有彈出視窗
                    e.preventDefault();
                    closeAllModals();
                    break;
            }
        }
    });
    
    // 為所有互動元素添加鍵盤提示
    addKeyboardHints();
}

/**
 * 關閉所有模態視窗
 */
function closeAllModals() {
    // 關閉設定面板
    if (settingsPanel && settingsPanel.isVisible) {
        settingsPanel.hide();
    }
    
    // 關閉儀表板
    if (dashboardSystem && dashboardSystem.isVisible) {
        dashboardSystem.hide();
    }
    
    // 關閉匯出面板
    if (dataExportSystem && dataExportSystem.isVisible) {
        dataExportSystem.hide();
    }
    
    // 關閉導覽
    if (onboardingSystem && onboardingSystem.overlay) {
        onboardingSystem.completeOnboarding();
    }
    
    // 關閉慶祝動畫
    const celebration = document.getElementById('celebration');
    if (celebration && celebration.style.display !== 'none') {
        celebration.style.display = 'none';
    }
}

/**
 * 添加鍵盤提示到按鈕
 */
function addKeyboardHints() {
    // 為快速按鈕添加鍵盤提示
    const quickButtons = document.querySelectorAll('.quick-buttons .drink-btn');
    quickButtons.forEach((btn, index) => {
        const currentLabel = btn.getAttribute('aria-label') || btn.textContent;
        btn.setAttribute('aria-label', `${currentLabel}（快捷鍵：${index + 1}）`);
        btn.setAttribute('title', `${currentLabel}（快捷鍵：${index + 1}）`);
    });
    
    // 為其他功能按鈕添加鍵盤提示
    const settingsBtn = document.querySelector('.settings-btn');
    if (settingsBtn) {
        const currentLabel = settingsBtn.getAttribute('aria-label') || '設定';
        settingsBtn.setAttribute('aria-label', `${currentLabel}（快捷鍵：S）`);
        settingsBtn.setAttribute('title', `${currentLabel}（快捷鍵：S）`);
    }
    
    const dashboardBtn = document.querySelector('.dashboard-btn');
    if (dashboardBtn) {
        const currentLabel = dashboardBtn.getAttribute('aria-label') || '統計';
        dashboardBtn.setAttribute('aria-label', `${currentLabel}（快捷鍵：D）`);
        dashboardBtn.setAttribute('title', `${currentLabel}（快捷鍵：D）`);
    }
    
    const helpBtn = document.querySelector('.help-btn');
    if (helpBtn) {
        const currentLabel = helpBtn.getAttribute('aria-label') || '使用說明';
        helpBtn.setAttribute('aria-label', `${currentLabel}（快捷鍵：H 或 ?）`);
        helpBtn.setAttribute('title', `${currentLabel}（快捷鍵：H 或 ?）`);
    }
    
    // 為自訂水量輸入框添加提示
    const customInput = document.getElementById('customAmount');
    if (customInput) {
        customInput.setAttribute('aria-label', '自訂毫升數（快捷鍵：C）');
        customInput.setAttribute('title', '快捷鍵：C 聚焦此欄位');
    }
}

/**
 * 添加視覺焦點指示器
 */
function enhanceFocusIndicators() {
    // 為所有可聚焦元素添加焦點事件
    const focusableElements = document.querySelectorAll(
        'button, a, input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    focusableElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.classList.add('keyboard-focused');
        });
        
        element.addEventListener('blur', function() {
            this.classList.remove('keyboard-focused');
        });
        
        // 滑鼠點擊時移除鍵盤焦點樣式
        element.addEventListener('mousedown', function() {
            this.classList.remove('keyboard-focused');
        });
    });
}

/**
 * 宣告螢幕閱讀器訊息
 */
function announceToScreenReader(message, priority = 'polite') {
    const announcement = document.createElement('div');
    announcement.setAttribute('role', 'status');
    announcement.setAttribute('aria-live', priority);
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // 移除舊的宣告
    setTimeout(() => {
        if (announcement.parentNode) {
            announcement.parentNode.removeChild(announcement);
        }
    }, 1000);
}

/**
 * 改善按鈕點擊回饋
 */
function enhanceButtonFeedback() {
    const buttons = document.querySelectorAll('button');
    
    buttons.forEach(button => {
        button.addEventListener('click', function(e) {
            // 添加視覺回饋動畫
            this.classList.add('button-pressed');
            
            // 移除動畫類別
            setTimeout(() => {
                this.classList.remove('button-pressed');
            }, 300);
        });
    });
}

// 初始化鍵盤導航和無障礙功能
document.addEventListener('DOMContentLoaded', () => {
    initKeyboardNavigation();
    enhanceFocusIndicators();
    enhanceButtonFeedback();
});

// ==================== 無障礙功能增強 ====================

/**
 * 初始化無障礙功能
 */
function initAccessibility() {
    try {
        // 設置鍵盤快捷鍵
        setupKeyboardShortcuts();
        
        // 增強焦點管理
        enhanceFocusManagement();
        
        // 添加 ARIA live regions
        setupLiveRegions();
        
        // 初始化鍵盤導航提示
        addKeyboardHints();
        
        console.log('無障礙功能已初始化');
    } catch (error) {
        console.error('初始化無障礙功能失敗:', error);
    }
}

/**
 * 設置鍵盤快捷鍵
 */
function setupKeyboardShortcuts() {
    document.addEventListener('keydown', (e) => {
        // Alt + 數字鍵：快速添加水量
        if (e.altKey && !e.ctrlKey && !e.shiftKey) {
            switch(e.key) {
                case '1':
                    e.preventDefault();
                    addWater(250);
                    announceToScreenReader('已添加 250 毫升');
                    break;
                case '2':
                    e.preventDefault();
                    addWater(500);
                    announceToScreenReader('已添加 500 毫升');
                    break;
                case '3':
                    e.preventDefault();
                    addWater(100);
                    announceToScreenReader('已添加 100 毫升');
                    break;
                case 's':
                case 'S':
                    e.preventDefault();
                    showSettings();
                    announceToScreenReader('已開啟設定面板');
                    break;
                case 'd':
                case 'D':
                    e.preventDefault();
                    showDashboard();
                    announceToScreenReader('已開啟統計儀表板');
                    break;
                case 'h':
                case 'H':
                    e.preventDefault();
                    restartOnboarding();
                    announceToScreenReader('已開啟使用說明');
                    break;
            }
        }
        
        // Escape 鍵：關閉模態對話框
        if (e.key === 'Escape') {
            closeAllModals();
        }
    });
}

/**
 * 增強焦點管理
 */
function enhanceFocusManagement() {
    // 追蹤最後的焦點元素
    let lastFocusedElement = null;
    
    // 當模態對話框打開時，保存焦點並設置焦點陷阱
    document.addEventListener('focusin', (e) => {
        const modal = e.target.closest('[role="dialog"], [role="alertdialog"]');
        if (modal) {
            // 確保焦點在模態對話框內
            if (!modal.contains(e.target)) {
                const firstFocusable = modal.querySelector('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
                if (firstFocusable) {
                    firstFocusable.focus();
                }
            }
        }
    });
    
    // 為所有互動元素添加焦點指示器
    const interactiveElements = document.querySelectorAll('button, a, input, select, textarea, [role="button"]');
    interactiveElements.forEach(element => {
        element.addEventListener('focus', function() {
            this.classList.add('has-focus');
        });
        
        element.addEventListener('blur', function() {
            this.classList.remove('has-focus');
        });
    });
}

/**
 * 設置 ARIA live regions
 */
function setupLiveRegions() {
    // 創建全域通知區域
    if (!document.getElementById('aria-live-region')) {
        const liveRegion = document.createElement('div');
        liveRegion.id = 'aria-live-region';
        liveRegion.setAttribute('role', 'status');
        liveRegion.setAttribute('aria-live', 'polite');
        liveRegion.setAttribute('aria-atomic', 'true');
        liveRegion.className = 'sr-only';
        document.body.appendChild(liveRegion);
    }
    
    // 創建緊急通知區域
    if (!document.getElementById('aria-alert-region')) {
        const alertRegion = document.createElement('div');
        alertRegion.id = 'aria-alert-region';
        alertRegion.setAttribute('role', 'alert');
        alertRegion.setAttribute('aria-live', 'assertive');
        alertRegion.setAttribute('aria-atomic', 'true');
        alertRegion.className = 'sr-only';
        document.body.appendChild(alertRegion);
    }
}

/**
 * 向螢幕閱讀器宣告訊息
 */
function announceToScreenReader(message, isUrgent = false) {
    const regionId = isUrgent ? 'aria-alert-region' : 'aria-live-region';
    const region = document.getElementById(regionId);
    
    if (region) {
        // 清空後重新設置，確保螢幕閱讀器會讀取
        region.textContent = '';
        setTimeout(() => {
            region.textContent = message;
        }, 100);
        
        // 3秒後清空
        setTimeout(() => {
            region.textContent = '';
        }, 3000);
    }
}

/**
 * 添加鍵盤導航提示
 */
function addKeyboardHints() {
    const buttons = document.querySelectorAll('.drink-btn');
    buttons.forEach((button, index) => {
        const hint = document.createElement('span');
        hint.className = 'keyboard-hint';
        hint.textContent = `Alt+${index + 1}`;
        hint.setAttribute('aria-hidden', 'true');
        button.style.position = 'relative';
        button.appendChild(hint);
    });
}

/**
 * 關閉所有模態對話框
 */
function closeAllModals() {
    // 關閉設定面板
    if (settingsPanel && settingsPanel.isVisible) {
        settingsPanel.hide();
    }
    
    // 關閉儀表板
    const dashboardOverlay = document.querySelector('.dashboard-overlay');
    if (dashboardOverlay && dashboardSystem) {
        dashboardSystem.hideDashboard(dashboardOverlay);
    }
    
    // 關閉匯出面板
    const exportOverlay = document.querySelector('.export-overlay');
    if (exportOverlay && dataExportSystem) {
        dataExportSystem.hideExportPanel(exportOverlay);
    }
    
    // 關閉新手導覽
    if (onboardingSystem && onboardingSystem.overlay) {
        onboardingSystem.completeOnboarding();
    }
}

/**
 * 添加動畫類別到元素
 */
function addAnimationClass(element, animationClass, duration = 1000) {
    if (!element) return;
    
    element.classList.add(animationClass);
    
    setTimeout(() => {
        element.classList.remove(animationClass);
    }, duration);
}

/**
 * 為數字變化添加計數動畫
 */
function animateNumber(element, start, end, duration = 500) {
    if (!element) return;
    
    const range = end - start;
    const increment = range / (duration / 16); // 60fps
    let current = start;
    
    const timer = setInterval(() => {
        current += increment;
        
        if ((increment > 0 && current >= end) || (increment < 0 && current <= end)) {
            current = end;
            clearInterval(timer);
            element.classList.remove('number-count-up');
        }
        
        element.textContent = Math.round(current);
    }, 16);
    
    element.classList.add('number-count-up');
}

/**
 * 顯示通知 toast
 */
function showToast(message, type = 'info', duration = 3000) {
    const toast = document.createElement('div');
    toast.className = 'notification-toast';
    toast.setAttribute('role', 'status');
    toast.setAttribute('aria-live', 'polite');
    
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    
    toast.innerHTML = `
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 1.5em;" aria-hidden="true">${icons[type] || icons.info}</span>
            <span>${message}</span>
        </div>
    `;
    
    document.body.appendChild(toast);
    
    // 宣告給螢幕閱讀器
    announceToScreenReader(message);
    
    // 自動移除
    setTimeout(() => {
        toast.classList.add('hiding');
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

/**
 * 增強的慶祝動畫
 */
function showEnhancedCelebration(message, emoji = '🎉') {
    const celebration = document.getElementById('celebration');
    const celebrationText = document.getElementById('celebrationText');
    const celebrationEmoji = celebration?.querySelector('.celebration-emoji');
    
    if (celebration && celebrationText) {
        celebrationText.textContent = message;
        if (celebrationEmoji) {
            celebrationEmoji.textContent = emoji;
        }
        
        celebration.style.display = 'flex';
        celebration.setAttribute('aria-hidden', 'false');
        
        // 宣告給螢幕閱讀器
        announceToScreenReader(message, true);
        
        // 添加額外的視覺效果
        const content = celebration.querySelector('.celebration-content');
        if (content) {
            content.style.animation = 'none';
            setTimeout(() => {
                content.style.animation = 'celebrationPop 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55)';
            }, 10);
        }
        
        setTimeout(() => {
            celebration.style.display = 'none';
            celebration.setAttribute('aria-hidden', 'true');
        }, 2000);
    }
}

/**
 * 為列表添加交錯動畫
 */
function addStaggerAnimation(container) {
    if (!container) return;
    
    container.classList.add('stagger-animation');
    
    // 動畫完成後移除類別
    setTimeout(() => {
        container.classList.remove('stagger-animation');
    }, 1000);
}

// ==================== 效能監控系統 ====================

class PerformanceMonitor {
    constructor() {
        this.metrics = {
            loadTime: 0,
            domReadyTime: 0,
            renderTime: 0,
            memoryUsage: 0,
            operations: []
        };
        this.isMonitoring = false;
        this.loadingIndicator = null;
    }

    /**
     * 初始化效能監控
     */
    initialize() {
        try {
            // 監控頁面載入時間
            if (window.performance && window.performance.timing) {
                window.addEventListener('load', () => {
                    this.measureLoadTime();
                });
            }

            // 監控 DOM 準備時間
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.measureDOMReadyTime();
                });
            } else {
                this.measureDOMReadyTime();
            }

            // 定期檢查記憶體使用（如果支援）
            if (performance.memory) {
                setInterval(() => {
                    this.checkMemoryUsage();
                }, 30000); // 每30秒檢查一次
            }

            this.isMonitoring = true;
            return true;

        } catch (error) {
            console.error('初始化效能監控失敗:', error);
            return false;
        }
    }

    /**
     * 測量頁面載入時間
     */
    measureLoadTime() {
        try {
            const timing = performance.timing;
            const loadTime = timing.loadEventEnd - timing.navigationStart;
            this.metrics.loadTime = loadTime;

            console.log(`頁面載入時間: ${loadTime}ms`);

            // 如果載入時間超過3秒，顯示警告
            if (loadTime > 3000) {
                console.warn('頁面載入時間較長，建議優化');
            }

        } catch (error) {
            console.error('測量載入時間失敗:', error);
        }
    }

    /**
     * 測量 DOM 準備時間
     */
    measureDOMReadyTime() {
        try {
            const timing = performance.timing;
            const domReadyTime = timing.domContentLoadedEventEnd - timing.navigationStart;
            this.metrics.domReadyTime = domReadyTime;

            console.log(`DOM 準備時間: ${domReadyTime}ms`);

        } catch (error) {
            console.error('測量 DOM 準備時間失敗:', error);
        }
    }

    /**
     * 檢查記憶體使用
     */
    checkMemoryUsage() {
        try {
            if (!performance.memory) return;

            const memory = performance.memory;
            const usedMB = Math.round(memory.usedJSHeapSize / 1048576);
            const totalMB = Math.round(memory.totalJSHeapSize / 1048576);
            const limitMB = Math.round(memory.jsHeapSizeLimit / 1048576);

            this.metrics.memoryUsage = {
                used: usedMB,
                total: totalMB,
                limit: limitMB,
                percentage: Math.round((usedMB / limitMB) * 100)
            };

            // 如果記憶體使用超過80%，發出警告
            if (this.metrics.memoryUsage.percentage > 80) {
                console.warn(`記憶體使用率較高: ${this.metrics.memoryUsage.percentage}%`);
                this.suggestCleanup();
            }

        } catch (error) {
            console.error('檢查記憶體使用失敗:', error);
        }
    }

    /**
     * 建議清理操作
     */
    suggestCleanup() {
        console.log('建議執行以下操作以釋放記憶體:');
        console.log('1. 清理舊的歷史記錄');
        console.log('2. 重新載入頁面');
        console.log('3. 關閉不必要的瀏覽器分頁');
    }

    /**
     * 測量操作執行時間
     */
    measureOperation(name, operation) {
        const startTime = performance.now();
        
        try {
            const result = operation();
            const endTime = performance.now();
            const duration = endTime - startTime;

            this.metrics.operations.push({
                name: name,
                duration: duration,
                timestamp: new Date().toISOString()
            });

            // 只保留最近100個操作記錄
            if (this.metrics.operations.length > 100) {
                this.metrics.operations.shift();
            }

            // 如果操作時間超過100ms，記錄警告
            if (duration > 100) {
                console.warn(`操作 "${name}" 執行時間較長: ${duration.toFixed(2)}ms`);
            }

            return result;

        } catch (error) {
            console.error(`操作 "${name}" 執行失敗:`, error);
            throw error;
        }
    }

    /**
     * 顯示載入指示器
     */
    showLoadingIndicator(message = '載入中...') {
        try {
            // 如果已經有載入指示器，不重複創建
            if (this.loadingIndicator) return;

            this.loadingIndicator = document.createElement('div');
            this.loadingIndicator.className = 'loading-indicator';
            this.loadingIndicator.setAttribute('role', 'status');
            this.loadingIndicator.setAttribute('aria-live', 'polite');
            this.loadingIndicator.style.cssText = `
                position: fixed;
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                background: rgba(0, 0, 0, 0.8);
                color: white;
                padding: 20px 40px;
                border-radius: 12px;
                z-index: 10000;
                display: flex;
                align-items: center;
                gap: 12px;
                font-size: 1.1em;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
                animation: fadeIn 0.3s ease;
            `;

            this.loadingIndicator.innerHTML = `
                <div class="spinner" style="
                    width: 24px;
                    height: 24px;
                    border: 3px solid rgba(255, 255, 255, 0.3);
                    border-top-color: white;
                    border-radius: 50%;
                    animation: spin 1s linear infinite;
                "></div>
                <span>${message}</span>
            `;

            document.body.appendChild(this.loadingIndicator);

        } catch (error) {
            console.error('顯示載入指示器失敗:', error);
        }
    }

    /**
     * 隱藏載入指示器
     */
    hideLoadingIndicator() {
        try {
            if (this.loadingIndicator) {
                this.loadingIndicator.style.animation = 'fadeOut 0.3s ease';
                setTimeout(() => {
                    if (this.loadingIndicator && this.loadingIndicator.parentNode) {
                        this.loadingIndicator.parentNode.removeChild(this.loadingIndicator);
                    }
                    this.loadingIndicator = null;
                }, 300);
            }
        } catch (error) {
            console.error('隱藏載入指示器失敗:', error);
        }
    }

    /**
     * 獲取效能報告
     */
    getPerformanceReport() {
        const report = {
            ...this.metrics,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            viewportSize: `${window.innerWidth}x${window.innerHeight}`
        };

        // 計算平均操作時間
        if (this.metrics.operations.length > 0) {
            const avgDuration = this.metrics.operations.reduce((sum, op) => sum + op.duration, 0) / this.metrics.operations.length;
            report.averageOperationTime = avgDuration.toFixed(2);
        }

        return report;
    }

    /**
     * 記錄效能報告到控制台
     */
    logPerformanceReport() {
        const report = this.getPerformanceReport();
        console.group('📊 效能報告');
        console.log('載入時間:', report.loadTime + 'ms');
        console.log('DOM 準備時間:', report.domReadyTime + 'ms');
        if (report.memoryUsage) {
            console.log('記憶體使用:', `${report.memoryUsage.used}MB / ${report.memoryUsage.limit}MB (${report.memoryUsage.percentage}%)`);
        }
        if (report.averageOperationTime) {
            console.log('平均操作時間:', report.averageOperationTime + 'ms');
        }
        console.log('最近操作:', report.operations.slice(-5));
        console.groupEnd();
    }
}

// ==================== DOM 操作優化工具 ====================

class DOMOptimizer {
    constructor() {
        this.batchUpdates = [];
        this.updateScheduled = false;
        this.cache = new Map();
    }

    /**
     * 批次更新 DOM
     */
    batchUpdate(updateFn) {
        this.batchUpdates.push(updateFn);

        if (!this.updateScheduled) {
            this.updateScheduled = true;
            requestAnimationFrame(() => {
                this.flushUpdates();
            });
        }
    }

    /**
     * 執行所有批次更新
     */
    flushUpdates() {
        const updates = this.batchUpdates.slice();
        this.batchUpdates = [];
        this.updateScheduled = false;

        // 使用 DocumentFragment 減少重排
        const fragment = document.createDocumentFragment();

        updates.forEach(updateFn => {
            try {
                updateFn(fragment);
            } catch (error) {
                console.error('批次更新失敗:', error);
            }
        });
    }

    /**
     * 快取 DOM 元素查詢
     */
    getCachedElement(selector) {
        if (this.cache.has(selector)) {
            return this.cache.get(selector);
        }

        const element = document.querySelector(selector);
        if (element) {
            this.cache.set(selector, element);
        }

        return element;
    }

    /**
     * 清除快取
     */
    clearCache() {
        this.cache.clear();
    }

    /**
     * 延遲載入圖片
     */
    lazyLoadImages(container) {
        if (!('IntersectionObserver' in window)) {
            // 不支援 IntersectionObserver，直接載入所有圖片
            return;
        }

        const images = container.querySelectorAll('img[data-src]');
        
        const imageObserver = new IntersectionObserver((entries, observer) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    const img = entry.target;
                    img.src = img.dataset.src;
                    img.removeAttribute('data-src');
                    observer.unobserve(img);
                }
            });
        });

        images.forEach(img => imageObserver.observe(img));
    }

    /**
     * 節流函數
     */
    throttle(func, delay) {
        let lastCall = 0;
        return function(...args) {
            const now = Date.now();
            if (now - lastCall >= delay) {
                lastCall = now;
                return func.apply(this, args);
            }
        };
    }

    /**
     * 防抖函數
     */
    debounce(func, delay) {
        let timeoutId;
        return function(...args) {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    /**
     * 虛擬滾動（用於大量列表項目）
     */
    virtualScroll(container, items, renderItem, itemHeight) {
        const visibleCount = Math.ceil(container.clientHeight / itemHeight) + 2;
        let scrollTop = 0;

        const render = () => {
            const startIndex = Math.floor(scrollTop / itemHeight);
            const endIndex = Math.min(startIndex + visibleCount, items.length);

            // 清空容器
            container.innerHTML = '';

            // 創建佔位空間
            const spacerTop = document.createElement('div');
            spacerTop.style.height = `${startIndex * itemHeight}px`;
            container.appendChild(spacerTop);

            // 渲染可見項目
            for (let i = startIndex; i < endIndex; i++) {
                const element = renderItem(items[i], i);
                container.appendChild(element);
            }

            // 創建底部佔位空間
            const spacerBottom = document.createElement('div');
            spacerBottom.style.height = `${(items.length - endIndex) * itemHeight}px`;
            container.appendChild(spacerBottom);
        };

        // 監聽滾動事件
        container.addEventListener('scroll', this.throttle(() => {
            scrollTop = container.scrollTop;
            render();
        }, 100));

        // 初始渲染
        render();
    }
}

// ==================== 數據快取系統 ====================

class DataCache {
    constructor(maxSize = 50, ttl = 300000) { // 預設快取5分鐘
        this.cache = new Map();
        this.maxSize = maxSize;
        this.ttl = ttl; // Time to live in milliseconds
    }

    /**
     * 設定快取
     */
    set(key, value) {
        try {
            // 如果快取已滿，移除最舊的項目
            if (this.cache.size >= this.maxSize) {
                const firstKey = this.cache.keys().next().value;
                this.cache.delete(firstKey);
            }

            this.cache.set(key, {
                value: value,
                timestamp: Date.now()
            });

        } catch (error) {
            console.error('設定快取失敗:', error);
        }
    }

    /**
     * 獲取快取
     */
    get(key) {
        try {
            const item = this.cache.get(key);

            if (!item) {
                return null;
            }

            // 檢查是否過期
            if (Date.now() - item.timestamp > this.ttl) {
                this.cache.delete(key);
                return null;
            }

            return item.value;

        } catch (error) {
            console.error('獲取快取失敗:', error);
            return null;
        }
    }

    /**
     * 檢查快取是否存在
     */
    has(key) {
        const item = this.cache.get(key);
        if (!item) return false;

        // 檢查是否過期
        if (Date.now() - item.timestamp > this.ttl) {
            this.cache.delete(key);
            return false;
        }

        return true;
    }

    /**
     * 刪除快取
     */
    delete(key) {
        this.cache.delete(key);
    }

    /**
     * 清除所有快取
     */
    clear() {
        this.cache.clear();
    }

    /**
     * 清除過期快取
     */
    clearExpired() {
        const now = Date.now();
        for (const [key, item] of this.cache.entries()) {
            if (now - item.timestamp > this.ttl) {
                this.cache.delete(key);
            }
        }
    }

    /**
     * 獲取快取大小
     */
    size() {
        return this.cache.size;
    }
}

// ==================== 瀏覽器相容性檢測系統 ====================

class BrowserCompatibility {
    constructor() {
        this.features = {
            localStorage: false,
            notifications: false,
            serviceWorker: false,
            intersectionObserver: false,
            requestAnimationFrame: false,
            fetch: false,
            promises: false,
            es6: false
        };
        this.browser = {
            name: '',
            version: '',
            isSupported: true
        };
        this.warnings = [];
    }

    /**
     * 初始化相容性檢測
     */
    initialize() {
        try {
            this.detectBrowser();
            this.checkFeatures();
            this.applyPolyfills();
            this.showCompatibilityWarnings();
            
            return this.browser.isSupported;

        } catch (error) {
            console.error('初始化相容性檢測失敗:', error);
            return false;
        }
    }

    /**
     * 檢測瀏覽器類型和版本
     */
    detectBrowser() {
        const ua = navigator.userAgent;
        
        // 檢測 Chrome
        if (ua.indexOf('Chrome') > -1 && ua.indexOf('Edge') === -1) {
            this.browser.name = 'Chrome';
            const match = ua.match(/Chrome\/(\d+)/);
            this.browser.version = match ? match[1] : 'unknown';
            this.browser.isSupported = parseInt(this.browser.version) >= 60;
        }
        // 檢測 Firefox
        else if (ua.indexOf('Firefox') > -1) {
            this.browser.name = 'Firefox';
            const match = ua.match(/Firefox\/(\d+)/);
            this.browser.version = match ? match[1] : 'unknown';
            this.browser.isSupported = parseInt(this.browser.version) >= 55;
        }
        // 檢測 Safari
        else if (ua.indexOf('Safari') > -1 && ua.indexOf('Chrome') === -1) {
            this.browser.name = 'Safari';
            const match = ua.match(/Version\/(\d+)/);
            this.browser.version = match ? match[1] : 'unknown';
            this.browser.isSupported = parseInt(this.browser.version) >= 11;
        }
        // 檢測 Edge
        else if (ua.indexOf('Edge') > -1 || ua.indexOf('Edg') > -1) {
            this.browser.name = 'Edge';
            const match = ua.match(/(?:Edge|Edg)\/(\d+)/);
            this.browser.version = match ? match[1] : 'unknown';
            this.browser.isSupported = parseInt(this.browser.version) >= 79;
        }
        // 其他瀏覽器
        else {
            this.browser.name = 'Unknown';
            this.browser.version = 'unknown';
            this.browser.isSupported = false;
            this.warnings.push('未知的瀏覽器，部分功能可能無法正常運作');
        }

        console.log(`瀏覽器: ${this.browser.name} ${this.browser.version}`);
    }

    /**
     * 檢查瀏覽器功能支援
     */
    checkFeatures() {
        // 檢查 LocalStorage
        this.features.localStorage = this.checkLocalStorage();
        
        // 檢查 Notifications API
        this.features.notifications = 'Notification' in window;
        
        // 檢查 Service Worker
        this.features.serviceWorker = 'serviceWorker' in navigator;
        
        // 檢查 IntersectionObserver
        this.features.intersectionObserver = 'IntersectionObserver' in window;
        
        // 檢查 requestAnimationFrame
        this.features.requestAnimationFrame = 'requestAnimationFrame' in window;
        
        // 檢查 Fetch API
        this.features.fetch = 'fetch' in window;
        
        // 檢查 Promises
        this.features.promises = 'Promise' in window;
        
        // 檢查 ES6 支援
        this.features.es6 = this.checkES6Support();

        // 記錄不支援的功能
        Object.keys(this.features).forEach(feature => {
            if (!this.features[feature]) {
                this.warnings.push(`不支援 ${feature}`);
            }
        });

        console.log('功能支援:', this.features);
    }

    /**
     * 檢查 LocalStorage 可用性
     */
    checkLocalStorage() {
        try {
            const testKey = '__test__';
            localStorage.setItem(testKey, 'test');
            localStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 檢查 ES6 支援
     */
    checkES6Support() {
        try {
            // 測試箭頭函數
            const arrow = () => true;
            // 測試 let/const
            let testLet = true;
            const testConst = true;
            // 測試模板字串
            const template = `test`;
            // 測試解構
            const [a, b] = [1, 2];
            
            return true;
        } catch (error) {
            return false;
        }
    }

    /**
     * 套用 Polyfills
     */
    applyPolyfills() {
        // requestAnimationFrame polyfill
        if (!this.features.requestAnimationFrame) {
            window.requestAnimationFrame = window.requestAnimationFrame ||
                window.webkitRequestAnimationFrame ||
                window.mozRequestAnimationFrame ||
                function(callback) {
                    return setTimeout(callback, 1000 / 60);
                };
        }

        // Promise polyfill (簡化版)
        if (!this.features.promises) {
            console.warn('Promise 不支援，部分功能可能無法使用');
        }

        // Fetch polyfill 提示
        if (!this.features.fetch) {
            console.warn('Fetch API 不支援，將使用 XMLHttpRequest 作為替代');
        }
    }

    /**
     * 顯示相容性警告
     */
    showCompatibilityWarnings() {
        if (!this.browser.isSupported) {
            const message = `您的瀏覽器 (${this.browser.name} ${this.browser.version}) 可能不完全支援此應用程式。建議使用最新版本的 Chrome、Firefox、Safari 或 Edge。`;
            console.warn(message);
            
            // 顯示警告訊息給使用者
            setTimeout(() => {
                if (confirm(message + '\n\n是否繼續使用？')) {
                    console.log('使用者選擇繼續使用');
                } else {
                    console.log('使用者選擇離開');
                }
            }, 1000);
        }

        if (this.warnings.length > 0 && this.warnings.length < 3) {
            console.warn('相容性警告:', this.warnings);
        }
    }

    /**
     * 獲取功能降級方案
     */
    getFallback(feature) {
        const fallbacks = {
            localStorage: {
                available: false,
                alternative: '使用記憶體儲存（重新整理後數據會遺失）'
            },
            notifications: {
                available: false,
                alternative: '使用視覺提示代替通知'
            },
            serviceWorker: {
                available: false,
                alternative: '離線功能不可用'
            },
            intersectionObserver: {
                available: false,
                alternative: '直接載入所有內容'
            }
        };

        return fallbacks[feature] || { available: false, alternative: '無替代方案' };
    }

    /**
     * 檢查是否支援特定功能
     */
    isFeatureSupported(feature) {
        return this.features[feature] || false;
    }
}

// ==================== 離線功能管理系統 ====================

class OfflineManager {
    constructor() {
        this.isOnline = navigator.onLine;
        this.pendingOperations = [];
        this.syncInProgress = false;
        this.listeners = [];
    }

    /**
     * 初始化離線管理
     */
    initialize() {
        try {
            // 監聽線上/離線狀態變化
            window.addEventListener('online', () => {
                this.handleOnline();
            });

            window.addEventListener('offline', () => {
                this.handleOffline();
            });

            // 初始狀態檢查
            this.updateOnlineStatus();

            console.log('離線管理系統已初始化');
            return true;

        } catch (error) {
            console.error('初始化離線管理失敗:', error);
            return false;
        }
    }

    /**
     * 更新線上狀態
     */
    updateOnlineStatus() {
        this.isOnline = navigator.onLine;
        this.updateUI();
    }

    /**
     * 處理上線事件
     */
    handleOnline() {
        console.log('網路連線已恢復');
        this.isOnline = true;
        this.updateUI();
        this.showNotification('✅ 網路連線已恢復', 'success');
        
        // 同步待處理的操作
        this.syncPendingOperations();
        
        // 通知監聽器
        this.notifyListeners('online');
    }

    /**
     * 處理離線事件
     */
    handleOffline() {
        console.log('網路連線已中斷');
        this.isOnline = false;
        this.updateUI();
        this.showNotification('⚠️ 網路連線已中斷，數據將在本地儲存', 'warning');
        
        // 通知監聽器
        this.notifyListeners('offline');
    }

    /**
     * 更新 UI 顯示線上/離線狀態
     */
    updateUI() {
        // 檢查是否有狀態指示器
        let indicator = document.getElementById('online-status-indicator');
        
        if (!indicator) {
            // 創建狀態指示器
            indicator = document.createElement('div');
            indicator.id = 'online-status-indicator';
            indicator.style.cssText = `
                position: fixed;
                top: 10px;
                right: 10px;
                padding: 8px 16px;
                border-radius: 20px;
                font-size: 0.85em;
                font-weight: 600;
                z-index: 9999;
                display: none;
                align-items: center;
                gap: 6px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                transition: all 0.3s ease;
            `;
            document.body.appendChild(indicator);
        }

        if (!this.isOnline) {
            indicator.style.display = 'flex';
            indicator.style.background = '#ff7675';
            indicator.style.color = 'white';
            indicator.innerHTML = '⚠️ 離線模式';
        } else {
            // 線上時隱藏指示器（或顯示短暫的成功訊息）
            indicator.style.display = 'flex';
            indicator.style.background = '#00b894';
            indicator.style.color = 'white';
            indicator.innerHTML = '✓ 已連線';
            
            // 3秒後隱藏
            setTimeout(() => {
                indicator.style.display = 'none';
            }, 3000);
        }
    }

    /**
     * 顯示通知訊息
     */
    showNotification(message, type = 'info') {
        // 使用現有的 showCelebration 函數或創建簡單通知
        if (typeof showCelebration === 'function') {
            showCelebration(message);
        } else {
            console.log(message);
        }
    }

    /**
     * 添加待處理操作
     */
    addPendingOperation(operation) {
        try {
            this.pendingOperations.push({
                ...operation,
                timestamp: Date.now(),
                id: this.generateOperationId()
            });

            // 儲存到 localStorage
            this.savePendingOperations();

            console.log('已添加待處理操作:', operation);

        } catch (error) {
            console.error('添加待處理操作失敗:', error);
        }
    }

    /**
     * 同步待處理操作
     */
    async syncPendingOperations() {
        if (this.syncInProgress || !this.isOnline || this.pendingOperations.length === 0) {
            return;
        }

        this.syncInProgress = true;
        console.log(`開始同步 ${this.pendingOperations.length} 個待處理操作`);

        try {
            // 處理每個待處理操作
            const operations = [...this.pendingOperations];
            this.pendingOperations = [];

            for (const operation of operations) {
                try {
                    await this.executeOperation(operation);
                    console.log('操作已同步:', operation);
                } catch (error) {
                    console.error('同步操作失敗:', operation, error);
                    // 如果失敗，重新加入待處理列表
                    this.pendingOperations.push(operation);
                }
            }

            // 更新儲存
            this.savePendingOperations();

            if (this.pendingOperations.length === 0) {
                this.showNotification('✅ 所有數據已同步', 'success');
            }

        } catch (error) {
            console.error('同步失敗:', error);
        } finally {
            this.syncInProgress = false;
        }
    }

    /**
     * 執行操作
     */
    async executeOperation(operation) {
        // 這裡可以根據操作類型執行不同的邏輯
        // 目前只是模擬執行
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log('執行操作:', operation);
                resolve();
            }, 100);
        });
    }

    /**
     * 儲存待處理操作到 localStorage
     */
    savePendingOperations() {
        try {
            localStorage.setItem('pendingOperations', JSON.stringify(this.pendingOperations));
        } catch (error) {
            console.error('儲存待處理操作失敗:', error);
        }
    }

    /**
     * 載入待處理操作
     */
    loadPendingOperations() {
        try {
            const saved = localStorage.getItem('pendingOperations');
            if (saved) {
                this.pendingOperations = JSON.parse(saved);
                console.log(`載入了 ${this.pendingOperations.length} 個待處理操作`);
            }
        } catch (error) {
            console.error('載入待處理操作失敗:', error);
            this.pendingOperations = [];
        }
    }

    /**
     * 生成操作 ID
     */
    generateOperationId() {
        return `op_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    /**
     * 添加狀態變化監聽器
     */
    addListener(callback) {
        this.listeners.push(callback);
    }

    /**
     * 通知監聽器
     */
    notifyListeners(status) {
        this.listeners.forEach(callback => {
            try {
                callback(status, this.isOnline);
            } catch (error) {
                console.error('監聽器執行失敗:', error);
            }
        });
    }

    /**
     * 檢查是否在線
     */
    checkOnlineStatus() {
        return this.isOnline;
    }

    /**
     * 獲取待處理操作數量
     */
    getPendingCount() {
        return this.pendingOperations.length;
    }
}

// ==================== 全域實例 ====================

let browserCompatibility = null;
let offlineManager = null;

// 在初始化時調用無障礙功能
document.addEventListener('DOMContentLoaded', () => {
    initAccessibility();
    
    // 初始化瀏覽器相容性檢測
    browserCompatibility = new BrowserCompatibility();
    const isCompatible = browserCompatibility.initialize();
    
    if (!isCompatible) {
        console.warn('瀏覽器相容性檢測發現問題');
    }
    
    // 初始化離線管理
    offlineManager = new OfflineManager();
    offlineManager.initialize();
    offlineManager.loadPendingOperations();
    
    // 如果有待處理操作且目前在線，嘗試同步
    if (offlineManager.checkOnlineStatus() && offlineManager.getPendingCount() > 0) {
        offlineManager.syncPendingOperations();
    }
});
