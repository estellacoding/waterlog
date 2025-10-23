// ==================== Supabase 配置範例 ====================

const SUPABASE_CONFIG = {
    // 從 Supabase 專案設定中取得
    url: 'https://yaezehkpopotohitbyjh.supabase.co',
    anonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlhZXplaGtwb3BvdG9oaXRieWpoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjExOTkxODEsImV4cCI6MjA3Njc3NTE4MX0.ILvaPNK_K_Th6ef9bmnRWwrtJy2WG3alkfwXu5fOEDw',
    
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
