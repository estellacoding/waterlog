// ==================== 認證 UI 系統 ====================

class AuthUI {
    constructor() {
        this.panel = null;
        this.isVisible = false;
    }

    /**
     * 顯示認證面板
     */
    show() {
        if (this.isVisible) return;

        this.createPanel();
        this.isVisible = true;
    }

    /**
     * 隱藏認證面板
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
     * 創建認證面板
     */
    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'auth-overlay';
        this.panel.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.9);
            z-index: 10000;
            display: flex;
            align-items: center;
            justify-content: center;
            animation: fadeIn 0.3s ease-in;
        `;

        const content = document.createElement('div');
        content.className = 'auth-content';
        content.style.cssText = `
            background: white;
            border-radius: 20px;
            padding: 40px;
            max-width: 400px;
            width: 90%;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
            text-align: center;
            animation: slideUp 0.4s ease-out;
        `;

        content.innerHTML = this.getAuthHTML();
        this.panel.appendChild(content);
        document.body.appendChild(this.panel);

        // 綁定事件
        this.bindEvents();
    }

    /**
     * 獲取認證 HTML
     */
    getAuthHTML() {
        const isAuthenticated = supabaseClient && supabaseClient.isAuthenticated();

        if (isAuthenticated) {
            const user = supabaseClient.getCurrentUser();
            return `
                <div style="margin-bottom: 24px;">
                    <div style="font-size: 64px; margin-bottom: 16px;">👤</div>
                    <h2 style="margin: 0 0 8px 0; color: #333;">已登入</h2>
                    <p style="color: #666; font-size: 14px; margin: 0;">${user.email}</p>
                </div>

                <div style="background: #f8f9fa; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
                    <p style="color: #666; font-size: 14px; margin: 0; line-height: 1.6;">
                        你的飲水記錄已安全儲存在雲端，可以在任何裝置上同步存取。
                    </p>
                </div>

                <button id="signOutBtn" style="width: 100%; padding: 14px; border: none; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; border-radius: 12px; cursor: pointer; font-size: 16px; 
                        font-weight: bold; margin-bottom: 12px;">
                    登出
                </button>

                <button onclick="authUI.hide()" style="width: 100%; padding: 14px; border: 2px solid #ddd; 
                        background: white; color: #666; border-radius: 12px; cursor: pointer; font-size: 16px;">
                    關閉
                </button>
            `;
        }

        return `
            <div style="margin-bottom: 24px;">
                <div style="font-size: 64px; margin-bottom: 16px;">💧</div>
                <h2 style="margin: 0 0 8px 0; color: #333;">登入水精靈養成記</h2>
                <p style="color: #666; font-size: 14px; margin: 0;">登入以同步你的飲水記錄</p>
            </div>

            <div style="background: #e3f2fd; border-radius: 12px; padding: 16px; margin-bottom: 24px; border: 1px solid #2196f3;">
                <p style="color: #1565c0; font-size: 14px; margin: 0; line-height: 1.6;">
                    ☁️ <strong>登入以啟用雲端同步：</strong>你的飲水記錄將安全儲存在雲端，可在任何裝置存取。未登入時記錄僅儲存在本機。
                </p>
            </div>

            <button id="googleSignInBtn" style="width: 100%; padding: 14px; border: 1px solid #ddd; 
                    background: white; color: #333; border-radius: 12px; cursor: pointer; 
                    font-size: 16px; font-weight: 500; margin-bottom: 12px; display: flex; 
                    align-items: center; justify-content: center; gap: 12px;">
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                使用 Google 帳號登入
            </button>

            <div style="position: relative; margin: 24px 0;">
                <div style="border-top: 1px solid #ddd;"></div>
                <span style="position: absolute; top: -10px; left: 50%; transform: translateX(-50%); 
                             background: white; padding: 0 12px; color: #999; font-size: 14px;">或</span>
            </div>

            <div id="emailAuthForm" style="text-align: left;">
                <div style="margin-bottom: 16px;">
                    <label style="display: block; color: #666; font-size: 14px; margin-bottom: 6px;">電子郵件</label>
                    <input type="email" id="authEmail" placeholder="your@email.com" 
                           style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; 
                                  font-size: 14px; box-sizing: border-box;">
                </div>

                <div style="margin-bottom: 20px;">
                    <label style="display: block; color: #666; font-size: 14px; margin-bottom: 6px;">密碼</label>
                    <input type="password" id="authPassword" placeholder="••••••••" 
                           style="width: 100%; padding: 12px; border: 2px solid #ddd; border-radius: 8px; 
                                  font-size: 14px; box-sizing: border-box;">
                </div>

                <button id="emailSignInBtn" style="width: 100%; padding: 14px; border: none; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; border-radius: 12px; cursor: pointer; font-size: 16px; 
                        font-weight: bold; margin-bottom: 12px;">
                    登入
                </button>

                <button id="emailSignUpBtn" style="width: 100%; padding: 14px; border: 2px solid #667eea; 
                        background: white; color: #667eea; border-radius: 12px; cursor: pointer; 
                        font-size: 16px; font-weight: 500;">
                    註冊新帳號
                </button>
            </div>

            <button onclick="authUI.hide()" style="width: 100%; padding: 14px; border: none; 
                    background: transparent; color: #999; cursor: pointer; font-size: 14px; margin-top: 16px;">
                稍後再說，繼續使用
            </button>
        `;
    }

    /**
     * 綁定事件
     */
    bindEvents() {
        // Google 登入
        const googleBtn = document.getElementById('googleSignInBtn');
        if (googleBtn) {
            googleBtn.addEventListener('click', () => this.handleGoogleSignIn());
        }

        // Email 登入
        const emailSignInBtn = document.getElementById('emailSignInBtn');
        if (emailSignInBtn) {
            emailSignInBtn.addEventListener('click', () => this.handleEmailSignIn());
        }

        // Email 註冊
        const emailSignUpBtn = document.getElementById('emailSignUpBtn');
        if (emailSignUpBtn) {
            emailSignUpBtn.addEventListener('click', () => this.handleEmailSignUp());
        }

        // 登出
        const signOutBtn = document.getElementById('signOutBtn');
        if (signOutBtn) {
            signOutBtn.addEventListener('click', () => this.handleSignOut());
        }

        // Enter 鍵登入
        const emailInput = document.getElementById('authEmail');
        const passwordInput = document.getElementById('authPassword');
        if (emailInput && passwordInput) {
            [emailInput, passwordInput].forEach(input => {
                input.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleEmailSignIn();
                    }
                });
            });
        }
    }

    /**
     * 處理 Google 登入
     */
    async handleGoogleSignIn() {
        const btn = document.getElementById('googleSignInBtn');
        if (!btn) return;

        btn.disabled = true;
        btn.textContent = '正在跳轉到 Google...';

        const result = await supabaseClient.signInWithGoogle();

        if (!result.success) {
            alert('Google 登入失敗: ' + result.error);
            btn.disabled = false;
            btn.innerHTML = `
                <svg width="20" height="20" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                使用 Google 帳號登入
            `;
        }
    }

    /**
     * 處理 Email 登入
     */
    async handleEmailSignIn() {
        const email = document.getElementById('authEmail')?.value;
        const password = document.getElementById('authPassword')?.value;

        if (!email || !password) {
            alert('請輸入電子郵件和密碼');
            return;
        }

        const btn = document.getElementById('emailSignInBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '登入中...';
        }

        const result = await supabaseClient.signIn(email, password);

        if (result.success) {
            this.hide();
            showCelebration('🎉 歡迎回來！');
        } else {
            alert('登入失敗: ' + result.error);
            if (btn) {
                btn.disabled = false;
                btn.textContent = '登入';
            }
        }
    }

    /**
     * 處理 Email 註冊
     */
    async handleEmailSignUp() {
        const email = document.getElementById('authEmail')?.value;
        const password = document.getElementById('authPassword')?.value;

        if (!email || !password) {
            alert('請輸入電子郵件和密碼');
            return;
        }

        if (password.length < 6) {
            alert('密碼長度至少需要 6 個字元');
            return;
        }

        const btn = document.getElementById('emailSignUpBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '註冊中...';
        }

        const result = await supabaseClient.signUp(email, password);

        if (result.success) {
            alert('註冊成功！請檢查你的電子郵件以驗證帳號。');
            this.hide();
        } else {
            alert('註冊失敗: ' + result.error);
            if (btn) {
                btn.disabled = false;
                btn.textContent = '註冊新帳號';
            }
        }
    }

    /**
     * 處理登出
     */
    async handleSignOut() {
        if (!confirm('確定要登出嗎？登出後本地資料將被清空。')) {
            return;
        }

        const btn = document.getElementById('signOutBtn');
        if (btn) {
            btn.disabled = true;
            btn.textContent = '登出中...';
        }

        const result = await supabaseClient.signOut();

        if (result.success) {
            this.hide();
            showCelebration('👋 已登出');
        } else {
            alert('登出失敗: ' + result.error);
            if (btn) {
                btn.disabled = false;
                btn.textContent = '登出';
            }
        }
    }

    /**
     * 顯示使用者資訊
     */
    updateUserInfo() {
        const userInfoElement = document.getElementById('userInfo');
        if (!userInfoElement) return;

        if (supabaseClient && supabaseClient.isAuthenticated()) {
            const user = supabaseClient.getCurrentUser();
            userInfoElement.innerHTML = `
                <button onclick="authUI.show()" style="padding: 8px 16px; border: 1px solid #ddd; 
                        background: white; border-radius: 8px; cursor: pointer; font-size: 14px; 
                        display: flex; align-items: center; gap: 8px;">
                    <span>👤</span>
                    <span>${user.email}</span>
                </button>
            `;
        } else {
            userInfoElement.innerHTML = `
                <button onclick="authUI.show()" style="padding: 8px 16px; border: 2px solid #667eea; 
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); 
                        color: white; border-radius: 8px; cursor: pointer; font-size: 14px; 
                        font-weight: bold;">
                    登入
                </button>
            `;
        }
    }
}

// 建立全域實例
const authUI = new AuthUI();

// 全域函式供 HTML 呼叫
function showAuthPanel() {
    authUI.show();
}
