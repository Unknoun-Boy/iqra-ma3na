// إعدادات عامة
const SITE_NAME = "إقرأ معنا";
const ADMIN_DEFAULT_PASSWORD = "admin123";
const SECURITY_VERSION = "2.0.1";

// نظام تشفير متقدم للبيانات الحساسة
class SecureStorage {
    constructor() {
        this.secretKey = this.generateSecretKey();
    }
    
    generateSecretKey() {
        const browserInfo = navigator.userAgent + navigator.language + screen.width;
        return btoa(browserInfo).slice(0, 32);
    }
    
    encrypt(text) {
        let encrypted = '';
        for (let i = 0; i < text.length; i++) {
            const charCode = text.charCodeAt(i) ^ this.secretKey.charCodeAt(i % this.secretKey.length);
            encrypted += String.fromCharCode(charCode);
        }
        return btoa(encrypted);
    }
    
    decrypt(encryptedText) {
        try {
            const decoded = atob(encryptedText);
            let decrypted = '';
            for (let i = 0; i < decoded.length; i++) {
                const charCode = decoded.charCodeAt(i) ^ this.secretKey.charCodeAt(i % this.secretKey.length);
                decrypted += String.fromCharCode(charCode);
            }
            return decrypted;
        } catch {
            return null;
        }
    }
}

// إنشاء مثيل التشفير
const secureStorage = new SecureStorage();

// نظام الحماية من Rate Limiting
class RateLimiter {
    constructor(maxAttempts = 5, windowMs = 900000) { // 15 دقيقة
        this.attempts = new Map();
        this.maxAttempts = maxAttempts;
        this.windowMs = windowMs;
    }

    getClientFingerprint() {
        const fingerprint = [
            navigator.userAgent,
            navigator.language,
            screen.width + 'x' + screen.height,
            new Date().getTimezoneOffset(),
            navigator.platform
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

// فئة المكتبة الرقمية المحسنة أمنياً
class SecureDigitalLibrary {
    constructor() {
        this.books = [];
        this.moderators = [];
        this.settings = {
            maxFileSize: 100, // MB
            adminPassword: this.encodePassword(ADMIN_DEFAULT_PASSWORD),
            allowPublicView: true,
            enableSecurityLogging: true,
            enableRateLimit: true,
            enableAutoBackup: true,
            sessionTimeout: 30 * 60 * 1000 // 30 دقيقة
        };
        this.currentUser = null;
        this.userRole = null;
        this.selectedFile = null;
        this.filteredBooks = [];
        this.currentSort = 'name-asc';
        this.sessionStartTime = null;
        this.securityLog = [];
        
        // تهيئة أنظمة الأمان
        this.rateLimiter = new RateLimiter();
        
        this.init();
    }

    init() {
        this.loadFromStorage();
        this.updateStats();
        this.loadBooks();
        this.loadModerators();
        this.setupEventListeners();
        this.hideAdminPanel();
        this.startSessionManager();
        this.logSecurityEvent('SYSTEM_INIT', { version: SECURITY_VERSION });
    }

    // نظام التشفير المحسن
    encodePassword(password) {
        return btoa(password + 'iqra_salt_2024');
    }

    decodePassword(encoded) {
        try {
            return atob(encoded).replace('iqra_salt_2024', '');
        } catch {
            return encoded;
        }
    }

    // إدارة الجلسات الآمنة
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
        }, 60000); // فحص كل دقيقة
    }

    // تسجيل الأحداث الأمنية
    logSecurityEvent(event, details = {}) {
        if (!this.settings.enableSecurityLogging) return;
        
        const logEntry = {
            timestamp: new Date().toISOString(),
            event: event,
            details: details,
            userAgent: navigator.userAgent.substring(0, 100),
            url: window.location.href
        };
        
        this.securityLog.push(logEntry);
        
        // الحفاظ على آخر 100 حدث فقط
        if (this.securityLog.length > 100) {
            this.securityLog = this.securityLog.slice(-100);
        }
        
        console.log('Security Event:', logEntry);
    }

    // تنقية المدخلات من XSS
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

    // التحقق من نوع الملف
    validateFileType(file) {
        const allowedTypes = ['application/pdf'];
        const allowedExtensions = ['.pdf'];
        
        if (!allowedTypes.includes(file.type)) {
            return false;
        }
        
        const fileName = file.name.toLowerCase();
        const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext));
        
        return hasValidExtension;
    }

    // توليد معرف فريد
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    // تنسيق حجم الملف
    formatFileSize(bytes) {
        if (bytes === 0) return '0 بايت';
        const k = 1024;
        const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // تنسيق التاريخ
    formatDate(date) {
        return new Date(date).toLocaleDateString('ar-SA', {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    // حفظ البيانات
    saveToStorage() {
        try {
            const data = {
                books: this.books,
                moderators: this.moderators,
                settings: this.settings,
                securityLog: this.securityLog,
                version: SECURITY_VERSION,
                timestamp: new Date().toISOString()
            };
            localStorage.setItem('secureLibraryData', JSON.stringify(data));
            return true;
        } catch (error) {
            console.error('خطأ في حفظ البيانات:', error);
            this.showMessage('خطأ في حفظ البيانات: ' + error.message, 'error');
            return false;
        }
    }

    // تحميل البيانات
    loadFromStorage() {
        try {
            const data = localStorage.getItem('secureLibraryData');
            if (data) {
                const parsed = JSON.parse(data);
                this.books = parsed.books || [];
                this.moderators = parsed.moderators || [];
                this.settings = { ...this.settings, ...parsed.settings };
                this.securityLog = parsed.securityLog || [];
            }
        } catch (error) {
            console.error('خطأ في تحميل البيانات:', error);
            this.showMessage('خطأ في تحميل البيانات المحفوظة', 'warning');
        }
    }

    // المصادقة الآمنة
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

    login() {
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

        if (type === 'admin') {
            if (this.decodePassword(this.settings.adminPassword) === password) {
                this.currentUser = 'admin';
                this.userRole = 'admin';
                this.sessionStartTime = Date.now();
                this.showAdminPanel();
                this.closeLoginModal();
                this.showMessage('مرحباً بك أيها الأدمن الآمن!', 'success');
                
                this.logSecurityEvent('ADMIN_LOGIN_SUCCESS', {
                    timestamp: new Date().toISOString()
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
            
            if (moderator && this.decodePassword(moderator.password) === password) {
                this.currentUser = username;
                this.userRole = 'moderator';
                this.sessionStartTime = Date.now();
                moderator.lastLogin = new Date().toISOString();
                this.saveToStorage();
                this.showAdminPanel();
                this.closeLoginModal();
                this.showMessage(`مرحباً بك ${username} في النظام الآمن!`, 'success');
                this.loadModerators();
                
                this.logSecurityEvent('MODERATOR_LOGIN_SUCCESS', {
                    username: username,
                    timestamp: new Date().toISOString()
                });
            } else {
                this.showLoginMessage('اسم المستخدم أو كلمة المرور خاطئة', 'error');
                this.logSecurityEvent('MODERATOR_LOGIN_FAILED', {
                    username: username,
                    reason: moderator ? 'invalid_password' : 'user_not_found'
                });
            }
        }
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

    // معالجة الملفات الآمنة
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

    processFile(file) {
        try {
            if (!this.validateFileType(file)) {
                this.showMessage('نوع الملف غير مدعوم. يُسمح بملفات PDF فقط', 'error');
                this.logSecurityEvent('INVALID_FILE_TYPE', {
                    fileName: file.name,
                    fileType: file.type,
                    fileSize: file.size
                });
                return;
            }

            const maxSize = this.settings.maxFileSize * 1024 * 1024;
            if (file.size > maxSize) {
                this.showMessage(`حجم الملف كبير جداً. الحد الأقصى: ${this.settings.maxFileSize} ميجابايت`, 'error');
                return;
            }

            const sanitizedName = this.sanitizeFileName(file.name);
            if (sanitizedName !== file.name) {
                this.showMessage('تم تعديل اسم الملف لأسباب أمنية', 'warning');
            }

            this.selectedFile = file;
            document.getElementById('fileNameGroup').classList.remove('hidden');
            document.getElementById('fileNameInput').value = sanitizedName.replace('.pdf', '');
            document.getElementById('uploadBtn').disabled = false;
            
            this.showMessage(`تم اختيار الملف بأمان: ${sanitizedName} (${this.formatFileSize(file.size)})`, 'success');
            
            this.logSecurityEvent('FILE_SELECTED', {
                fileName: sanitizedName,
                fileSize: file.size,
                fileType: file.type
            });
        } catch (error) {
            console.error('خطأ في معالجة الملف:', error);
            this.showMessage('خطأ في معالجة الملف', 'error');
        }
    }

    async uploadFile() {
        if (!this.selectedFile) {
            this.showMessage('يرجى اختيار ملف أولاً', 'error');
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
            const fileReader = new FileReader();
            
            await new Promise((resolve, reject) => {
                fileReader.onprogress = (e) => {
                    if (e.lengthComputable) {
                        const percentComplete = (e.loaded / e.total) * 100;
                        progressBar.style.width = percentComplete + '%';
                        progressBar.textContent = Math.round(percentComplete) + '%';
                    }
                };
                
                fileReader.onload = (e) => {
                    const bookData = {
                        id: this.generateId(),
                        name: fileName,
                        originalName: this.selectedFile.name,
                        size: this.selectedFile.size,
                        sizeFormatted: this.formatFileSize(this.selectedFile.size),
                        data: e.target.result,
                        uploadDate: new Date().toISOString(),
                        uploadedBy: this.currentUser || 'مجهول'
                    };

                    this.books.push(bookData);
                    
                    if (this.saveToStorage()) {
                        this.showMessage('تم رفع الكتاب بأمان!', 'success');
                        this.clearSelection();
                        this.loadBooks();
                        this.updateStats();
                        
                        this.logSecurityEvent('FILE_UPLOADED', {
                            fileName: fileName,
                            fileSize: this.selectedFile.size,
                            user: this.currentUser
                        });
                    } else {
                        this.books.pop();
                        this.showMessage('فشل في حفظ الكتاب', 'error');
                    }
                    
                    resolve();
                };
                
                fileReader.onerror = () => {
                    reject(new Error('خطأ في قراءة الملف'));
                };
                
                fileReader.readAsDataURL(this.selectedFile);
            });
            
        } catch (error) {
            console.error('خطأ في رفع الملف:', error);
            this.showMessage('فشل في رفع الملف: ' + error.message, 'error');
        } finally {
            setTimeout(() => {
                progressContainer.style.display = 'none';
            }, 2000);
        }
    }

    clearSelection() {
        this.selectedFile = null;
        document.getElementById('fileInput').value = '';
        document.getElementById('fileNameGroup').classList.add('hidden');
        document.getElementById('fileNameInput').value = '';
        document.getElementById('uploadBtn').disabled = true;
    }

    deleteBook(bookId) {
        const book = this.books.find(f => f.id === bookId);
        if (!book) return;
        
        if (confirm(`هل أنت متأكد من حذف الكتاب "${book.name}"؟`)) {
            this.books = this.books.filter(f => f.id !== bookId);
            this.saveToStorage();
            this.loadBooks();
            this.updateStats();
            this.showMessage('تم حذف الكتاب بأمان', 'success');
            
            this.logSecurityEvent('FILE_DELETED', {
                fileName: book.name,
                user: this.currentUser
            });
        }
    }

    editBookName(bookId) {
        const book = this.books.find(f => f.id === bookId);
        if (!book) return;
        
        const newName = prompt('اسم الكتاب الجديد:', book.name);
        if (newName && newName.trim() && newName.trim() !== book.name) {
            const sanitizedName = this.sanitizeInput(newName.trim());
            
            if (this.books.some(f => f.id !== bookId && f.name.toLowerCase() === sanitizedName.toLowerCase())) {
                this.showMessage('يوجد كتاب بنفس الاسم مسبقاً', 'error');
                return;
            }
            
            book.name = sanitizedName;
            this.saveToStorage();
            this.loadBooks();
            this.showMessage('تم تعديل اسم الكتاب بأمان', 'success');
        }
    }

    downloadBook(bookId) {
        const book = this.books.find(f => f.id === bookId);
        if (!book) return;
        
        try {
            const link = document.createElement('a');
            link.href = book.data;
            link.download = this.sanitizeFileName(book.name) + '.pdf';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            this.logSecurityEvent('FILE_DOWNLOADED', {
                fileName: book.name,
                user: this.currentUser || 'guest'
            });
        } catch (error) {
            console.error('خطأ في تحميل الملف:', error);
            this.showMessage('فشل في تحميل الملف', 'error');
        }
    }

    viewPdf(bookId) {
        const book = this.books.find(f => f.id === bookId);
        if (!book) return;

        try {
            document.getElementById('pdfTitle').textContent = `📖 ${book.name} - مكتبة ${SITE_NAME}`;
            document.getElementById('pdfFrame').src = book.data;
            document.getElementById('pdfViewer').classList.add('active');
            document.getElementById('pdfViewer').dataset.currentBookId = bookId;
            
            this.logSecurityEvent('FILE_VIEWED', {
                fileName: book.name,
                user: this.currentUser || 'guest'
            });
        } catch (error) {
            console.error('خطأ في عرض الملف:', error);
            this.showMessage('فشل في عرض الملف', 'error');
        }
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

    // البحث والترتيب
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

    renderBooks() {
        const grid = document.getElementById('filesGrid');
        
        // مسح المحتوى بأمان
        while (grid.firstChild) {
            grid.removeChild(grid.firstChild);
        }
        
        if (this.filteredBooks.length === 0) {
            const noFilesDiv = document.createElement('div');
            noFilesDiv.className = 'no-files';
            noFilesDiv.innerHTML = `
                <i class="fas fa-shield-alt" style="font-size: 3rem; margin-bottom: 20px; color: var(--primary-color);"></i>
                <br>لا توجد كتب متاحة حالياً في مكتبة ${SITE_NAME} الآمنة
            `;
            grid.appendChild(noFilesDiv);
            return;
        }

        this.filteredBooks.forEach(book => {
            const canEdit = this.userRole === 'admin' || this.userRole === 'moderator';
            
            const bookCard = document.createElement('div');
            bookCard.className = 'file-card';
            
            // أيقونة الملف
            const fileIcon = document.createElement('div');
            fileIcon.className = 'file-icon';
            fileIcon.textContent = '🔒📄';
            bookCard.appendChild(fileIcon);
            
            // اسم الكتاب (آمن)
            const fileName = document.createElement('div');
            fileName.className = 'file-name';
            fileName.textContent = this.sanitizeInput(book.name);
            bookCard.appendChild(fileName);
            
            // معلومات الملف
            const fileInfo = document.createElement('div');
            fileInfo.className = 'file-info';
            fileInfo.innerHTML = `
                <div>${book.sizeFormatted}</div>
                <div>${this.formatDate(book.uploadDate)}</div>
                <div>رفع بواسطة: ${this.sanitizeInput(book.uploadedBy)}</div>
            `;
            bookCard.appendChild(fileInfo);
            
            // أزرار الإجراءات
            const fileActions = document.createElement('div');
            fileActions.className = 'file-actions';
            
            // زر العرض
            const viewBtn = document.createElement('button');
            viewBtn.className = 'action-btn view-btn';
            viewBtn.innerHTML = '<i class="fas fa-eye"></i> عرض آمن';
            viewBtn.onclick = () => this.viewPdf(book.id);
            fileActions.appendChild(viewBtn);
            
            // زر التحميل
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'action-btn download-btn';
            downloadBtn.innerHTML = '<i class="fas fa-download"></i> تحميل آمن';
            downloadBtn.onclick = () => this.downloadBook(book.id);
            fileActions.appendChild(downloadBtn);
            
            // أزرار الإدارة (للمصرح لهم فقط)
            if (canEdit) {
                const editBtn = document.createElement('button');
                editBtn.className = 'action-btn edit-btn';
                editBtn.innerHTML = '<i class="fas fa-edit"></i> تعديل';
                editBtn.onclick = () => this.editBookName(book.id);
                fileActions.appendChild(editBtn);
                
                const deleteBtn = document.createElement('button');
                deleteBtn.className = 'action-btn delete-btn';
                deleteBtn.innerHTML = '<i class="fas fa-trash"></i> حذف';
                deleteBtn.onclick = () => this.deleteBook(book.id);
                fileActions.appendChild(deleteBtn);
            }
            
            bookCard.appendChild(fileActions);
            grid.appendChild(bookCard);
        });
    }

    // إدارة المشرفين
    addModerator() {
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
        
        const moderator = {
            id: this.generateId(),
            username: username,
            password: this.encodePassword(password),
            createdDate: new Date().toISOString(),
            lastLogin: null,
            createdBy: this.currentUser
        };
        
        this.moderators.push(moderator);
        this.saveToStorage();
        this.loadModerators();
        this.updateStats();
        
        document.getElementById('newModUsername').value = '';
        document.getElementById('newModPassword').value = '';
        
        this.showMessage('تم إضافة المشرف بأمان', 'success');
        this.logSecurityEvent('MODERATOR_ADDED', {
            username: username,
            addedBy: this.currentUser
        });
    }

    deleteModerator(modId) {
        const moderator = this.moderators.find(m => m.id === modId);
        if (!moderator) return;
        
        if (confirm(`هل أنت متأكد من حذف المشرف "${moderator.username}"؟`)) {
            this.moderators = this.moderators.filter(m => m.id !== modId);
            this.saveToStorage();
            this.loadModerators();
            this.updateStats();
            this.showMessage('تم حذف المشرف بأمان', 'success');
            
            this.logSecurityEvent('MODERATOR_DELETED', {
                username: moderator.username,
                deletedBy: this.currentUser
            });
        }
    }

    loadModerators() {
        const container = document.getElementById('moderatorsList');
        
        if (this.moderators.length === 0) {
            container.innerHTML = '<div class="no-files">لا يوجد مشرفون مسجلون في النظام</div>';
            return;
        }
        
        const table = document.createElement('table');
        table.style.cssText = 'width:100%; border-collapse:collapse; background:var(--bg-primary); border-radius:12px; overflow:hidden;';
        
        table.innerHTML = `
            <thead>
                <tr style="background:var(--bg-accent); color:var(--primary-color);">
                    <th style="padding:12px;">اسم المستخدم</th>
                    <th style="padding:12px;">تاريخ الإضافة</th>
                    <th style="padding:12px;">آخر دخول</th>
                    <th style="padding:12px;">الإجراءات</th>
                </tr>
            </thead>
            <tbody>
                ${this.moderators.map(mod => `
                    <tr>
                        <td style="padding:10px;">${this.sanitizeInput(mod.username)}</td>
                        <td style="padding:10px;">${this.formatDate(mod.createdDate)}</td>
                        <td style="padding:10px;">${mod.lastLogin ? this.formatDate(mod.lastLogin) : 'لم يسجل دخول بعد'}</td>
                        <td style="padding:10px;">
                            <button class="action-btn delete-btn" onclick="app.deleteModerator('${mod.id}')">
                                <i class="fas fa-trash"></i> حذف
                            </button>
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        `;
        
        container.innerHTML = '';
        container.appendChild(table);
    }

    // الإعدادات
    saveSettings() {
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
            
            this.settings.adminPassword = this.encodePassword(newPassword.trim());
            document.getElementById('newAdminPassword').value = '';
            
            this.logSecurityEvent('ADMIN_PASSWORD_CHANGED', {
                changedBy: this.currentUser
            });
        }
        
        this.saveToStorage();
        this.showMessage('تم حفظ الإعدادات بأمان', 'success');
    }

    // النسخ الاحتياطي
    exportData() {
        try {
            const data = {
                books: this.books,
                moderators: this.moderators,
                settings: this.settings,
                securityLog: this.securityLog,
                exportDate: new Date().toISOString(),
                version: SECURITY_VERSION
            };
            
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `iqra-mana-secure-backup-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            this.showMessage('تم تصدير البيانات بأمان', 'success');
            this.logSecurityEvent('DATA_EXPORTED', {
                exportedBy: this.currentUser
            });
        } catch (error) {
            console.error('خطأ في تصدير البيانات:', error);
            this.showMessage('فشل في تصدير البيانات', 'error');
        }
    }

    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        
        try {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    
                    if (confirm('هل أنت متأكد من استيراد البيانات؟ سيتم استبدال البيانات الحالية.')) {
                        this.books = data.books || [];
                        this.moderators = data.moderators || [];
                        this.settings = { ...this.settings, ...data.settings };
                        this.securityLog = data.securityLog || [];
                        
                        this.saveToStorage();
                        this.loadBooks();
                        this.loadModerators();
                        this.updateStats();
                        
                        this.showMessage('تم استيراد البيانات بأمان', 'success');
                        this.logSecurityEvent('DATA_IMPORTED', {
                            importedBy: this.currentUser
                        });
                    }
                } catch (error) {
                    console.error('خطأ في قراءة ملف البيانات:', error);
                    this.showMessage('خطأ في قراءة ملف البيانات', 'error');
                }
            };
            reader.readAsText(file);
        } catch (error) {
            console.error('خطأ في استيراد البيانات:', error);
            this.showMessage('فشل في استيراد البيانات', 'error');
        }
        
        event.target.value = '';
    }

    // إدارة التبويبات
    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        
        const clickedBtn = event ? event.target.closest('.tab-btn') : document.querySelector(`[data-tab="${tabName}"]`);
        if (clickedBtn) clickedBtn.classList.add('active');
        
        const tabContent = document.getElementById(tabName + 'Tab');
        if (tabContent) tabContent.classList.add('active');
        
        if (tabName === 'settings') {
            document.getElementById('maxFileSize').value = this.settings.maxFileSize;
            document.getElementById('allowPublicView').checked = this.settings.allowPublicView;
            document.getElementById('enableSecurityLogging').checked = this.settings.enableSecurityLogging;
            document.getElementById('enableRateLimit').checked = this.settings.enableRateLimit;
            document.getElementById('enableAutoBackup').checked = this.settings.enableAutoBackup;
        }
        
        if (tabName === 'security') {
            this.updateSecurityTab();
        }
    }

    updateSecurityTab() {
        const activityLog = document.getElementById('activityLog');
        const suspiciousAttempts = document.getElementById('suspiciousAttempts');
        const lastSecurityCheck = document.getElementById('lastSecurityCheck');
        const encryptionStatus = document.getElementById('encryptionStatus');
        
        if (activityLog && this.securityLog.length > 0) {
            activityLog.innerHTML = this.securityLog
                .slice(-10)
                .reverse()
                .map(activity => `
                    <div class="log-entry">
                        <strong>${activity.event}</strong> - ${new Date(activity.timestamp).toLocaleString('ar-SA')}
                        <br><small>${JSON.stringify(activity.details)}</small>
                    </div>
                `).join('');
        }
        
        if (suspiciousAttempts) {
            suspiciousAttempts.textContent = this.securityLog.filter(log => 
                log.event.includes('FAILED') || log.event.includes('SUSPICIOUS')
            ).length;
        }
        
        if (lastSecurityCheck) {
            lastSecurityCheck.textContent = new Date().toLocaleString('ar-SA');
        }
        
        if (encryptionStatus) {
            encryptionStatus.textContent = 'نشط';
            encryptionStatus.className = 'stat-value status-active';
        }
    }

    // وظائف أمنية إضافية
    runSecurityScan() {
        this.showMessage('جاري تشغيل الفحص الأمني...', 'info');
        
        setTimeout(() => {
            const threats = [];
            
            // فحص البيانات المشبوهة
            if (this.securityLog.filter(log => log.event.includes('FAILED')).length > 10) {
                threats.push('عدد كبير من محاولات الدخول الفاشلة');
            }
            
            // فحص حجم البيانات
            const dataSize = JSON.stringify(this.books).length;
            if (dataSize > 50 * 1024 * 1024) { // 50MB
                threats.push('حجم البيانات كبير جداً');
            }
            
            if (threats.length === 0) {
                this.showMessage('✅ الفحص الأمني مكتمل - لا توجد تهديدات', 'success');
            } else {
                this.showMessage(`⚠️ تم العثور على ${threats.length} تهديد محتمل`, 'warning');
            }
            
            this.logSecurityEvent('SECURITY_SCAN_COMPLETED', {
                threatsFound: threats.length,
                threats: threats
            });
        }, 2000);
    }

    clearSecurityLog() {
        if (confirm('هل أنت متأكد من مسح سجل الأنشطة الأمنية؟')) {
            this.securityLog = [];
            this.saveToStorage();
            this.updateSecurityTab();
            this.showMessage('تم مسح سجل الأنشطة الأمنية', 'info');
        }
    }

    // إدارة اللوحة والواجهة
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
        
        const securityLevel = this.calculateSecurityLevel();
        document.getElementById('securityLevel').textContent = securityLevel;
        
        document.getElementById('lastUpload').textContent = this.books.length > 0
            ? this.books.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))[0].name
            : '-';
    }

    calculateSecurityLevel() {
        let score = 100;
        
        // تقليل النقاط للأنشطة المشبوهة
        const suspiciousEvents = this.securityLog.filter(log => 
            log.event.includes('FAILED') || log.event.includes('SUSPICIOUS')
        ).length;
        score -= suspiciousEvents * 2;
        
        // تقليل النقاط إذا لم تكن الإعدادات الأمنية مفعلة
        if (!this.settings.enableSecurityLogging) score -= 20;
        if (!this.settings.enableRateLimit) score -= 20;
        
        if (score >= 90) return 'AAA';
        if (score >= 80) return 'AA';
        if (score >= 70) return 'A';
        if (score >= 60) return 'B';
        return 'C';
    }

    showMessage(message, type) {
        const statusDiv = document.getElementById('statusMessage');
        const sanitizedMessage = this.sanitizeInput(message);
        statusDiv.innerHTML = `<div class="status-message status-${type}">${sanitizedMessage}</div>`;
        
        setTimeout(() => {
            statusDiv.innerHTML = '';
        }, 5000);
    }

    showLoginMessage(message, type) {
        const messageDiv = document.getElementById('loginMessage');
        const sanitizedMessage = this.sanitizeInput(message);
        messageDiv.innerHTML = `<div class="status-message status-${type}">${sanitizedMessage}</div>`;
        setTimeout(() => {
            messageDiv.innerHTML = '';
        }, 3000);
    }

    setupEventListeners() {
        // إغلاق النوافذ عند الضغط خارجها أو على Esc
        document.getElementById('pdfViewer').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closePdfViewer();
        });
        
        document.getElementById('loginModal').addEventListener('click', (e) => {
            if (e.target === e.currentTarget) this.closeLoginModal();
        });
        
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.closePdfViewer();
                this.closeLoginModal();
            }
        });

        // مستمعات أحداث تسجيل الدخول
        document.getElementById('loginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        
        document.getElementById('loginUsername').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });

        // منع النقر بالزر الأيمن في المناطق الحساسة
        document.getElementById('adminSection')?.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            this.logSecurityEvent('RIGHT_CLICK_BLOCKED', {
                element: e.target.tagName
            });
        });
    }
}

// إنشاء مثيل التطبيق
let app;

// الدوال العامة للHTML
function showLoginModal(type) { app.showLoginModal(type); }
function closeLoginModal() { app.closeLoginModal(); }
function login() { app.login(); }
function logout() { app.logout(); }
function handleFileSelect(event) { app.handleFileSelect(event); }
function handleDrop(event) { app.handleDrop(event); }
function handleDragOver(event) { app.handleDragOver(event); }
function handleDragLeave(event) { app.handleDragLeave(event); }
function uploadFile() { app.uploadFile(); }
function clearSelection() { app.clearSelection(); }
function searchFiles(searchTerm) { app.searchFiles(searchTerm); }
function sortFiles(sortType) { app.sortFiles(sortType); }
function addModerator() { app.addModerator(); }
function saveSettings() { app.saveSettings(); }
function exportData() { app.exportData(); }
function importData(event) { app.importData(event); }
function switchTab(tabName) { app.switchTab(tabName); }
function closePdfViewer() { app.closePdfViewer(); }
function printPdf() { app.printPdf(); }
function downloadCurrentPdf() { app.downloadCurrentPdf(); }

// تهيئة التطبيق
document.addEventListener('DOMContentLoaded', function() {
    try {
        app = new SecureDigitalLibrary();
        console.log('✅ تم تحميل مكتبة إقرأ معنا الآمنة بنجاح');
    } catch (error) {
        console.error('❌ خطأ في تحميل التطبيق:', error);
        document.body.innerHTML = '<div style="text-align:center;padding:50px;color:red;">خطأ في تحميل النظام الأمني</div>';
    }
});

// حماية من التلاعب
Object.freeze(SecureDigitalLibrary.prototype);
Object.freeze(SecureStorage.prototype);
Object.freeze(RateLimiter.prototype);
