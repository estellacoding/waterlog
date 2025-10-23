// 遊戲數據
let gameData = {
    level: 1,
    exp: 0,
    maxExp: 100,
    todayAmount: 0,
    dailyGoal: 2000,
    totalAmount: 0,
    history: [],
    achievements: []
};

// 成就定義
const achievementDefinitions = [
    { id: 'first_drink', name: '第一滴水', description: '記錄第一次喝水', icon: '💧', requirement: 1 },
    { id: 'daily_goal', name: '今日達標', description: '完成每日目標', icon: '🎯', requirement: 'daily' },
    { id: 'water_warrior', name: '水之戰士', description: '累計喝水5000ml', icon: '⚔️', requirement: 5000 },
    { id: 'hydration_master', name: '水分大師', description: '累計喝水10000ml', icon: '🏆', requirement: 10000 },
    { id: 'level_5', name: '五級水精靈', description: '達到5級', icon: '⭐', requirement: 'level_5' },
    { id: 'consistent', name: '堅持不懈', description: '連續7天達標', icon: '🔥', requirement: 'streak_7' }
];

// 角色進化階段
const characterStages = {
    1: { emoji: '🌱', name: '小水滴' },
    2: { emoji: '🌿', name: '水苗' },
    3: { emoji: '🌊', name: '水精靈' },
    4: { emoji: '🐉', name: '水龍' },
    5: { emoji: '👑', name: '水之王' }
};

// 初始化遊戲
function initGame() {
    loadGameData();
    updateUI();
    renderAchievements();
    renderHistory();
    
    // 檢查是否是新的一天
    checkNewDay();
}

// 載入遊戲數據
function loadGameData() {
    const saved = localStorage.getItem('waterGameData');
    if (saved) {
        gameData = { ...gameData, ...JSON.parse(saved) };
    }
    
    // 確保今日數據正確
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastPlayDate');
    
    if (lastDate !== today) {
        gameData.todayAmount = 0;
        gameData.history = [];
        localStorage.setItem('lastPlayDate', today);
    }
}

// 保存遊戲數據
function saveGameData() {
    localStorage.setItem('waterGameData', JSON.stringify(gameData));
}

// 檢查新的一天
function checkNewDay() {
    const today = new Date().toDateString();
    const lastDate = localStorage.getItem('lastPlayDate');
    
    if (lastDate && lastDate !== today) {
        // 新的一天，重置每日數據
        gameData.todayAmount = 0;
        gameData.history = [];
        saveGameData();
    }
}

// 添加水量
function addWater(amount) {
    gameData.todayAmount += amount;
    gameData.totalAmount += amount;
    
    // 添加經驗值
    const expGain = Math.floor(amount / 10);
    addExp(expGain);
    
    // 記錄歷史
    const now = new Date();
    gameData.history.unshift({
        time: now.toLocaleTimeString('zh-TW', { hour: '2-digit', minute: '2-digit' }),
        amount: amount,
        exp: expGain
    });
    
    // 檢查成就
    checkAchievements();
    
    // 更新UI
    updateUI();
    renderHistory();
    
    // 保存數據
    saveGameData();
    
    // 顯示慶祝動畫
    if (gameData.todayAmount >= gameData.dailyGoal) {
        showCelebration('🎉 恭喜完成今日目標！');
    }
}

// 添加自訂水量
function addCustomWater() {
    const input = document.getElementById('customAmount');
    const amount = parseInt(input.value);
    
    if (amount && amount > 0 && amount <= 1000) {
        addWater(amount);
        input.value = '';
    } else {
        alert('請輸入1-1000之間的數字');
    }
}

// 添加經驗值
function addExp(exp) {
    gameData.exp += exp;
    
    // 檢查升級
    while (gameData.exp >= gameData.maxExp) {
        levelUp();
    }
}

// 升級
function levelUp() {
    gameData.exp -= gameData.maxExp;
    gameData.level++;
    gameData.maxExp = Math.floor(gameData.maxExp * 1.2);
    
    showCelebration(`🎊 升級了！現在是 ${gameData.level} 級！`);
    
    // 更新角色外觀
    updateCharacter();
}

// 更新角色外觀
function updateCharacter() {
    const character = document.querySelector('.water-sprite');
    const characterName = document.querySelector('.character-name');
    
    const level = Math.min(gameData.level, 5);
    const stage = characterStages[level];
    
    character.textContent = stage.emoji;
    character.className = `water-sprite sprite-level-${level}`;
    characterName.textContent = stage.name;
}

// 更新UI
function updateUI() {
    // 更新等級和經驗值
    document.getElementById('level').textContent = gameData.level;
    document.getElementById('currentExp').textContent = gameData.exp;
    document.getElementById('maxExp').textContent = gameData.maxExp;
    
    const expPercent = (gameData.exp / gameData.maxExp) * 100;
    document.getElementById('expFill').style.width = `${expPercent}%`;
    
    // 更新每日進度
    document.getElementById('todayAmount').textContent = gameData.todayAmount;
    const dailyPercent = Math.min((gameData.todayAmount / gameData.dailyGoal) * 100, 100);
    document.getElementById('dailyProgress').style.width = `${dailyPercent}%`;
    
    // 更新角色
    updateCharacter();
}

// 檢查成就
function checkAchievements() {
    achievementDefinitions.forEach(achievement => {
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
            showCelebration(`🏆 解鎖成就：${achievement.name}！`);
        }
    });
    
    renderAchievements();
}

// 渲染成就
function renderAchievements() {
    const container = document.getElementById('achievementList');
    container.innerHTML = '';
    
    achievementDefinitions.forEach(achievement => {
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
}

// 渲染歷史記錄
function renderHistory() {
    const container = document.getElementById('historyList');
    container.innerHTML = '';
    
    if (gameData.history.length === 0) {
        container.innerHTML = '<div style="text-align: center; color: #999;">今天還沒有記錄喔！</div>';
        return;
    }
    
    gameData.history.forEach(record => {
        const item = document.createElement('div');
        item.className = 'history-item';
        
        item.innerHTML = `
            <span>${record.time}</span>
            <span>+${record.amount}ml (+${record.exp} EXP)</span>
        `;
        
        container.appendChild(item);
    });
}

// 顯示慶祝動畫
function showCelebration(message) {
    const celebration = document.getElementById('celebration');
    const text = document.getElementById('celebrationText');
    
    text.textContent = message;
    celebration.style.display = 'flex';
    
    setTimeout(() => {
        celebration.style.display = 'none';
    }, 2000);
}

// 點擊慶祝動畫關閉
document.getElementById('celebration').addEventListener('click', function() {
    this.style.display = 'none';
});

// 初始化遊戲
document.addEventListener('DOMContentLoaded', initGame);

// 鍵盤快捷鍵
document.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' && document.getElementById('customAmount') === document.activeElement) {
        addCustomWater();
    }
});