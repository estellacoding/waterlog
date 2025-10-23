# Supabase 整合指南

## 快速開始

### 1. 建立 Supabase 專案

1. 前往 [Supabase](https://supabase.com) 註冊帳號
2. 建立新專案
3. 等待資料庫初始化完成（約 2 分鐘）

### 2. 執行資料庫結構

1. 在 Supabase Dashboard 中，進入 **SQL Editor**
2. 複製 `schema.sql` 的內容
3. 貼上並執行

### 3. 設定配置檔

1. 複製 `config.example.js` 為 `config.js`
2. 在 Supabase Dashboard 的 **Settings > API** 中找到：
   - Project URL
   - anon/public key
3. 填入 `config.js`

### 4. 在 HTML 中引入

在 `index.html` 的 `<head>` 中加入：

```html
<!-- Supabase JS SDK -->
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>

<!-- Supabase 配置 -->
<script src="supabase/config.js"></script>
```

## 資料庫結構

### 資料表

#### `user_settings` - 使用者設定
- `user_id` (UUID, PK): 使用者 ID
- `daily_goal` (INTEGER): 每日目標（1000-5000ml）
- `quick_buttons` (INTEGER[]): 快速按鈕水量
- `notifications_enabled` (BOOLEAN): 是否啟用通知
- `notification_schedule` (TIME[]): 通知時間表
- `theme` (VARCHAR): 主題（light/dark/auto）
- `language` (VARCHAR): 語言

#### `user_progress` - 使用者進度
- `user_id` (UUID, PK): 使用者 ID
- `level` (INTEGER): 等級（1-100）
- `exp` (INTEGER): 經驗值
- `max_exp` (INTEGER): 升級所需經驗值
- `total_amount` (INTEGER): 累計飲水量

#### `water_records` - 飲水記錄
- `id` (UUID, PK): 記錄 ID
- `user_id` (UUID): 使用者 ID
- `amount` (INTEGER): 水量（ml）
- `recorded_at` (TIMESTAMPTZ): 記錄時間

#### `achievements` - 成就
- `id` (UUID, PK): 成就 ID
- `user_id` (UUID): 使用者 ID
- `achievement_id` (VARCHAR): 成就識別碼
- `unlocked_at` (TIMESTAMPTZ): 解鎖時間

#### `daily_stats` - 每日統計
- `user_id` (UUID): 使用者 ID
- `date` (DATE): 日期
- `total_amount` (INTEGER): 當日總水量
- `record_count` (INTEGER): 記錄次數
- `goal_achieved` (BOOLEAN): 是否達標

### 實用函式

#### `get_today_water_amount(user_id)`
取得使用者今日總飲水量

```sql
SELECT get_today_water_amount('user-uuid-here');
```

#### `get_streak_days(user_id)`
取得使用者連續達標天數

```sql
SELECT get_streak_days('user-uuid-here');
```

#### `get_recent_stats(user_id, days)`
取得使用者最近 N 天的統計

```sql
SELECT * FROM get_recent_stats('user-uuid-here', 7);
```

## 安全性

### Row Level Security (RLS)

所有資料表都啟用了 RLS，確保：
- 使用者只能存取自己的資料
- 無法查看或修改其他使用者的資料
- 自動驗證所有資料庫操作

### 認證

使用 Supabase Auth 提供：
- Email/密碼登入
- 社交登入（Google, GitHub 等）
- Magic Link（無密碼登入）
- 自動 session 管理

## API 使用範例

### 初始化客戶端

```javascript
const supabase = supabase.createClient(
    SUPABASE_CONFIG.url,
    SUPABASE_CONFIG.anonKey,
    SUPABASE_CONFIG.options
);
```

### 使用者註冊

```javascript
const { data, error } = await supabase.auth.signUp({
    email: 'user@example.com',
    password: 'secure-password'
});
```

### 使用者登入

```javascript
const { data, error } = await supabase.auth.signInWithPassword({
    email: 'user@example.com',
    password: 'secure-password'
});
```

### 新增飲水記錄

```javascript
const { data, error } = await supabase
    .from('water_records')
    .insert({
        amount: 250,
        recorded_at: new Date().toISOString()
    });
```

### 查詢今日記錄

```javascript
const today = new Date().toISOString().split('T')[0];

const { data, error } = await supabase
    .from('water_records')
    .select('*')
    .gte('recorded_at', `${today}T00:00:00`)
    .order('recorded_at', { ascending: false });
```

### 更新使用者進度

```javascript
const { data, error } = await supabase
    .from('user_progress')
    .update({
        level: 2,
        exp: 50,
        max_exp: 200
    })
    .eq('user_id', userId);
```

### 即時訂閱

```javascript
// 訂閱飲水記錄變更
const subscription = supabase
    .channel('water_records_changes')
    .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'water_records',
        filter: `user_id=eq.${userId}`
    }, (payload) => {
        console.log('新記錄:', payload.new);
        updateUI();
    })
    .subscribe();
```

## 離線支援

建議實作策略：
1. 使用 LocalStorage 作為本地快取
2. 有網路時自動同步到 Supabase
3. 離線時儲存到本地佇列
4. 恢復網路時批次上傳

## 資料遷移

從現有 LocalStorage 遷移到 Supabase：

```javascript
async function migrateLocalData() {
    // 讀取本地數據
    const localData = JSON.parse(localStorage.getItem('waterGameData'));
    
    // 上傳進度
    await supabase.from('user_progress').upsert({
        level: localData.level,
        exp: localData.exp,
        max_exp: localData.maxExp,
        total_amount: localData.totalAmount
    });
    
    // 上傳歷史記錄
    const records = localData.history.map(record => ({
        amount: record.amount,
        recorded_at: record.time
    }));
    
    await supabase.from('water_records').insert(records);
    
    // 上傳成就
    const achievements = localData.achievements.map(id => ({
        achievement_id: id
    }));
    
    await supabase.from('achievements').insert(achievements);
}
```

## 效能優化

### 索引
資料庫已建立適當索引以優化常見查詢：
- 使用者 ID 索引
- 日期範圍查詢索引
- 複合索引（user_id + date）

### 快取策略
- 使用 Supabase 的內建快取
- 實作客戶端快取減少 API 呼叫
- 使用 `select` 只查詢需要的欄位

### 批次操作
- 使用 `insert` 批次新增多筆記錄
- 使用 `upsert` 處理更新或插入

## 故障排除

### 常見問題

**Q: RLS 政策導致無法存取資料？**
A: 確認使用者已登入且 `auth.uid()` 正確

**Q: 觸發器沒有執行？**
A: 檢查 Supabase Dashboard 的 Database > Functions

**Q: 時區問題？**
A: 資料庫已設定為 Asia/Taipei，確保客戶端也使用相同時區

**Q: 連線錯誤？**
A: 檢查 API key 和 URL 是否正確，確認網路連線

## 監控與除錯

### Supabase Dashboard
- **Table Editor**: 直接查看和編輯資料
- **SQL Editor**: 執行自訂查詢
- **Database > Logs**: 查看資料庫日誌
- **Auth > Users**: 管理使用者

### 客戶端除錯

```javascript
// 啟用詳細日誌
const supabase = createClient(url, key, {
    ...options,
    global: {
        ...options.global,
        fetch: (...args) => {
            console.log('Supabase request:', args);
            return fetch(...args);
        }
    }
});
```

## 成本估算

### 免費方案限制
- 500MB 資料庫空間
- 50MB 檔案儲存
- 2GB 頻寬/月
- 50,000 月活躍使用者

### 升級建議
- 個人使用：免費方案足夠
- 小型團隊：Pro 方案 ($25/月)
- 成長中應用：Team 方案 ($599/月)

## 參考資源

- [Supabase 官方文件](https://supabase.com/docs)
- [JavaScript SDK 文件](https://supabase.com/docs/reference/javascript)
- [Row Level Security 指南](https://supabase.com/docs/guides/auth/row-level-security)
- [即時訂閱文件](https://supabase.com/docs/guides/realtime)
