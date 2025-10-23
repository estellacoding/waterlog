-- ==================== 水精靈養成記 - Supabase 資料庫結構 ====================
-- 版本: 2.0
-- 最後更新: 2025-10-23
-- 
-- 注意事項:
-- 1. 此腳本假設在 Supabase 託管環境執行
-- 2. 時區處理統一使用 'Asia/Taipei'
-- 3. 所有表都啟用 Row Level Security (RLS)
-- 4. 使用 SECURITY DEFINER 的函式已限制執行權限

-- ==================== 使用者設定表 ====================
CREATE TABLE IF NOT EXISTS user_settings (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    daily_goal INTEGER NOT NULL DEFAULT 2000 CHECK (daily_goal >= 1000 AND daily_goal <= 5000),
    quick_buttons INTEGER[] NOT NULL DEFAULT ARRAY[250, 500, 100]::INTEGER[],
    notifications_enabled BOOLEAN NOT NULL DEFAULT false,
    notification_schedule TIME[] DEFAULT ARRAY[]::TIME[],
    theme VARCHAR(20) NOT NULL DEFAULT 'auto' CHECK (theme IN ('light', 'dark', 'auto')),
    language VARCHAR(20) NOT NULL DEFAULT 'zh-TW',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_settings IS '使用者個人設定';
COMMENT ON COLUMN user_settings.daily_goal IS '每日飲水目標（毫升）';
COMMENT ON COLUMN user_settings.quick_buttons IS '快速添加按鈕的水量設定';
COMMENT ON COLUMN user_settings.notification_schedule IS '提醒時間表（最多8個）';

-- ==================== 使用者進度表 ====================
CREATE TABLE IF NOT EXISTS user_progress (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    level INTEGER NOT NULL DEFAULT 1 CHECK (level >= 1 AND level <= 100),
    exp INTEGER NOT NULL DEFAULT 0 CHECK (exp >= 0),
    max_exp INTEGER NOT NULL DEFAULT 100 CHECK (max_exp > 0),
    total_amount INTEGER NOT NULL DEFAULT 0 CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE user_progress IS '使用者遊戲進度（等級、經驗值）';

-- ==================== 飲水記錄表 ====================
CREATE TABLE IF NOT EXISTS water_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    amount INTEGER NOT NULL CHECK (amount > 0 AND amount <= 10000),
    recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    -- 新增：儲存計算好的日期欄位以優化查詢
    recorded_date DATE GENERATED ALWAYS AS (
        (recorded_at AT TIME ZONE 'Asia/Taipei')::DATE
    ) STORED,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE water_records IS '飲水記錄';
COMMENT ON COLUMN water_records.recorded_date IS '記錄日期（台北時區），自動計算';

-- 優化後的索引策略
CREATE INDEX IF NOT EXISTS idx_water_records_user_id ON water_records(user_id);
CREATE INDEX IF NOT EXISTS idx_water_records_recorded_at ON water_records(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_water_records_user_date ON water_records(user_id, recorded_date);

-- ==================== 成就表 ====================
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    achievement_id VARCHAR(50) NOT NULL,
    unlocked_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 確保每個使用者的成就不重複
    CONSTRAINT achievements_user_achievement_unique 
        UNIQUE (user_id, achievement_id)
);

CREATE INDEX IF NOT EXISTS idx_achievements_user_id ON achievements(user_id);

COMMENT ON TABLE achievements IS '已解鎖的成就';

-- ==================== 每日統計表 ====================
CREATE TABLE IF NOT EXISTS daily_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    total_amount INTEGER NOT NULL DEFAULT 0,
    record_count INTEGER NOT NULL DEFAULT 0,
    goal_achieved BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT daily_stats_user_date_unique UNIQUE (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_stats_user_id ON daily_stats(user_id);
CREATE INDEX IF NOT EXISTS idx_daily_stats_date ON daily_stats(date DESC);
CREATE INDEX IF NOT EXISTS idx_daily_stats_user_date ON daily_stats(user_id, date DESC);

COMMENT ON TABLE daily_stats IS '每日統計資料（自動彙總）';

-- ==================== 自動更新 updated_at 的觸發器 ====================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    -- 只在資料真正改變時更新 updated_at
    IF ROW(NEW.*) IS DISTINCT FROM ROW(OLD.*) THEN
        NEW.updated_at = NOW();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at
    BEFORE UPDATE ON user_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_progress_updated_at
    BEFORE UPDATE ON user_progress
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_daily_stats_updated_at
    BEFORE UPDATE ON daily_stats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ==================== 自動更新每日統計的觸發器 ====================
CREATE OR REPLACE FUNCTION update_daily_stats()
RETURNS TRIGGER AS $$
DECLARE
    record_date DATE;
    user_goal INTEGER;
BEGIN
    -- 取得記錄日期（使用 stored column 的值）
    record_date := NEW.recorded_date;
    
    -- 取得使用者目標
    SELECT daily_goal INTO user_goal 
    FROM user_settings 
    WHERE user_id = NEW.user_id;
    
    -- 如果沒有設定，使用預設值
    IF user_goal IS NULL THEN
        user_goal := 2000;
    END IF;
    
    -- 插入或更新每日統計
    INSERT INTO daily_stats (user_id, date, total_amount, record_count, goal_achieved)
    VALUES (
        NEW.user_id,
        record_date,
        NEW.amount,
        1,
        NEW.amount >= user_goal
    )
    ON CONFLICT (user_id, date) 
    DO UPDATE SET
        total_amount = daily_stats.total_amount + EXCLUDED.total_amount,
        record_count = daily_stats.record_count + 1,
        goal_achieved = (daily_stats.total_amount + EXCLUDED.total_amount) >= user_goal,
        updated_at = NOW();
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER water_records_update_daily_stats
    AFTER INSERT ON water_records
    FOR EACH ROW
    EXECUTE FUNCTION update_daily_stats();

-- ==================== 新使用者初始化觸發器 ====================
CREATE OR REPLACE FUNCTION initialize_new_user()
RETURNS TRIGGER AS $$
BEGIN
    -- 建立預設設定
    INSERT INTO user_settings (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    -- 建立初始進度
    INSERT INTO user_progress (user_id)
    VALUES (NEW.id)
    ON CONFLICT (user_id) DO NOTHING;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 限制函式執行權限
REVOKE EXECUTE ON FUNCTION initialize_new_user() FROM PUBLIC, anon, authenticated;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION initialize_new_user();

-- ==================== Row Level Security (RLS) 政策 ====================

-- 啟用 RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE water_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_stats ENABLE ROW LEVEL SECURITY;

-- user_settings 政策
CREATE POLICY "使用者只能查看自己的設定"
    ON user_settings FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "使用者只能更新自己的設定"
    ON user_settings FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "使用者只能插入自己的設定"
    ON user_settings FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- user_progress 政策
CREATE POLICY "使用者只能查看自己的進度"
    ON user_progress FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "使用者只能更新自己的進度"
    ON user_progress FOR UPDATE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "使用者只能插入自己的進度"
    ON user_progress FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- water_records 政策
CREATE POLICY "使用者只能查看自己的記錄"
    ON water_records FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "使用者只能新增自己的記錄"
    ON water_records FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

CREATE POLICY "使用者只能刪除自己的記錄"
    ON water_records FOR DELETE
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- achievements 政策
CREATE POLICY "使用者只能查看自己的成就"
    ON achievements FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

CREATE POLICY "使用者只能新增自己的成就"
    ON achievements FOR INSERT
    TO authenticated
    WITH CHECK ((SELECT auth.uid()) = user_id);

-- daily_stats 政策
CREATE POLICY "使用者只能查看自己的統計"
    ON daily_stats FOR SELECT
    TO authenticated
    USING ((SELECT auth.uid()) = user_id);

-- ==================== 實用的查詢函式 ====================

-- 取得使用者今日飲水量
CREATE OR REPLACE FUNCTION get_today_water_amount(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    today_amount INTEGER;
    today_date DATE;
BEGIN
    -- 明確計算今天的日期（台北時區）
    today_date := (NOW() AT TIME ZONE 'Asia/Taipei')::DATE;
    
    SELECT COALESCE(SUM(amount), 0) INTO today_amount
    FROM water_records
    WHERE user_id = p_user_id
        AND recorded_date = today_date;
    
    RETURN today_amount;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_today_water_amount IS '取得使用者今日總飲水量（台北時區）';

-- 限制函式執行權限
REVOKE EXECUTE ON FUNCTION get_today_water_amount(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_today_water_amount(UUID) TO authenticated;

-- 取得使用者連續達標天數
CREATE OR REPLACE FUNCTION get_streak_days(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
    streak_count INTEGER := 0;
    check_date DATE;
    daily_goal INTEGER;
BEGIN
    -- 從今天開始（台北時區）
    check_date := (NOW() AT TIME ZONE 'Asia/Taipei')::DATE;
    
    -- 取得使用者目標
    SELECT us.daily_goal INTO daily_goal 
    FROM user_settings us
    WHERE us.user_id = p_user_id;
    
    IF daily_goal IS NULL THEN
        daily_goal := 2000;
    END IF;
    
    -- 從今天開始往回檢查
    LOOP
        -- 檢查該日是否達標
        IF EXISTS (
            SELECT 1 FROM daily_stats
            WHERE user_id = p_user_id
                AND date = check_date
                AND goal_achieved = true
        ) THEN
            streak_count := streak_count + 1;
            check_date := check_date - 1;  -- 使用 integer 減法
        ELSE
            EXIT;
        END IF;
    END LOOP;
    
    RETURN streak_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_streak_days IS '取得使用者連續達標天數';

-- 限制函式執行權限
REVOKE EXECUTE ON FUNCTION get_streak_days(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_streak_days(UUID) TO authenticated;

-- 取得使用者最近 N 天的統計
CREATE OR REPLACE FUNCTION get_recent_stats(p_user_id UUID, p_days INTEGER DEFAULT 7)
RETURNS TABLE (
    date DATE,
    total_amount INTEGER,
    record_count INTEGER,
    goal_achieved BOOLEAN
) AS $$
DECLARE
    start_date DATE;
BEGIN
    -- 計算起始日期（包含今天）
    start_date := (NOW() AT TIME ZONE 'Asia/Taipei')::DATE - (p_days - 1);
    
    RETURN QUERY
    SELECT 
        ds.date,
        ds.total_amount,
        ds.record_count,
        ds.goal_achieved
    FROM daily_stats ds
    WHERE ds.user_id = p_user_id
        AND ds.date >= start_date
    ORDER BY ds.date DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION get_recent_stats IS '取得使用者最近 N 天的統計資料（含今天）';

-- 限制函式執行權限
REVOKE EXECUTE ON FUNCTION get_recent_stats(UUID, INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION get_recent_stats(UUID, INTEGER) TO authenticated;

-- ==================== 資料庫維護函式 ====================

-- 清理舊的飲水記錄（保留最近 90 天）
CREATE OR REPLACE FUNCTION cleanup_old_records()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        DELETE FROM water_records
        WHERE recorded_at < NOW() - INTERVAL '90 days'
        RETURNING *
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMENT ON FUNCTION cleanup_old_records IS '清理 90 天前的飲水記錄（保留 daily_stats）';

-- 限制函式執行權限（僅管理員可執行）
REVOKE EXECUTE ON FUNCTION cleanup_old_records() FROM PUBLIC, authenticated, anon;

-- ==================== 效能優化建議 ====================
-- 
-- 1. 定期執行 VACUUM ANALYZE 以優化查詢效能
-- 2. 監控 daily_stats 表的大小，考慮分區（partition）策略
-- 3. 根據實際查詢模式調整索引
-- 4. 使用 pg_stat_statements 分析慢查詢
-- 
-- ==================== 備份建議 ====================
-- 
-- 1. Supabase 自動備份（每日）
-- 2. 重要操作前手動建立快照
-- 3. 定期匯出使用者數據作為額外備份
-- 
