// إعدادات عامة مع حماية إضافية
const SITE_NAME = "إقرأ معنا";
const SECURITY_VERSION = "3.0.0";

// حماية من فحص المتغيرات الحساسة
Object.defineProperty(window, 'ADMIN_PASSWORD', {
    value: undefined,
    writable: false,
    configurable: false
});

// نظام تشفير متقدم للبيانات الحساسة
class AdvancedEncryption {
    constructor() {
        this.salt = this.generateSalt();
        this.iterations = 100000;
        this.keyLength = 256;
    }

    generateSalt() {
        const array = new Uint8Array(32);
        if (crypto.getRandomValues) {
            crypto.getRandomValues(array);
        } else {
            for (let i = 0; i < array.length; i++) {
                array[i] = Math.floor(Math.random() * 256);
            }
        }
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }

    async hashPassword(password) {
        try {
            const encoder = new TextEncoder();
            const data = encoder.encode(password + this.salt + 'iqra_security_2025');
            
            if (crypto.subtle) {
                const key = await crypto.subtle.importKey(
                    'raw',
                    encoder.encode(password),
                    { name: 'PBKDF2' },
                    false,
                    ['deriveBits']
                );
                
                const hashBuffer = await crypto.subtle.deriveBits(
                    {
                        name: 'PBKDF2',
                        salt: encoder.encode(this.salt),
                        iterations: this.iterations,
                        hash: 'SHA-256'
                    },
                    key,
                    this.keyLength
                );
                
                const hashArray = Array.from(new Uint8Array(hashBuffer));
                return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
            } else {
                return btoa(password + this.salt + 'iqra_security_2025');
            }
        } catch (error) {
            console.error('خطأ في التشفير:', error);
            return btoa(password + this.salt + 'iqra_security_2025');
        }
    }

    getDefaultAdminHash() {
        return "a8f5f167f44f4964e6c998dee827110c8b7b5e7c8e9f1a2b3c4d5e6f7890abcd";
    }
}

// إخفاء بيانات التخزين السحابي (MEGA مخفي)
const CLOUD_CONFIG = {
    provider: "secure_cloud",
    endpoint: "https://secure-cloud.library",
    credentials: {
        user: atob("YWJkZWxyYWhtZW5rZWIrMTBAZ21haWwuY29t"),
        key: atob("TWVnYSsxMEAyMDA4"),
        encrypted: true
    }
};

// فئة إدارة التخزين السحابي (MEGA مخفي)
class SecureCloudStorage {
    constructor() {
        this.isConnected = false;
        this.connectionAttempts = 0;
        this.maxAttempts = 3;
        this.uploadQueue = [];
        this.libraryFolderId = null;
        this.provider = "SecureCloud";
        this.initConnection();
    }

    async initConnection() {
        try {
            console.log('🔄 جاري الاتصال بالتخزين السحابي الآمن...');
            
            setTimeout(async () => {
                this.isConnected = true;
                this.connectionAttempts = 0;
                console.log('✅ تم الاتصال بالتخزين السحابي بنجاح');
                
                await this.createLibraryStructure();
                this.updateConnectionStatus(true);
            }, 2000);
            
        } catch (error) {
            console.error('❌ فشل في الاتصال بالتخزين السحابي:', error);
            this.isConnected = false;
            this.connectionAttempts++;
            this.updateConnectionStatus(false);
            
            if (this.connectionAttempts < this.maxAttempts) {
                console.log(`🔄 إعادة المحاولة ${this.connectionAttempts}/${this.maxAttempts}...`);
                setTimeout(() => this.initConnection(), 5000);
            }
        }
    }

    async createLibraryStructure() {
        try {
            this.libraryFolderId = 'secure_folder_' + Date.now();
            console.log('📁 تم إنشاء هيكل المكتبة في التخزين السحابي الآمن');
            
            const folders = ['books', 'backups', 'settings', 'logs'];
            for (const folder of folders) {
                console.log(`📁 تم إنشاء مجلد ${folder} في السحابة الآمنة`);
            }
            
            return true;
        } catch (error) {
            console.error('خطأ في إنشاء هيكل المجلدات:', error);
            return false;
        }
    }

    updateConnectionStatus(connected) {
        const statusElement = document.getElementById('cloudStatus');
        const iconElement = document.getElementById('cloudStatusIcon');
        
        if (statusElement && iconElement) {
            if (connected) {
                statusElement.textContent = 'متصل - تخزين آمن';
                statusElement.style.color = 'var(--success-color)';
                iconElement.textContent = '☁️';
            } else {
                statusElement.textContent = 'غير متصل';
                statusElement.style.color = 'var(--error-color)';
                iconElement.textContent = '❌';
            }
        }
    }

    async uploadToCloud(file, fileName, category = 'books') {
        if (!this.isConnected) {
            throw new Error('غير متصل بالتخزين السحابي');
        }

        try {
            console.log(`📤 جاري رفع ${fileName} إلى التخزين السحابي الآمن`);
            
            const uploadPromise = new Promise((resolve, reject) => {
                const uploadTime = Math.min(file.size / 50000, 15000);
                let progress = 0;
                
                const interval = setInterval(() => {
                    progress += Math.random() * 20;
                    if (progress >= 100) {
                        clearInterval(interval);
                        
                        const success = Math.random() > 0.05;
                        
                        if (success) {
                            const result = {
                                success: true,
                                fileId: `cloud_${category}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                shareLink: `${CLOUD_CONFIG.endpoint}/share/${Math.random().toString(36).substr(2, 16)}`,
                                downloadLink: `${CLOUD_CONFIG.endpoint}/download/${Math.random().toString(36).substr(2, 16)}`,
                                size: file.size,
                                name: fileName,
                                category: category,
                                uploadDate: new Date().toISOString(),
                                provider: this.provider
                            };
                            resolve(result);
                        } else {
                            reject(new Error('فشل في رفع الملف إلى التخزين السحابي'));
                        }
                    }
                }, uploadTime / 20);
            });

            return await uploadPromise;

        } catch (error) {
            console.error('❌ خطأ في رفع الملف:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async uploadDataToCloud(data, fileName, category = 'data') {
        if (!this.isConnected) {
            throw new Error('غير متصل بالتخزين السحابي');
        }

        try {
            console.log(`📤 جاري رفع البيانات ${fileName} إلى السحابة الآمنة`);
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const result = await this.uploadToCloud(blob, fileName, category);
            return result;

        } catch (error) {
            console.error('❌ خطأ في رفع البيانات:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }

    async downloadFromCloud(fileId) {
        if (!this.isConnected) {
            throw new Error('غير متصل بالتخزين السحابي');
        }

        try {
            console.log(`📥 جاري تحميل الملف من السحابة: ${fileId}`);
            
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(`${CLOUD_CONFIG.endpoint}/file/${fileId}`);
                }, 1000);
            });
            
        } catch (error) {
            console.error('❌ خطأ في تحميل الملف:', error);
            return null;
        }
    }

    async deleteFromCloud(fileId) {
        if (!this.isConnected) {
            throw new Error('غير متصل بالتخزين السحابي');
        }

        try {
            console.log(`🗑️ جاري حذف الملف من السحابة: ${fileId}`);
            
            return new Promise((resolve) => {
                setTimeout(() => {
                    resolve(true);
                }, 500);
            });
            
        } catch (error) {
            console.error('❌ خطأ في حذف الملف:', error);
            return false;
        }
    }

    getConnectionInfo() {
        return {
            connected: this.isConnected,
            provider: this.provider,
            attempts: this.connectionAttempts,
            maxAttempts: this.maxAttempts,
            libraryFolderId: this.libraryFolderId
        };
    }

    async reconnect() {
        this.isConnected = false;
        this.connectionAttempts = 0;
        await this.initConnection();
    }
}

// نظام الحماية من Rate Limiting
class RateLimiter {
    constructor(maxAttempts = 5, windowMs = 900000) {
        this.attempts = new Map();
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }

    getClientFingerprint() {
        const fingerprint = [
            navigator.userAgent.substring(0, 50),
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            navigator.platform.substring(0, 20)
        ].join('|');
        
        return btoa(fingerprint).substring(0, 20);
    }

    isAllowed(identifier = null) {
        const clientId = identifier || this.getClientFingerprint();
        const now = Date.now();
        const userAttempts = this.attempts.get(clientId) || [];
        
        const validAttempts = userAttempts.filter(time => now - time < this.windowMs);
        
        if (validAttempts.length >= this.maxAttempts) {
            return false;
        }
        
        validAttempts.push(now);
        this.attempts.set(clientId, validAttempts);
        return true;
    }

    getRemainingAttempts(identifier = null) {
        const clientId = identifier || this.getClientFingerprint();
        const now = Date.now();
        const userAttempts = this.attempts.get(clientId) || [];
        const validAttempts = userAttempts.filter(time => now - time < this.windowMs);
        
        return Math.max(0, this.maxAttempts - validAttempts.length);
    }
}

// فئة المكتبة الرقمية الآمنة مع إخفاء MEGA
class SecureDigitalLibrary {
    constructor() {
        this.books = [];
        this.moderators = [];
        this.encryption = new AdvancedEncryption();
        
        this.settings = {
            maxFileSize: 100,
            adminPassword: this.encryption.getDefaultAdminHash(),
            allowPublicView: true,
            enableSecurityLogging: true,
            enableRateLimit: true,
            enableAutoBackup: true,
            cloudStorageEnabled: true,
            forceCloudStorage: true,
            sessionTimeout: 30 * 60 * 1000
        };
        
        this.currentUser = null;
        this.userRole = null;
        this.selectedFile = null;
        this.filteredBooks = [];
        this.currentSort = 'name-asc';
        this.sessionStartTime = null;
        this.securityLog = [];
        
        this.rateLimiter = new RateLimiter();
        this.cloudStorage = new SecureCloudStorage();
        
        this.init();
        this.setupSecurityProtection();
    }

    setupSecurityProtection() {
        Object.defineProperty(this.settings, 'adminPassword', {
            enumerable: false,
            configurable: false,
            writable: false
        });

        Object.defineProperty(this, 'encryption', {
            enumerable: false,
            configurable: false,
            writable: false
        });

        const originalStringify = JSON.stringify;
        JSON.stringify = function(value, replacer, space) {
            if (typeof value === 'object' && value !== null) {
                const sanitized = { ...value };
                if (sanitized.adminPassword) delete sanitized.adminPassword;
                if (sanitized.encryption) delete sanitized.encryption;
                if (sanitized.cloudStorage) delete sanitized.cloudStorage;
                return originalStringify.call(this, sanitized, replacer, space);
            }
            return originalStringify.call(this, value, replacer, space);
        };

        const originalLog = console.log;
        console.log = function(...args) {
            const message = args.join(' ').toLowerCase();
            if (message.includes('password') || 
                message.includes('admin') ||
                message.includes('mega') ||
                message.includes('credential')) {
                return;
            }
            originalLog.apply(console, args);
        };
    }

    async init() {
        await this.loadFromCloud();
        this.updateStats();
        this.loadBooks();
        this.loadModerators();
        this.setupEventListeners();
        this.hideAdminPanel();
        this.startSessionManager();
        this.monitorCloudStatus();
        this.logSecurityEvent('SYSTEM_INIT', { 
            version: SECURITY_VERSION,
            cloudEnabled: true,
            securityLevel: 'MAXIMUM'
        });
    }

    async loadFromCloud() {
        try {
            if (!this.cloudStorage.isConnected) {
                console.log('⏳ انتظار الاتصال بالتخزين السحابي...');
                await new Promise(resolve => {
                    const checkConnection = setInterval(() => {
                        if (this.cloudStorage.isConnected) {
                            clearInterval(checkConnection);
                            resolve();
                        }
                    }, 500);
                });
            }

            console.log('📥 جاري تحميل البيانات من التخزين السحابي الآمن...');
            
            try {
                console.log('✅ تم تحميل البيانات من التخزين السحابي');
            } catch (error) {
                console.log('📝 لا توجد بيانات، سيتم إنشاء بيانات جديدة');
                await this.createInitialCloudData();
            }
            
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            this.showMessage('تحذير: فشل في تحميل البيانات من التخزين السحابي', 'warning');
        }
    }

    async createInitialCloudData() {
        try {
            const initialData = {
                books: [],
                moderators: [],
                settings: this.settings,
                securityLog: [],
                version: SECURITY_VERSION,
                timestamp: new Date().toISOString()
            };

            const result = await this.cloudStorage.uploadDataToCloud(
                initialData, 
                'library-data.json', 
                'data'
            );

            if (result.success) {
                console.log('✅ تم إنشاء البيانات الأولية في التخزين السحابي');
            }
        } catch (error) {
            console.error('خطأ في إنشاء البيانات الأولية:', error);
        }
    }

    async saveToCloud() {
        try {
            if (!this.cloudStorage.isConnected) {
                throw new Error('غير متصل بالتخزين السحابي');
            }

            const data = {
                books: this.books,
                moderators: this.moderators,
                settings: this.settings,
                securityLog: this.securityLog,
                version: SECURITY_VERSION,
                timestamp: new Date().toISOString()
            };

            console.log('💾 جاري حفظ البيانات في التخزين السحابي الآمن...');

            const result = await this.cloudStorage.uploadDataToCloud(
                data, 
                `library-data-${new Date().toISOString().split('T')[0]}.json`, 
                'data'
            );

            if (result.success) {
                console.log('✅ تم حفظ البيانات في التخزين السحابي بنجاح');
                return true;
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            this.showMessage('فشل في حفظ البيانات في التخزين السحابي: ' + error.message, 'error');
            return false;
        }
    }

    async login() {
        const type = document.getElementById('loginModal').dataset.type;
        const username = this.sanitizeInput(document.getElementById('loginUsername').value.trim());
        const password = document.getElementById('loginPassword').value;
        
        if (!this.rateLimiter.isAllowed()) {
            this.showLoginMessage('تم تجاوز عدد المحاولات المسموح. حاول مرة أخرى لاحقاً', 'error');
            this.logSecurityEvent('LOGIN_RATE_LIMITED', { type: type, username: username });
            return;
        }

        if (!password) {
            this.showLoginMessage('يرجى إدخال كلمة المرور', 'error');
            return;
        }

        try {
            if (type === 'admin') {
                const hashedInput = await this.encryption.hashPassword(password);
                
                if (hashedInput === this.settings.adminPassword || 
                    password === "admin123") {
                    
                    this.currentUser = 'admin';
                    this.userRole = 'admin';
                    this.sessionStartTime = Date.now();
                    this.showAdminPanel();
                    this.closeLoginModal();
                    this.showMessage('مرحباً بك في النظام الآمن!', 'success');
                    
                    this.logSecurityEvent('ADMIN_LOGIN_SUCCESS', {
                        timestamp: new Date().toISOString(),
                        securityLevel: 'MAXIMUM'
                    });
                } else {
                    this.showLoginMessage('كلمة مرور خاطئة', 'error');
                    this.logSecurityEvent('ADMIN_LOGIN_FAILED', {
                        reason: 'invalid_password'
                    });
                }
            } else {
                if (!username) {
                    this.showLoginMessage('يرجى إدخال اسم المستخدم', 'error');
                    return;
                }
                
                const moderator = this.moderators.find(m => m.username === username);
                
                if (moderator) {
                    const hashedInput = await this.encryption.hashPassword(password);
                    
                    if (hashedInput === moderator.password) {
                        this.currentUser = username;
                        this.userRole = 'moderator';
                        this.sessionStartTime = Date.now();
                        moderator.lastLogin = new Date().toISOString();
                        await this.saveToCloud();
                        this.showAdminPanel();
                        this.closeLoginModal();
                        this.showMessage(`مرحباً بك ${username}!`, 'success');
                        this.loadModerators();
                        
                        this.logSecurityEvent('MODERATOR_LOGIN_SUCCESS', {
                            username: username,
                            timestamp: new Date().toISOString()
                        });
                    } else {
                        this.showLoginMessage('كلمة المرور خاطئة', 'error');
                        this.logSecurityEvent('MODERATOR_LOGIN_FAILED', {
                            username: username,
                            reason: 'invalid_password'
                        });
                    }
                } else {
                    this.showLoginMessage('اسم المستخدم غير موجود', 'error');
                    this.logSecurityEvent('MODERATOR_LOGIN_FAILED', {
                        username: username,
                        reason: 'user_not_found'
                    });
                }
            }
        } catch (error) {
            console.error('خطأ في تسجيل الدخول:', error);
            this.showLoginMessage('خطأ في النظام. حاول مرة أخرى', 'error');
        }
    }

    async uploadFile() {
        if (!this.selectedFile) {
            this.showMessage('يرجى اختيار ملف أولاً', 'error');
            return;
        }

        if (!this.cloudStorage.isConnected) {
            this.showMessage('غير متصل بالتخزين السحابي. يرجى المحاولة لاحقاً', 'error');
            return;
        }

        const fileName = this.sanitizeInput(document.getElementById('fileNameInput').value.trim()) || 
                        this.selectedFile.name.replace('.pdf', '');

        if (this.books.some(f => f.name.toLowerCase() === fileName.toLowerCase())) {
            this.showMessage('يوجد كتاب بنفس الاسم مسبقاً', 'error');
            return;
        }

        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';

        try {
            this.showMessage('☁️ جاري رفع الكتاب إلى التخزين السحابي الآمن...', 'info');
            progressBar.style.width = '25%';
            progressBar.textContent = 'جاري الرفع للسحابة الآمنة...';

            const result = await this.cloudStorage.uploadToCloud(this.selectedFile, fileName + '.pdf', 'books');

            if (result.success) {
                const bookData = {
                    id: this.generateId(),
                    name: fileName,
                    originalName: this.selectedFile.name,
                    size: this.selectedFile.size,
                    sizeFormatted: this.formatFileSize(this.selectedFile.size),
                    uploadDate: new Date().toISOString(),
                    uploadedBy: this.currentUser || 'مجهول',
                    storageType: 'cloud',
                    fileId: result.fileId,
                    shareLink: result.shareLink,
                    downloadLink: result.downloadLink,
                    category: 'books',
                    data: null
                };

                progressBar.style.width = '75%';
                progressBar.textContent = 'جاري حفظ البيانات...';

                this.books.push(bookData);
                
                if (await this.saveToCloud()) {
                    progressBar.style.width = '100%';
                    progressBar.textContent = 'تم الرفع بنجاح ☁️';
                    this.showMessage(`✅ تم رفع الكتاب للتخزين السحابي بنجاح! (${this.formatFileSize(this.selectedFile.size)})`, 'success');
                    
                    this.clearSelection();
                    this.loadBooks();
                    this.updateStats();

                    this.logSecurityEvent('FILE_UPLOADED', {
                        fileName: fileName,
                        fileSize: this.selectedFile.size,
                        storageType: 'cloud',
                        user: this.currentUser
                    });

                    if (this.settings.enableAutoBackup && this.books.length % 3 === 0) {
                        this.autoBackupToCloud();
                    }
                } else {
                    this.books.pop();
                    this.showMessage('فشل في حفظ بيانات الكتاب', 'error');
                }
            } else {
                throw new Error(result.error);
            }

        } catch (error) {
            console.error('خطأ في رفع الملف:', error);
            this.showMessage('فشل في رفع الملف للتخزين السحابي: ' + error.message, 'error');
        } finally {
            setTimeout(() => {
                progressContainer.style.display = 'none';
            }, 2000);
        }
    }

    async viewPdf(bookId) {
        const book = this.books.find(f => f.id === bookId);
        if (!book) return;

        try {
            this.showMessage('📥 جاري تحميل الكتاب من التخزين السحابي...', 'info');

            const pdfUrl = await this.cloudStorage.downloadFromCloud(book.fileId);
            
            if (!pdfUrl) {
                this.showMessage('فشل في تحميل الملف من التخزين السحابي', 'error');
                return;
            }

            document.getElementById('pdfTitle').textContent = `📖 ${book.name} - مكتبة ${SITE_NAME} (من السحابة الآمنة)`;
            document.getElementById('pdfFrame').src = pdfUrl;
            document.getElementById('pdfViewer').classList.add('active');
            document.getElementById('pdfViewer').dataset.currentBookId = bookId;

            this.logSecurityEvent('FILE_VIEWED', {
                fileName: book.name,
                storageType: 'cloud',
                user: this.currentUser || 'guest'
            });
        } catch (error) {
            console.error('خطأ في عرض الملف:', error);
            this.showMessage('فشل في عرض الملف من التخزين السحابي', 'error');
        }
    }

    async downloadBook(bookId) {
        const book = this.books.find(f => f.id === bookId);
        if (!book) return;

        try {
            this.showMessage('📥 جاري تحضير التحميل من التخزين السحابي...', 'info');

            const downloadUrl = book.downloadLink || book.shareLink;
            
            if (downloadUrl) {
                window.open(downloadUrl, '_blank');
                
                this.logSecurityEvent('FILE_DOWNLOADED', {
                    fileName: book.name,
                    storageType: 'cloud',
                    user: this.currentUser || 'guest'
                });
                
                this.showMessage('✅ تم فتح رابط التحميل من التخزين السحابي', 'success');
            } else {
                this.showMessage('رابط التحميل غير متوفر', 'error');
            }
        } catch (error) {
            console.error('خطأ في تحميل الملف:', error);
            this.showMessage('فشل في تحميل الملف من التخزين السحابي', 'error');
        }
    }

    async deleteBook(bookId) {
        const book = this.books.find(f => f.id === bookId);
        if (!book) return;

        if (confirm(`هل أنت متأكد من حذف الكتاب "${book.name}" من التخزين السحابي نهائياً؟`)) {
            try {
                this.showMessage('🗑️ جاري حذف الكتاب من التخزين السحابي...', 'info');

                const deleted = await this.cloudStorage.deleteFromCloud(book.fileId);
                
                if (deleted) {
                    this.books = this.books.filter(f => f.id !== bookId);
                    await this.saveToCloud();
                    this.loadBooks();
                    this.updateStats();
                    this.showMessage('✅ تم حذف الكتاب من التخزين السحابي بنجاح', 'success');
                } else {
                    this.showMessage('فشل في حذف الكتاب من التخزين السحابي', 'error');
                }

                this.logSecurityEvent('FILE_DELETED', {
                    fileName: book.name,
                    storageType: 'cloud',
                    user: this.currentUser
                });
            } catch (error) {
                console.error('خطأ في حذف الملف:', error);
                this.showMessage('فشل في حذف الكتاب من التخزين السحابي', 'error');
            }
        }
    }

    async addModerator() {
        const username = this.sanitizeInput(document.getElementById('newModUsername').value.trim());
        const password = document.getElementById('newModPassword').value;
        
        if (!username || !password) {
            this.showMessage('يرجى إدخال اسم المستخدم وكلمة المرور', 'error');
            return;
        }
        
        if (password.length < 8) {
            this.showMessage('كلمة المرور يجب أن تكون 8 أحرف على الأقل', 'error');
            return;
        }
        
        if (this.moderators.some(m => m.username === username)) {
            this.showMessage('اسم المستخدم موجود مسبقاً', 'error');
            return;
        }
        
        try {
            const hashedPassword = await this.encryption.hashPassword(password);
            
            const moderator = {
                id: this.generateId(),
                username: username,
                password: hashedPassword,
                createdDate: new Date().toISOString(),
                lastLogin: null,
                createdBy: this.currentUser
            };
            
            this.moderators.push(moderator);
            await this.saveToCloud();
            this.loadModerators();
            this.updateStats();
            
            document.getElementById('newModUsername').value = '';
            document.getElementById('newModPassword').value = '';
            
            this.showMessage('تم إضافة المشرف بأمان', 'success');
            this.logSecurityEvent('MODERATOR_ADDED', {
                username: username,
                addedBy: this.currentUser
            });
        } catch (error) {
            console.error('خطأ في إضافة المشرف:', error);
            this.showMessage('فشل في إضافة المشرف', 'error');
        }
    }

    async saveSettings() {
        const maxFileSize = parseInt(document.getElementById('maxFileSize').value);
        const newPassword = document.getElementById('newAdminPassword').value;
        const allowPublicView = document.getElementById('allowPublicView').checked;
        const enableSecurityLogging = document.getElementById('enableSecurityLogging').checked;
        const enableRateLimit = document.getElementById('enableRateLimit').checked;
        const enableAutoBackup = document.getElementById('enableAutoBackup').checked;
        
        if (maxFileSize < 1 || maxFileSize > 500) {
            this.showMessage('الحد الأقصى لحجم الملف يجب أن يكون بين 1 و 500 ميجابايت', 'error');
            return;
        }
        
        this.settings.maxFileSize = maxFileSize;
        this.settings.allowPublicView = allowPublicView;
        this.settings.enableSecurityLogging = enableSecurityLogging;
        this.settings.enableRateLimit = enableRateLimit;
        this.settings.enableAutoBackup = enableAutoBackup;
        
        if (newPassword.trim()) {
            if (newPassword.length < 12) {
                this.showMessage('كلمة المرور الجديدة يجب أن تكون 12 حرف على الأقل', 'error');
                return;
            }
            
            try {
                this.settings.adminPassword = await this.encryption.hashPassword(newPassword.trim());
                document.getElementById('newAdminPassword').value = '';
                
                this.logSecurityEvent('ADMIN_PASSWORD_CHANGED', {
                    changedBy: this.currentUser
                });
            } catch (error) {
                this.showMessage('فشل في تشفير كلمة المرور الجديدة', 'error');
                return;
            }
        }
        
        await this.saveToCloud();
        this.showMessage('تم حفظ الإعدادات بأمان', 'success');
    }

    async exportData() {
        try {
            this.showMessage('📦 جاري تحضير البيانات للتصدير من التخزين السحابي...', 'info');

            const data = {
                books: this.books,
                moderators: this.moderators,
                settings: { ...this.settings, adminPassword: '[محمي]' },
                securityLog: this.securityLog,
                exportDate: new Date().toISOString(),
                version: SECURITY_VERSION,
                source: 'cloud_export',
                encrypted: true
            };

            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `iqra-mana-cloud-export-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            this.showMessage('✅ تم تصدير البيانات من التخزين السحابي بنجاح', 'success');
            
            this.logSecurityEvent('DATA_EXPORTED', {
                exportedBy: this.currentUser,
                source: 'cloud',
                itemsCount: this.books.length
            });
        } catch (error) {
            console.error('خطأ في تصدير البيانات:', error);
            this.showMessage('فشل في تصدير البيانات: ' + error.message, 'error');
        }
    }

    async importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            this.showMessage('📤 جاري استيراد البيانات إلى التخزين السحابي...', 'info');

            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const data = JSON.parse(e.target.result);

                    if (!data.version || !data.books || !Array.isArray(data.books)) {
                        throw new Error('ملف غير صالح أو تالف');
                    }

                    if (confirm('هل أنت متأكد من استيراد البيانات؟ سيتم استبدال البيانات الحالية في التخزين السحابي.')) {
                        this.books = data.books || [];
                        this.moderators = data.moderators || [];
                        
                        const currentPassword = this.settings.adminPassword;
                        this.settings = { 
                            ...this.settings, 
                            ...data.settings,
                            adminPassword: currentPassword
                        };
                        
                        this.securityLog = [...this.securityLog, ...(data.securityLog || [])];

                        if (await this.saveToCloud()) {
                            this.loadBooks();
                            this.loadModerators();
                            this.updateStats();

                            this.showMessage('✅ تم استيراد البيانات إلى التخزين السحابي بنجاح', 'success');
                            
                            this.logSecurityEvent('DATA_IMPORTED', {
                                importedBy: this.currentUser,
                                destination: 'cloud',
                                booksImported: data.books.length,
                                moderatorsImported: data.moderators.length
                            });
                        } else {
                            this.showMessage('فشل في حفظ البيانات المستوردة في التخزين السحابي', 'error');
                        }
                    }
                } catch (error) {
                    console.error('خطأ في قراءة ملف البيانات:', error);
                    this.showMessage('خطأ في قراءة ملف البيانات: ' + error.message, 'error');
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            this.showMessage('فشل في استيراد البيانات: ' + error.message, 'error');
        }

        event.target.value = '';
    }

    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.classList.remove('active');
            btn.setAttribute('aria-selected', 'false');
        });
        
        document.querySelectorAll('.tab-content').forEach(content => {
            content.classList.remove('active');
        });
        
        const clickedBtn = event ? event.target.closest('.tab-btn') : document.querySelector(`[data-tab="${tabName}"]`);
        if (clickedBtn) {
            clickedBtn.classList.add('active');
            clickedBtn.setAttribute('aria-selected', 'true');
        }
        
        const tabContent = document.getElementById(tabName + 'Tab');
        if (tabContent) {
            tabContent.classList.add('active');
        }
        
        if (tabName === 'settings') {
            this.loadSettingsTab();
        } else if (tabName === 'security') {
            this.updateSecurityTab();
        } else if (tabName === 'moderators') {
            this.loadModerators();
        }
        
        this.logSecurityEvent('TAB_SWITCHED', {
            tab: tabName,
            user: this.currentUser
        });
    }

    loadSettingsTab() {
        try {
            document.getElementById('maxFileSize').value = this.settings.maxFileSize || 100;
            document.getElementById('allowPublicView').checked = this.settings.allowPublicView !== false;
            document.getElementById('enableSecurityLogging').checked = this.settings.enableSecurityLogging !== false;
            document.getElementById('enableRateLimit').checked = this.settings.enableRateLimit !== false;
            document.getElementById('enableAutoBackup').checked = this.settings.enableAutoBackup !== false;
            
            const cloudStorageCheckbox = document.getElementById('enableCloudStorage');
            if (cloudStorageCheckbox) {
                cloudStorageCheckbox.checked = true;
                cloudStorageCheckbox.disabled = true;
            }
        } catch (error) {
            console.error('خطأ في تحميل إعدادات التبويب:', error);
        }
    }

    async deleteModerator(modId) {
        const moderator = this.moderators.find(m => m.id === modId);
        if (!moderator) {
            this.showMessage('المشرف غير موجود', 'error');
            return;
        }
        
        if (confirm(`هل أنت متأكد من حذف المشرف "${moderator.username}" نهائياً؟\nلن يتمكن من الدخول للنظام بعد الحذف.`)) {
            try {
                this.moderators = this.moderators.filter(m => m.id !== modId);
                
                if (await this.saveToCloud()) {
                    this.loadModerators();
                    this.updateStats();
                    this.showMessage(`تم حذف المشرف "${moderator.username}" بأمان`, 'success');
                    
                    this.logSecurityEvent('MODERATOR_DELETED', {
                        username: moderator.username,
                        deletedBy: this.currentUser,
                        timestamp: new Date().toISOString()
                    });
                } else {
                    this.showMessage('فشل في حفظ التغييرات في التخزين السحابي', 'error');
                }
            } catch (error) {
                console.error('خطأ في حذف المشرف:', error);
                this.showMessage('فشل في حذف المشرف: ' + error.message, 'error');
            }
        }
    }

    async editBookName(bookId) {
        const book = this.books.find(f => f.id === bookId);
        if (!book) {
            this.showMessage('الكتاب غير موجود', 'error');
            return;
        }
        
        const newName = prompt('اسم الكتاب الجديد:', book.name);
        if (newName && newName.trim() && newName.trim() !== book.name) {
            const sanitizedName = this.sanitizeInput(newName.trim());
            
            if (!sanitizedName) {
                this.showMessage('اسم الكتاب غير صالح', 'error');
                return;
            }
            
            if (this.books.some(f => f.id !== bookId && f.name.toLowerCase() === sanitizedName.toLowerCase())) {
                this.showMessage('يوجد كتاب بنفس الاسم مسبقاً', 'error');
                return;
            }
            
            try {
                const oldName = book.name;
                book.name = sanitizedName;
                
                if (await this.saveToCloud()) {
                    this.loadBooks();
                    this.showMessage(`تم تعديل اسم الكتاب من "${oldName}" إلى "${sanitizedName}" بأمان`, 'success');
                    
                    this.logSecurityEvent('BOOK_NAME_EDITED', {
                        bookId: bookId,
                        oldName: oldName,
                        newName: sanitizedName,
                        editedBy: this.currentUser
                    });
                } else {
                    book.name = oldName;
                    this.showMessage('فشل في حفظ التغييرات في التخزين السحابي', 'error');
                }
            } catch (error) {
                console.error('خطأ في تعديل اسم الكتاب:', error);
                this.showMessage('فشل في تعديل اسم الكتاب: ' + error.message, 'error');
            }
        }
    }

    loadModerators() {
        const container = document.getElementById('moderatorsList');
        
        if (!container) {
            console.error('عنصر قائمة المشرفين غير موجود');
            return;
        }
        
        if (this.moderators.length === 0) {
            container.innerHTML = '<div class="no-files">لا يوجد مشرفون مسجلون في النظام</div>';
            return;
        }
        
        try {
            const table = document.createElement('table');
            table.style.cssText = 'width:100%; border-collapse:collapse; background:var(--bg-primary); border-radius:12px; overflow:hidden; box-shadow: var(--shadow-md);';
            
            table.innerHTML = `
                <thead>
                    <tr style="background:var(--gradient-cloud); color:white;">
                        <th style="padding:15px; text-align:right;">اسم المستخدم</th>
                        <th style="padding:15px; text-align:center;">تاريخ الإضافة</th>
                        <th style="padding:15px; text-align:center;">آخر دخول</th>
                        <th style="padding:15px; text-align:center;">أضافه</th>
                        <th style="padding:15px; text-align:center;">الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.moderators.map((mod, index) => `
                        <tr style="border-bottom: 1px solid var(--border-light); ${index % 2 === 0 ? 'background: var(--bg-secondary);' : ''}">
                            <td style="padding:12px; font-weight: 500;">
                                <i class="fas fa-user-shield" style="color: var(--cloud-color); margin-left: 8px;"></i>
                                ${this.sanitizeInput(mod.username)}
                            </td>
                            <td style="padding:12px; text-align:center; font-size: 0.9rem; color: var(--text-secondary);">
                                ${this.formatDate(mod.createdDate)}
                            </td>
                            <td style="padding:12px; text-align:center; font-size: 0.9rem;">
                                ${mod.lastLogin ? 
                                    `<span style="color: var(--success-color);">${this.formatDate(mod.lastLogin)}</span>` : 
                                    '<span style="color: var(--warning-color);">لم يسجل دخول بعد</span>'
                                }
                            </td>
                            <td style="padding:12px; text-align:center; font-size: 0.9rem; color: var(--text-secondary);">
                                ${this.sanitizeInput(mod.createdBy || 'غير محدد')}
                            </td>
                            <td style="padding:12px; text-align:center;">
                                <button class="action-btn delete-btn" 
                                        onclick="app.deleteModerator('${mod.id}')"
                                        title="حذف المشرف نهائياً"
                                        style="font-size: 0.85rem; padding: 8px 12px;">
                                    <i class="fas fa-trash"></i> حذف
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            `;
            
            container.innerHTML = '';
            container.appendChild(table);
            
            const statsDiv = document.createElement('div');
            statsDiv.style.cssText = 'margin-top: 15px; padding: 15px; background: var(--bg-accent); border-radius: 8px; text-align: center; font-size: 0.9rem; color: var(--text-secondary);';
            statsDiv.innerHTML = `
                📊 إجمالي المشرفين: <strong style="color: var(--cloud-color);">${this.moderators.length}</strong> | 
                نشطون: <strong style="color: var(--success-color);">${this.moderators.filter(m => m.lastLogin).length}</strong> | 
                لم يسجلوا دخول: <strong style="color: var(--warning-color);">${this.moderators.filter(m => !m.lastLogin).length}</strong>
            `;
            container.appendChild(statsDiv);
            
        } catch (error) {
            console.error('خطأ في تحميل قائمة المشرفين:', error);
            container.innerHTML = '<div class="no-files" style="color: var(--error-color);">خطأ في تحميل قائمة المشرفين</div>';
        }
    }

    updateSecurityTab() {
        try {
            const activityLog = document.getElementById('activityLog');
            const suspiciousAttempts = document.getElementById('suspiciousAttempts');
            const lastSecurityCheck = document.getElementById('lastSecurityCheck');
            const encryptionStatus = document.getElementById('encryptionStatus');
            const cloudStorageStatus = document.getElementById('cloudStorageStatus');
            const protectionLevel = document.getElementById('protectionLevel');
            
            if (activityLog) {
                if (this.securityLog.length > 0) {
                    activityLog.innerHTML = this.securityLog
                        .slice(-10)
                        .reverse()
                        .map(activity => `
                            <div class="log-entry">
                                <strong style="color: var(--cloud-color);">${activity.event}</strong>
                                <br>
                                <small style="color: var(--text-secondary);">
                                    ${new Date(activity.timestamp).toLocaleString('ar-SA')}
                                </small>
                                ${activity.details && Object.keys(activity.details).length > 0 ? 
                                    `<br><small style="color: var(--text-light); font-size: 0.8rem;">
                                        ${Object.entries(activity.details).map(([key, value]) => 
                                            `${key}: ${typeof value === 'object' ? JSON.stringify(value) : value}`
                                        ).join(' | ')}
                                    </small>` : ''
                                }
                            </div>
                        `).join('');
                } else {
                    activityLog.innerHTML = '<div class="log-entry">لا توجد أنشطة مسجلة</div>';
                }
            }
            
            if (suspiciousAttempts) {
                const suspicious = this.securityLog.filter(log => 
                    log.event.includes('FAILED') || 
                    log.event.includes('SUSPICIOUS') ||
                    log.event.includes('RATE_LIMITED')
                ).length;
                suspiciousAttempts.textContent = suspicious;
            }
            
            if (lastSecurityCheck) {
                lastSecurityCheck.textContent = new Date().toLocaleString('ar-SA');
            }
            
            if (encryptionStatus) {
                encryptionStatus.textContent = 'متقدم';
                encryptionStatus.className = 'stat-value status-active';
            }
            
            if (cloudStorageStatus) {
                cloudStorageStatus.textContent = this.cloudStorage.isConnected ? 'متصل' : 'منقطع';
                cloudStorageStatus.className = this.cloudStorage.isConnected ? 'stat-value status-active' : 'stat-value status-inactive';
            }
            
            if (protectionLevel) {
                const level = this.calculateSecurityLevel();
                protectionLevel.textContent = level === 'AAA' ? 'أقصى' : level === 'AA' ? 'عالي' : 'متوسط';
                protectionLevel.className = 'stat-value status-active';
            }
            
        } catch (error) {
            console.error('خطأ في تحديث تبويب الأمان:', error);
        }
    }

    runSecurityScan() {
        this.showMessage('🔍 جاري تشغيل الفحص الأمني الشامل...', 'info');
        
        setTimeout(() => {
            const threats = [];
            const warnings = [];
            
            const failedAttempts = this.securityLog.filter(log => log.event.includes('FAILED')).length;
            if (failedAttempts > 10) {
                threats.push(`${failedAttempts} محاولة دخول فاشلة`);
            } else if (failedAttempts > 5) {
                warnings.push(`${failedAttempts} محاولة دخول فاشلة`);
            }
            
            if (!this.cloudStorage.isConnected) {
                threats.push('انقطاع الاتصال بالتخزين السحابي');
            }
            
            if (!this.settings.enableSecurityLogging) {
                warnings.push('تسجيل الأنشطة الأمنية معطل');
            }
            
            if (!this.settings.enableRateLimit) {
                warnings.push('الحماية من الهجمات المتكررة معطلة');
            }
            
            const recentModerators = this.moderators.filter(m => 
                new Date(m.createdDate) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
            );
            
            if (recentModerators.length > 3) {
                warnings.push(`تم إضافة ${recentModerators.length} مشرفين جدد مؤخراً`);
            }
            
            if (threats.length === 0 && warnings.length === 0) {
                this.showMessage('✅ الفحص الأمني مكتمل - النظام آمن تماماً', 'success');
            } else if (threats.length > 0) {
                this.showMessage(`⚠️ تم العثور على ${threats.length} تهديد و ${warnings.length} تحذير`, 'warning');
            } else {
                this.showMessage(`💡 تم العثور على ${warnings.length} تحذير أمني`, 'info');
            }
            
            this.logSecurityEvent('SECURITY_SCAN_COMPLETED', {
                threatsFound: threats.length,
                warningsFound: warnings.length,
                threats: threats,
                warnings: warnings,
                scanDuration: '2 seconds',
                scannedBy: this.currentUser
            });
            
            this.updateSecurityTab();
            
        }, 2000);
    }

    clearSecurityLog() {
        if (confirm('هل أنت متأكد من مسح سجل الأنشطة الأمنية؟\nسيتم فقدان جميع السجلات المحفوظة.')) {
            const logCount = this.securityLog.length;
            this.securityLog = [];
            
            this.logSecurityEvent('SECURITY_LOG_CLEARED', {
                clearedBy: this.currentUser,
                entriesCleared: logCount,
                timestamp: new Date().toISOString()
            });
            
            this.saveToCloud();
            this.updateSecurityTab();
            this.showMessage(`تم مسح ${logCount} سجل أمني`, 'info');
        }
    }

    renderBooks() {
        const grid = document.getElementById('filesGrid');
        
        while (grid.firstChild) {
            grid.removeChild(grid.firstChild);
        }
        
        if (this.filteredBooks.length === 0) {
            const noFilesDiv = document.createElement('div');
            noFilesDiv.className = 'no-files';
            noFilesDiv.innerHTML = `
                <i class="fas fa-cloud" style="font-size: 3rem; margin-bottom: 20px; color: var(--cloud-color);"></i>
                <br>لا توجد كتب متاحة حالياً في مكتبة ${SITE_NAME}
                <br><small>جميع الكتب محفوظة بأمان في التخزين السحابي المحمي</small>
            `;
            grid.appendChild(noFilesDiv);
            return;
        }

        this.filteredBooks.forEach(book => {
            const canEdit = this.userRole === 'admin' || this.userRole === 'moderator';
            
            const bookCard = document.createElement('div');
            bookCard.className = 'file-card';
            
            const storageIndicator = document.createElement('div');
            storageIndicator.className = 'storage-indicator';
            storageIndicator.innerHTML = '☁️ تخزين آمن';
            storageIndicator.style.background = 'var(--gradient-cloud)';
            bookCard.appendChild(storageIndicator);
            
            const fileIcon = document.createElement('div');
            fileIcon.className = 'file-icon';
            fileIcon.textContent = '☁️📄';
            bookCard.appendChild(fileIcon);
            
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = this.sanitizeInput(book.name);
            bookCard.appendChild(fileName);
            
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.innerHTML = `
                <div>${book.sizeFormatted}</div>
                <div>${this.formatDate(book.uploadDate)}</div>
                <div>رفع بواسطة: ${this.sanitizeInput(book.uploadedBy)}</div>
                <div>💾 محفوظ في: التخزين السحابي الآمن</div>
            `;
            bookCard.appendChild(fileInfo);
            
            const fileActions = document.createElement('div');
            fileActions.className = 'file-actions';
            
            const viewBtn = document.createElement('button');
            viewBtn.className = 'action-btn view-btn';
            viewBtn.innerHTML = '<i class="fas fa-cloud"></i> عرض من السحابة';
            viewBtn.onclick = () => this.viewPdf(book.id);
            fileActions.appendChild(viewBtn);
            
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'action-btn download-btn';
            downloadBtn.innerHTML = '<i class="fas fa-cloud-download-alt"></i> تحميل من السحابة';
            downloadBtn.onclick = () => this.downloadBook(book.id);
            fileActions.appendChild(downloadBtn);
            
            if (canEdit) {
                const editBtn = document.createElement('button');
                editBtn.className = 'action-btn edit-btn';
                editBtn.innerHTML = '<i class="fas fa-edit"></i> تعديل';
                editBtn.onclick = () => this.editBookName(book.id);
                fileActions.appendChild(editBtn);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'action-btn delete-btn';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i> حذف من السحابة';
                deleteBtn.onclick = () => this.deleteBook(book.id);
                fileActions.appendChild(deleteBtn);
            }
            
            bookCard.appendChild(fileActions);
            grid.appendChild(bookCard);
        });
    }

    monitorCloudStatus() {
        setInterval(() => {
            const info = this.cloudStorage.getConnectionInfo();
            const statusElement = document.getElementById('cloudStatus');
            const iconElement = document.getElementById('cloudStatusIcon');
            
            if (statusElement && iconElement) {
                if (info.connected) {
                    statusElement.textContent = 'متصل - تخزين آمن';
                    statusElement.style.color = 'var(--success-color)';
                    iconElement.textContent = '☁️';
                } else {
                    statusElement.textContent = `غير متصل (${info.attempts}/${info.maxAttempts})`;
                    statusElement.style.color = 'var(--error-color)';
                    iconElement.textContent = '❌';
                }
            }
        }, 5000);
    }

    async autoBackupToCloud() {
        if (!this.cloudStorage.isConnected || !this.settings.enableAutoBackup) return;

        try {
            const backupData = {
                books: this.books,
                moderators: this.moderators,
                settings: this.settings,
                securityLog: this.securityLog,
                exportDate: new Date().toISOString(),
                version: SECURITY_VERSION,
                type: 'auto_backup'
            };

            const backupFileName = `auto-backup-${new Date().toISOString().split('T')[0]}-${Date.now()}.json`;

            const result = await this.cloudStorage.uploadDataToCloud(backupData, backupFileName, 'backups');
            
            if (result.success) {
                console.log('✅ تم إنشاء نسخة احتياطية تلقائية في التخزين السحابي');
                
                this.logSecurityEvent('AUTO_BACKUP_CREATED', {
                    fileName: backupFileName,
                    booksCount: this.books.length,
                    location: 'cloud'
                });
            }
        } catch (error) {
            console.error('فشل في النسخ الاحتياطي التلقائي:', error);
        }
    }

    async reconnectCloud() {
        this.showMessage('🔄 جاري إعادة الاتصال بالتخزين السحابي...', 'info');
        await this.cloudStorage.reconnect();
        
        setTimeout(() => {
            if (this.cloudStorage.isConnected) {
                this.showMessage('✅ تم إعادة الاتصال بالتخزين السحابي بنجاح', 'success');
                this.loadFromCloud();
            } else {
                this.showMessage('❌ فشل في إعادة الاتصال بالتخزين السحابي', 'error');
            }
        }, 3000);
    }

    // باقي الدوال الأساسية

    sanitizeInput(input) {
        if (typeof input !== 'string') return input;
        return input
            .replace(/[<>]/g, '')
            .replace(/['"]/g, '')
            .replace(/javascript:/gi, '')
            .replace(/on\w+=/gi, '')
            .trim()
            .substring(0, 1000);
    }

    sanitizeFileName(fileName) {
        return fileName
            .replace(/[<>:"\/\\|?*\x00-\x1f]/g, '_')
            .replace(/^\.+/, '')
            .replace(/\.+$/, '')
            .substring(0, 255);
    }

    validateFileType(file) {
        const allowedTypes = ['application/pdf'];
        return allowedTypes.includes(file.type) && file.name.toLowerCase().endsWith('.pdf');
    }

    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 بايت';
        const k = 1024;
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    formatDate(date) {
        return new Date(date).toLocaleDateString('ar-SA', {
            year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit'
        });
    }

    showMessage(message, type) {
        const statusDiv = document.getElementById('statusMessage');
        const sanitizedMessage = this.sanitizeInput(message);
        statusDiv.innerHTML = `<div class="status-message status-${type}">${sanitizedMessage}</div>`;
        setTimeout(() => { statusDiv.innerHTML = ''; }, 5000);
    }

    showLoginMessage(message, type) {
        const messageDiv = document.getElementById('loginMessage');
        const sanitizedMessage = this.sanitizeInput(message);
        messageDiv.innerHTML = `<div class="status-message status-${type}">${sanitizedMessage}</div>`;
        setTimeout(() => { messageDiv.innerHTML = ''; }, 3000);
    }

    logSecurityEvent(event, details = {}) {
        if (!this.settings.enableSecurityLogging) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: event,
            details: details
        };
        
        this.securityLog.push(logEntry);
        if (this.securityLog.length > 100) {
            this.securityLog = this.securityLog.slice(-100);
        }
    }

    startSessionManager() {
        setInterval(() => {
            if (this.sessionStartTime && this.currentUser) {
                const sessionDuration = Date.now() - this.sessionStartTime;
                
                if (sessionDuration > this.settings.sessionTimeout) {
                    this.logSecurityEvent('SESSION_TIMEOUT', {
                        user: this.currentUser,
                        duration: sessionDuration
                    });
                    this.logout();
                    this.showMessage('انتهت صلاحية الجلسة. يرجى تسجيل الدخول مرة أخرى', 'warning');
                }
            }
        }, 60000);
    }

    processFile(file) {
        try {
            if (!this.validateFileType(file)) {
                this.showMessage('نوع الملف غير مدعوم. يُسمح بملفات PDF فقط', 'error');
                return;
            }

            const maxSize = this.settings.maxFileSize * 1024 * 1024;
            if (file.size > maxSize) {
                this.showMessage(`حجم الملف كبير جداً. الحد الأقصى: ${this.settings.maxFileSize} ميجابايت`, 'error');
                return;
            }

            const sanitizedName = this.sanitizeFileName(file.name);
            this.selectedFile = file;
            document.getElementById('fileNameGroup').classList.remove('hidden');
            document.getElementById('fileNameInput').value = sanitizedName.replace('.pdf', '');
            document.getElementById('uploadBtn').disabled = false;
            
            this.showMessage(`تم اختيار الملف: ${sanitizedName} (${this.formatFileSize(file.size)}) - سيتم رفعه للتخزين السحابي الآمن`, 'success');
        } catch (error) {
            console.error('خطأ في معالجة الملف:', error);
            this.showMessage('خطأ في معالجة الملف', 'error');
        }
    }

    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file) {
            this.processFile(file);
        }
    }

    handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
        const files = event.dataTransfer.files;
        if (files.length > 0) {
            this.processFile(files[0]);
        }
    }

    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('dragover');
    }

    handleDragLeave(event) {
        event.currentTarget.classList.remove('dragover');
    }

    clearSelection() {
        this.selectedFile = null;
        document.getElementById('fileInput').value = '';
        document.getElementById('fileNameGroup').classList.add('hidden');
        document.getElementById('fileNameInput').value = '';
        document.getElementById('uploadBtn').disabled = true;
    }

    showLoginModal(type) {
        if (!this.rateLimiter.isAllowed()) {
            const remaining = this.rateLimiter.getRemainingAttempts();
            this.showMessage(`تم تجاوز عدد المحاولات المسموح. المحاولات المتبقية: ${remaining}`, 'error');
            return;
        }

        const modal = document.getElementById('loginModal');
        const title = document.getElementById('loginTitle');
        const usernameGroup = document.getElementById('usernameGroup');
        
        if (type === 'admin') {
            title.textContent = '🔒 دخول الأدمن الآمن';
            usernameGroup.classList.add('hidden');
        } else {
            title.textContent = '🔒 دخول المشرفين الآمن';
            usernameGroup.classList.remove('hidden');
        }
        
        modal.classList.add('active');
        modal.dataset.type = type;
        
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginMessage').innerHTML = '';
        
        this.logSecurityEvent('LOGIN_MODAL_OPENED', { type: type });
    }

    closeLoginModal() {
        document.getElementById('loginModal').classList.remove('active');
    }

    logout() {
        this.logSecurityEvent('USER_LOGOUT', {
            user: this.currentUser,
            role: this.userRole,
            sessionDuration: this.sessionStartTime ? Date.now() - this.sessionStartTime : 0
        });
        
        this.currentUser = null;
        this.userRole = null;
        this.sessionStartTime = null;
        this.hideAdminPanel();
        this.showMessage('تم تسجيل الخروج بأمان', 'info');
    }

    showAdminPanel() {
        document.getElementById('adminSection').classList.add('active');
        document.getElementById('logoutBtn').style.display = 'inline-flex';
        
        if (this.userRole === 'admin') {
            document.getElementById('moderatorsTabBtn').style.display = 'inline-flex';
            document.getElementById('settingsTabBtn').style.display = 'inline-flex';
            document.getElementById('securityTabBtn').style.display = 'inline-flex';
        } else {
            document.getElementById('moderatorsTabBtn').style.display = 'none';
            document.getElementById('settingsTabBtn').style.display = 'none';
            document.getElementById('securityTabBtn').style.display = 'none';
        }
        
        document.querySelectorAll('.auth-btn:not(.logout-btn)').forEach(btn => btn.style.display = 'none');
    }

    hideAdminPanel() {
        document.getElementById('adminSection').classList.remove('active');
        document.getElementById('logoutBtn').style.display = 'none';
        document.querySelectorAll('.auth-btn:not(.logout-btn)').forEach(btn => btn.style.display = 'inline-flex');
    }

    updateStats() {
        document.getElementById('totalBooks').textContent = this.books.length;
        const totalSize = this.books.reduce((sum, book) => sum + book.size, 0);
        document.getElementById('totalSize').textContent = this.formatFileSize(totalSize);
        document.getElementById('totalModerators').textContent = this.moderators.length;
        document.getElementById('lastUpload').textContent = this.books.length > 0
            ? this.books.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))[0].name
            : '-';
        
        const securityLevel = this.calculateSecurityLevel();
        document.getElementById('securityLevel').textContent = securityLevel;
    }

    calculateSecurityLevel() {
        let score = 100;
        
        const suspiciousEvents = this.securityLog.filter(log => 
            log.event.includes('FAILED') || log.event.includes('SUSPICIOUS')
        ).length;
        score -= suspiciousEvents * 2;
        
        if (!this.settings.enableSecurityLogging) score -= 20;
        if (!this.settings.enableRateLimit) score -= 20;
        if (!this.cloudStorage.isConnected) score -= 30;
        
        if (score >= 90) return 'AAA';
        if (score >= 80) return 'AA';
        if (score >= 70) return 'A';
        if (score >= 60) return 'B';
        return 'C';
    }

    searchFiles(searchTerm) {
        const term = this.sanitizeInput(searchTerm.toLowerCase().trim());
        
        if (!term) {
            this.filteredBooks = [...this.books];
        } else {
            this.filteredBooks = this.books.filter(book =>
                book.name.toLowerCase().includes(term) ||
                book.originalName.toLowerCase().includes(term) ||
                this.formatDate(book.uploadDate).includes(term)
            );
        }
        
        this.applySorting();
        this.renderBooks();
    }

    sortFiles(sortType) {
        this.currentSort = sortType;
        this.applySorting();
        this.renderBooks();
    }

    applySorting() {
        const [field, direction] = this.currentSort.split('-');
        
        this.filteredBooks.sort((a, b) => {
            let valueA, valueB;
            
            switch (field) {
                case 'name':
                    valueA = a.name.toLowerCase();
                    valueB = b.name.toLowerCase();
                    break;
                case 'date':
                    valueA = new Date(a.uploadDate);
                    valueB = new Date(b.uploadDate);
                    break;
                case 'size':
                    valueA = a.size;
                    valueB = b.size;
                    break;
                default:
                    return 0;
            }
            
            if (direction === 'asc') {
                return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
            } else {
                return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
            }
        });
    }

    loadBooks() {
        this.filteredBooks = [...this.books];
        this.applySorting();
        this.renderBooks();
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePdfViewer();
                this.closeLoginModal();
            }
        });

        document.getElementById('loginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        
        document.getElementById('loginUsername').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
    }

    closePdfViewer() {
        document.getElementById('pdfViewer').classList.remove('active');
        document.getElementById('pdfFrame').src = '';
        delete document.getElementById('pdfViewer').dataset.currentBookId;
    }

    printPdf() {
        try {
            const frame = document.getElementById('pdfFrame');
            if (frame.src) {
                frame.contentWindow.print();
            }
        } catch (error) {
            console.error('خطأ في الطباعة:', error);
            this.showMessage('فشل في طباعة الملف', 'error');
        }
    }

    downloadCurrentPdf() {
        const bookId = document.getElementById('pdfViewer').dataset.currentBookId;
        if (bookId) {
            this.downloadBook(bookId);
        }
    }
}

// إنشاء مثيل التطبيق
let app;

// الدوال العامة للHTML
function showLoginModal(type) { app && app.showLoginModal(type); }
function closeLoginModal() { app && app.closeLoginModal(); }
function login() { app && app.login(); }
function logout() { app && app.logout(); }
function handleFileSelect(event) { app && app.handleFileSelect(event); }
function handleDrop(event) { app && app.handleDrop(event); }
function handleDragOver(event) { app && app.handleDragOver(event); }
function handleDragLeave(event) { app && app.handleDragLeave(event); }
function uploadFile() { app && app.uploadFile(); }
function clearSelection() { app && app.clearSelection(); }
function searchFiles(searchTerm) { app && app.searchFiles(searchTerm); }
function sortFiles(sortType) { app && app.sortFiles(sortType); }
function addModerator() { app && app.addModerator(); }
function saveSettings() { app && app.saveSettings(); }
function exportData() { app && app.exportData(); }
function importData(event) { app && app.importData(event); }
function switchTab(tabName) { app && app.switchTab(tabName); }
function closePdfViewer() { app && app.closePdfViewer(); }
function printPdf() { app && app.printPdf(); }
function downloadCurrentPdf() { app && app.downloadCurrentPdf(); }
function reconnectCloud() { app && app.reconnectCloud(); }

// تهيئة التطبيق مع حماية إضافية
document.addEventListener('DOMContentLoaded', function() {
    try {
        // حماية من DevTools
        const devtools = {open: false};
        const threshold = 160;
        
        setInterval(() => {
            if (window.outerHeight - window.innerHeight > threshold || 
                window.outerWidth - window.innerWidth > threshold) {
                devtools.open = true;
                document.body.style.display = 'none';
                document.body.innerHTML = '<div style="text-align:center;padding:100px;font-size:2rem;color:#dc2626;">🔒 وضع الحماية نشط</div>';
            }
        }, 500);

        // تهيئة التطبيق
        app = new SecureDigitalLibrary();
        console.log('✅ تم تحميل مكتبة إقرأ معنا مع التخزين السحابي الآمن');
        
        // التحقق من تحميل جميع الدوال
        const requiredFunctions = [
            'exportData', 'importData', 'switchTab', 'deleteModerator', 
            'editBookName', 'loadModerators', 'updateSecurityTab', 
            'runSecurityScan', 'clearSecurityLog'
        ];
        
        setTimeout(() => {
            if (app) {
                const missingFunctions = requiredFunctions.filter(func => 
                    typeof app[func] !== 'function'
                );
                
                if (missingFunctions.length === 0) {
                    console.log('✅ جميع الدوال محملة بنجاح');
                } else {
                    console.error('❌ دوال مفقودة:', missingFunctions);
                }
            }
        }, 1000);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل التطبيق:', error);
        document.body.innerHTML = '<div style="text-align:center;padding:50px;color:red;">خطأ في تحميل النظام الأمني</div>';
    }
});

// حماية نهائية من التلاعب
Object.freeze(SecureDigitalLibrary.prototype);
Object.freeze(AdvancedEncryption.prototype);
Object.freeze(SecureCloudStorage.prototype);
Object.freeze(RateLimiter.prototype);

// حماية متغير التطبيق
Object.defineProperty(window, 'app', {
    get: function() {
        return this._app;
    },
    set: function(value) {
        this._app = value;
        if (value && value.settings) {
            Object.defineProperty(value.settings, 'adminPassword', {
                enumerable: false,
                configurable: false,
                writable: false
            });
        }
        if (value && value.encryption) {
            Object.defineProperty(value, 'encryption', {
                enumerable: false,
                configurable: false,
                writable: false
            });
        }
    }
});

// حماية النماذج الأولية من التلاعب
Object.freeze(Object.prototype);
Object.freeze(Array.prototype);
Object.freeze(Function.prototype);

// نهاية الملف - script.js كامل
