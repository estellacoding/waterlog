// ==================== Supabase 客戶端管理 ====================

class SupabaseClient {
    constructor() {
        this.client = null;
        this.currentUser = null;
        this.isOnline = navigator.onLine;
        this.syncQueue = [];

        // 監聽網路狀態
        window.addEventListener('online', () => this.handleOnline());
        window.addEventListener('offline', () => this.handleOffline());
    }

    /**
     * 初始化 Supabase 客戶端
     */
    async initialize() {
        try {
            if (typeof supabase === 'undefined') {
                throw new Error('Supabase SDK 未載入');
            }

            if (typeof SUPABASE_CONFIG === 'undefined') {
                throw new Error('Supabase 配置未載入');
            }

            // 建立客戶端
            this.client = supabase.createClient(
                SUPABASE_CONFIG.url,
                SUPABASE_CONFIG.anonKey,
                SUPABASE_CONFIG.options
            );

            // 檢查現有 session
            const { data: { session } } = await this.client.auth.getSession();
            if (session) {
                this.currentUser = session.user;
                console.log('使用者已登入:', this.currentUser.email);
            }

            // 監聽認證狀態變更
            this.client.auth.onAuthStateChange((event, session) => {
                console.log('認證狀態變更:', event);
                this.currentUser = session?.user || null;

                if (event === 'SIGNED_IN') {
                    this.onSignIn();
                } else if (event === 'SIGNED_OUT') {
                    this.onSignOut();
                }
            });

            return true;
        } catch (error) {
            console.error('Supabase 初始化失敗:', error);
            return false;
        }
    }

    /**
     * 檢查是否已登入
     */
    isAuthenticated() {
        return this.currentUser !== null;
    }

    /**
     * 取得當前使用者
     */
    getCurrentUser() {
        return this.currentUser;
    }

    /**
     * 使用者註冊
     */
    async signUp(email, password, metadata = {}) {
        try {
            const { data, error } = await this.client.auth.signUp({
                email,
                password,
                options: {
                    data: metadata
                }
            });

            if (error) throw error;

            console.log('註冊成功:', data.user?.email);
            return { success: true, user: data.user };
        } catch (error) {
            console.error('註冊失敗:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 使用者登入
     */
    async signIn(email, password) {
        try {
            const { data, error } = await this.client.auth.signInWithPassword({
                email,
                password
            });

            if (error) throw error;

            console.log('登入成功:', data.user.email);
            return { success: true, user: data.user };
        } catch (error) {
            console.error('登入失敗:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Google OAuth 登入
     */
    async signInWithGoogle() {
        try {
            const { error } = await this.client.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                    queryParams: {
                        access_type: 'offline',
                        prompt: 'consent'
                    }
                }
            });

            if (error) throw error;

            console.log('Google 登入流程已啟動');
            return { success: true };
        } catch (error) {
            console.error('Google 登入失敗:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 使用者登出
     */
    async signOut() {
        try {
            const { error } = await this.client.auth.signOut();
            if (error) throw error;

            console.log('登出成功');
            return { success: true };
        } catch (error) {
            console.error('登出失敗:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Magic Link 登入
     */
    async signInWithMagicLink(email) {
        try {
            const { error } = await this.client.auth.signInWithOtp({
                email,
                options: {
                    emailRedirectTo: window.location.origin
                }
            });

            if (error) throw error;

            console.log('Magic Link 已發送至:', email);
            return { success: true };
        } catch (error) {
            console.error('Magic Link 發送失敗:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * 登入後的處理
     */
    async onSignIn() {
        console.log('使用者登入，開始同步數據...');

        // 從雲端載入數據
        await this.loadUserData();

        // 同步本地佇列
        await this.syncPendingChanges();

        // 觸發 UI 更新
        if (typeof updateUI === 'function') {
            updateUI();
        }

        // 顯示歡迎訊息
        if (typeof showCelebration === 'function') {
            showCelebration('🎉 登入成功！數據已同步');
        }
    }

    /**
     * 登出後的處理
     */
    onSignOut() {
        console.log('使用者登出，清空雲端資料');
        this.currentUser = null;

        // 清空所有本地資料
        this.clearLocalData();

        // 清空同步佇列
        this.syncQueue = [];
        this.saveSyncQueue();

        // 重置應用狀態（重新初始化為預設值）
        if (typeof appState !== 'undefined' && appState) {
            appState.gameData = appState.storageManager.createDefaultGameData();
            appState.saveState();
        }

        // 觸發 UI 更新
        if (typeof updateUI === 'function') {
            updateUI();
        }

        // 顯示提示訊息
        if (typeof showCelebration === 'function') {
            showCelebration('👋 已登出，現在使用本地模式');
        }
    }

    /**
     * 清空本地資料
     */
    clearLocalData() {
        try {
            // 清除遊戲數據
            localStorage.removeItem('waterGameData');
            localStorage.removeItem('lastPlayDate');
            localStorage.removeItem('appSettings');

            // 重置應用程式狀態
            if (typeof appState !== 'undefined' && appState) {
                appState.gameData = appState.storageManager.createDefaultGameData();
                appState.saveState();
            }

            console.log('本地資料已清空');
        } catch (error) {
            console.error('清空本地資料失敗:', error);
        }
    }

    /**
     * 載入使用者數據
     */
    async loadUserData() {
        if (!this.isAuthenticated()) {
            console.warn('使用者未登入，無法載入數據');
            return null;
        }

        try {
            // 載入使用者進度
            const { data: progress, error: progressError } = await this.client
                .from('user_progress')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .single();

            if (progressError && progressError.code !== 'PGRST116') {
                throw progressError;
            }

            // 載入使用者設定
            const { data: settings, error: settingsError } = await this.client
                .from('user_settings')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .single();

            if (settingsError && settingsError.code !== 'PGRST116') {
                throw settingsError;
            }

            // 載入今日記錄
            const today = new Date().toISOString().split('T')[0];
            const { data: todayRecords, error: recordsError } = await this.client
                .from('water_records')
                .select('*')
                .eq('user_id', this.currentUser.id)
                .gte('recorded_at', `${today}T00:00:00`)
                .order('recorded_at', { ascending: false });

            if (recordsError) throw recordsError;

            // 載入成就
            const { data: achievements, error: achievementsError } = await this.client
                .from('achievements')
                .select('achievement_id')
                .eq('user_id', this.currentUser.id);

            if (achievementsError) throw achievementsError;

            return {
                progress: progress || null,
                settings: settings || null,
                todayRecords: todayRecords || [],
                achievements: achievements?.map(a => a.achievement_id) || []
            };
        } catch (error) {
            console.error('載入使用者數據失敗:', error);
            return null;
        }
    }

    /**
     * 網路恢復時的處理
     */
    async handleOnline() {
        console.log('網路已連線');
        this.isOnline = true;

        if (this.isAuthenticated()) {
            await this.syncPendingChanges();
        }
    }

    /**
     * 網路斷線時的處理
     */
    handleOffline() {
        console.log('網路已斷線，切換至離線模式');
        this.isOnline = false;
    }

    /**
     * 同步待處理的變更
     */
    async syncPendingChanges() {
        if (!this.isOnline || !this.isAuthenticated()) {
            return;
        }

        console.log(`開始同步 ${this.syncQueue.length} 筆待處理變更`);

        while (this.syncQueue.length > 0) {
            const change = this.syncQueue[0];

            try {
                await this.executeChange(change);
                this.syncQueue.shift(); // 成功後移除
            } catch (error) {
                console.error('同步失敗:', error);
                break; // 停止同步，等待下次重試
            }
        }

        // 儲存佇列到 LocalStorage
        this.saveSyncQueue();
    }

    /**
     * 執行變更
     */
    async executeChange(change) {
        switch (change.type) {
            case 'water_record':
                return await this.addWaterRecord(change.data);
            case 'progress_update':
                return await this.updateProgress(change.data);
            case 'achievement_unlock':
                return await this.unlockAchievement(change.data);
            default:
                console.warn('未知的變更類型:', change.type);
        }
    }

    /**
     * 新增到同步佇列
     */
    queueChange(type, data) {
        this.syncQueue.push({
            type,
            data,
            timestamp: new Date().toISOString()
        });

        this.saveSyncQueue();

        // 如果在線上，立即嘗試同步
        if (this.isOnline && this.isAuthenticated()) {
            this.syncPendingChanges();
        }
    }

    /**
     * 儲存同步佇列
     */
    saveSyncQueue() {
        try {
            localStorage.setItem('supabase_sync_queue', JSON.stringify(this.syncQueue));
        } catch (error) {
            console.error('儲存同步佇列失敗:', error);
        }
    }

    /**
     * 載入同步佇列
     */
    loadSyncQueue() {
        try {
            const saved = localStorage.getItem('supabase_sync_queue');
            if (saved) {
                this.syncQueue = JSON.parse(saved);
            }
        } catch (error) {
            console.error('載入同步佇列失敗:', error);
            this.syncQueue = [];
        }
    }

    /**
     * 新增飲水記錄
     */
    async addWaterRecord(recordData) {
        if (!this.isAuthenticated()) {
            this.queueChange('water_record', recordData);
            return { success: true, queued: true };
        }

        try {
            const { data, error } = await this.client
                .from('water_records')
                .insert({
                    amount: recordData.amount,
                    recorded_at: recordData.recorded_at || new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            console.log('飲水記錄已新增:', data);
            return { success: true, data };
        } catch (error) {
            console.error('新增飲水記錄失敗:', error);

            // 如果是網路錯誤，加入佇列
            if (!this.isOnline) {
                this.queueChange('water_record', recordData);
                return { success: true, queued: true };
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * 更新使用者進度
     */
    async updateProgress(progressData) {
        if (!this.isAuthenticated()) {
            this.queueChange('progress_update', progressData);
            return { success: true, queued: true };
        }

        try {
            const { data, error } = await this.client
                .from('user_progress')
                .upsert({
                    user_id: this.currentUser.id,
                    ...progressData
                })
                .select()
                .single();

            if (error) throw error;

            console.log('進度已更新:', data);
            return { success: true, data };
        } catch (error) {
            console.error('更新進度失敗:', error);

            if (!this.isOnline) {
                this.queueChange('progress_update', progressData);
                return { success: true, queued: true };
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * 解鎖成就
     */
    async unlockAchievement(achievementId) {
        if (!this.isAuthenticated()) {
            this.queueChange('achievement_unlock', { achievement_id: achievementId });
            return { success: true, queued: true };
        }

        try {
            const { data, error } = await this.client
                .from('achievements')
                .insert({
                    achievement_id: achievementId
                })
                .select()
                .single();

            if (error) {
                // 如果是重複錯誤，視為成功
                if (error.code === '23505') {
                    console.log('成就已解鎖:', achievementId);
                    return { success: true, duplicate: true };
                }
                throw error;
            }

            console.log('成就已解鎖:', data);
            return { success: true, data };
        } catch (error) {
            console.error('解鎖成就失敗:', error);

            if (!this.isOnline) {
                this.queueChange('achievement_unlock', { achievement_id: achievementId });
                return { success: true, queued: true };
            }

            return { success: false, error: error.message };
        }
    }

    /**
     * 取得今日飲水量
     */
    async getTodayWaterAmount() {
        if (!this.isAuthenticated()) {
            return 0;
        }

        try {
            const { data, error } = await this.client
                .rpc('get_today_water_amount', {
                    p_user_id: this.currentUser.id
                });

            if (error) throw error;

            return data || 0;
        } catch (error) {
            console.error('取得今日飲水量失敗:', error);
            return 0;
        }
    }

    /**
     * 取得連續達標天數
     */
    async getStreakDays() {
        if (!this.isAuthenticated()) {
            return 0;
        }

        try {
            const { data, error } = await this.client
                .rpc('get_streak_days', {
                    p_user_id: this.currentUser.id
                });

            if (error) throw error;

            return data || 0;
        } catch (error) {
            console.error('取得連續天數失敗:', error);
            return 0;
        }
    }

    /**
     * 取得最近統計
     */
    async getRecentStats(days = 7) {
        if (!this.isAuthenticated()) {
            return [];
        }

        try {
            const { data, error } = await this.client
                .rpc('get_recent_stats', {
                    p_user_id: this.currentUser.id,
                    p_days: days
                });

            if (error) throw error;

            return data || [];
        } catch (error) {
            console.error('取得統計失敗:', error);
            return [];
        }
    }

    /**
     * 訂閱即時更新
     */
    subscribeToChanges(callback) {
        if (!this.isAuthenticated()) {
            console.warn('使用者未登入，無法訂閱');
            return null;
        }

        const channel = this.client
            .channel('user_changes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'water_records',
                filter: `user_id=eq.${this.currentUser.id}`
            }, (payload) => {
                console.log('飲水記錄變更:', payload);
                callback('water_record', payload);
            })
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'user_progress',
                filter: `user_id=eq.${this.currentUser.id}`
            }, (payload) => {
                console.log('進度變更:', payload);
                callback('progress', payload);
            })
            .subscribe();

        return channel;
    }

    /**
     * 取消訂閱
     */
    unsubscribe(channel) {
        if (channel) {
            this.client.removeChannel(channel);
        }
    }
}

// 建立全域實例
const supabaseClient = new SupabaseClient();
