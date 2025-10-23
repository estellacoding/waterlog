// ==================== Supabase 配置範例 ====================
// 複製此檔案為 config.js 並填入你的 Supabase 專案資訊

const SUPABASE_CONFIG = {
    // 從 Supabase 專案設定中取得
    url: 'https://your-project.supabase.co',
    anonKey: 'your-anon-key-here',
    
    // 可選配置
    options: {
        auth: {
            autoRefreshToken: true,
            persistSession: true,
            detectSessionInUrl: true
        },
        db: {
            schema: 'public'
        },
        global: {
            headers: {
                'x-application-name': 'waterlog'
            }
        }
    }
};

// 匯出配置
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SUPABASE_CONFIG;
}
