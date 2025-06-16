// إعدادات عامة
const SITE_NAME = "إقرأ معنا";
const ADMIN_DEFAULT_PASSWORD = "admin123";

// الحالة العامة للتطبيق
class DigitalLibrary {
    constructor() {
        this.books = [];
        this.moderators = [];
        this.settings = {
            maxFileSize: 100, // MB
            adminPassword: this.encodePassword(ADMIN_DEFAULT_PASSWORD),
            allowPublicView: true
        };
        this.currentUser = null;
        this.userRole = null;
        this.selectedFile = null;
        this.filteredBooks = [];
        this.currentSort = 'name-asc';
        this.init();
    }

    // تهيئة التطبيق
    init() {
        this.loadFromStorage();
        this.updateStats();
        this.loadBooks();
        this.loadModerators();
        this.setupEventListeners();
        this.hideAdminPanel();
    }

    // تشفير كلمة المرور
    encodePassword(password) {
        return btoa(password);
    }
    decodePassword(encoded) {
        try { return atob(encoded); } catch { return encoded; }
    }

    // توليد معرف فريد
    generateId() {
        return Date.now() + Math.random().toString(36).substr(2, 9);
    }

    // تنسيقات
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

    // التخزين المحلي
    saveToStorage() {
        try {
            const data = {
                books: this.books,
                moderators: this.moderators,
                settings: this.settings,
                version: '2.0'
            };
            localStorage.setItem('digitalLibraryData', JSON.stringify(data));
            return true;
        } catch (e) {
            this.showMessage('خطأ في حفظ البيانات: ' + e.message, 'error');
            return false;
        }
    }
    loadFromStorage() {
        try {
            const data = localStorage.getItem('digitalLibraryData');
            if (data) {
                const parsed = JSON.parse(data);
                this.books = parsed.books || [];
                this.moderators = parsed.moderators || [];
                this.settings = { ...this.settings, ...parsed.settings };
            }
        } catch {
            this.showMessage('خطأ في تحميل البيانات المحفوظة', 'warning');
        }
    }

    // --- المصادقة ---
    showLoginModal(type) {
        const modal = document.getElementById('loginModal');
        const title = document.getElementById('loginTitle');
        const usernameGroup = document.getElementById('usernameGroup');
        if (type === 'admin') {
            title.textContent = 'دخول الأدمن';
            usernameGroup.classList.add('hidden');
        } else {
            title.textContent = 'دخول المشرفين';
            usernameGroup.classList.remove('hidden');
        }
        modal.classList.add('active');
        modal.dataset.type = type;
        document.getElementById('loginUsername').value = '';
        document.getElementById('loginPassword').value = '';
        document.getElementById('loginMessage').innerHTML = '';
    }
    closeLoginModal() {
        document.getElementById('loginModal').classList.remove('active');
    }
    login() {
        const type = document.getElementById('loginModal').dataset.type;
        const username = document.getElementById('loginUsername').value.trim();
        const password = document.getElementById('loginPassword').value;
        if (!password) {
            this.showLoginMessage('يرجى إدخال كلمة المرور', 'error');
            return;
        }
        if (type === 'admin') {
            if (this.decodePassword(this.settings.adminPassword) === password) {
                this.currentUser = 'admin';
                this.userRole = 'admin';
                this.showAdminPanel();
                this.closeLoginModal();
                this.showMessage('مرحباً بك أيها الأدمن!', 'success');
            } else {
                this.showLoginMessage('كلمة مرور خاطئة', 'error');
            }
        } else {
            if (!username) {
                this.showLoginMessage('يرجى إدخال اسم المستخدم', 'error');
                return;
            }
            const moderator = this.moderators.find(m =>
                m.username === username && this.decodePassword(m.password) === password
            );
            if (moderator) {
                this.currentUser = username;
                this.userRole = 'moderator';
                moderator.lastLogin = new Date().toISOString();
                this.saveToStorage();
                this.showAdminPanel();
                this.closeLoginModal();
                this.showMessage(`مرحباً بك ${username}!`, 'success');
                this.loadModerators();
            } else {
                this.showLoginMessage('اسم المستخدم أو كلمة المرور خاطئة', 'error');
            }
        }
    }
    logout() {
        this.currentUser = null;
        this.userRole = null;
        this.hideAdminPanel();
        this.showMessage('تم تسجيل الخروج بنجاح', 'info');
    }
    showAdminPanel() {
        document.getElementById('adminSection').classList.add('active');
        document.getElementById('logoutBtn').style.display = 'inline-flex';
        if (this.userRole === 'admin') {
            document.getElementById('moderatorsTabBtn').style.display = 'inline-flex';
            document.getElementById('settingsTabBtn').style.display = 'inline-flex';
        } else {
            document.getElementById('moderatorsTabBtn').style.display = 'none';
            document.getElementById('settingsTabBtn').style.display = 'none';
        }
        document.querySelectorAll('.auth-btn:not(.logout-btn)').forEach(btn => btn.style.display = 'none');
    }
    hideAdminPanel() {
        document.getElementById('adminSection').classList.remove('active');
        document.getElementById('logoutBtn').style.display = 'none';
        document.querySelectorAll('.auth-btn:not(.logout-btn)').forEach(btn => btn.style.display = 'inline-flex');
    }
    showLoginMessage(message, type) {
        const messageDiv = document.getElementById('loginMessage');
        messageDiv.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
        setTimeout(() => { messageDiv.innerHTML = ''; }, 3000);
    }

    // --- إدارة الكتب ---
    handleFileSelect(event) {
        const file = event.target.files[0];
        if (file && file.type === 'application/pdf') {
            this.handleFile(file);
        } else {
            this.showMessage('يرجى اختيار ملف PDF فقط', 'error');
        }
    }
    handleDrop(event) {
        event.preventDefault();
        event.currentTarget.classList.remove('dragover');
        const files = event.dataTransfer.files;
        if (files.length > 0 && files[0].type === 'application/pdf') {
            this.handleFile(files[0]);
        } else {
            this.showMessage('يرجى اختيار ملف PDF فقط', 'error');
        }
    }
    handleDragOver(event) {
        event.preventDefault();
        event.currentTarget.classList.add('dragover');
    }
    handleDragLeave(event) {
        event.currentTarget.classList.remove('dragover');
    }
    handleFile(file) {
        const maxSize = this.settings.maxFileSize * 1024 * 1024;
        if (file.size > maxSize) {
            this.showMessage(`حجم الملف كبير جداً. الحد الأقصى: ${this.settings.maxFileSize} ميجابايت`, 'error');
            return;
        }
        this.selectedFile = file;
        document.getElementById('fileNameGroup').classList.remove('hidden');
        document.getElementById('fileNameInput').value = file.name.replace('.pdf', '');
        document.getElementById('uploadBtn').disabled = false;
        this.showMessage(`تم اختيار الملف: ${file.name} (${this.formatFileSize(file.size)})`, 'success');
    }
    uploadFile() {
        if (!this.selectedFile) {
            this.showMessage('يرجى اختيار ملف أولاً', 'error');
            return;
        }
        const fileName = document.getElementById('fileNameInput').value.trim() ||
            this.selectedFile.name.replace('.pdf', '');
        if (this.books.some(f => f.name.toLowerCase() === fileName.toLowerCase())) {
            this.showMessage('يوجد كتاب بنفس الاسم مسبقاً', 'error');
            return;
        }
        // شريط التقدم
        const progressContainer = document.getElementById('progressContainer');
        const progressBar = document.getElementById('progressBar');
        progressContainer.style.display = 'block';
        progressBar.style.width = '0%';
        progressBar.textContent = '0%';

        const fileReader = new FileReader();
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
                this.showMessage('تم رفع الكتاب بنجاح!', 'success');
                this.clearSelection();
                this.loadBooks();
                this.updateStats();
            } else {
                this.books.pop();
                this.showMessage('فشل في حفظ الكتاب', 'error');
            }
            progressContainer.style.display = 'none';
        };
        fileReader.onerror = () => {
            this.showMessage('خطأ في قراءة الملف', 'error');
            progressContainer.style.display = 'none';
        };
        fileReader.readAsDataURL(this.selectedFile);
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
            this.showMessage('تم حذف الكتاب بنجاح', 'success');
        }
    }
    editBookName(bookId) {
        const book = this.books.find(f => f.id === bookId);
        if (!book) return;
        const newName = prompt('اسم الكتاب الجديد:', book.name);
        if (newName && newName.trim() && newName.trim() !== book.name) {
            const trimmedName = newName.trim();
            if (this.books.some(f => f.id !== bookId && f.name.toLowerCase() === trimmedName.toLowerCase())) {
                this.showMessage('يوجد كتاب بنفس الاسم مسبقاً', 'error');
                return;
            }
            book.name = trimmedName;
            this.saveToStorage();
            this.loadBooks();
            this.showMessage('تم تعديل اسم الكتاب بنجاح', 'success');
        }
    }
    downloadBook(bookId) {
        const book = this.books.find(f => f.id === bookId);
        if (!book) return;
        const link = document.createElement('a');
        link.href = book.data;
        link.download = book.name + '.pdf';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
    viewPdf(bookId) {
        const book = this.books.find(f => f.id === bookId);
        if (!book) return;
        document.getElementById('pdfTitle').textContent = book.name;
        document.getElementById('pdfFrame').src = book.data;
        document.getElementById('pdfViewer').classList.add('active');
        document.getElementById('pdfViewer').dataset.currentBookId = bookId;
    }
    closePdfViewer() {
        document.getElementById('pdfViewer').classList.remove('active');
        document.getElementById('pdfFrame').src = '';
        delete document.getElementById('pdfViewer').dataset.currentBookId;
    }
    printPdf() {
        const frame = document.getElementById('pdfFrame');
        if (frame.src) {
            frame.contentWindow.print();
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
        const term = searchTerm.toLowerCase().trim();
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
                case 'name': valueA = a.name.toLowerCase(); valueB = b.name.toLowerCase(); break;
                case 'date': valueA = new Date(a.uploadDate); valueB = new Date(b.uploadDate); break;
                case 'size': valueA = a.size; valueB = b.size; break;
                default: return 0;
            }
            if (direction === 'asc') return valueA > valueB ? 1 : valueA < valueB ? -1 : 0;
            else return valueA < valueB ? 1 : valueA > valueB ? -1 : 0;
        });
    }
    loadBooks() {
        this.filteredBooks = [...this.books];
        this.applySorting();
        this.renderBooks();
    }
    renderBooks() {
        const grid = document.getElementById('filesGrid');
        if (this.filteredBooks.length === 0) {
            grid.innerHTML = `<div class="no-files"><i class="fas fa-book-open" style="font-size: 3rem; margin-bottom: 20px; color: var(--primary-color);"></i><br>لا توجد كتب متاحة حالياً</div>`;
            return;
        }
        grid.innerHTML = this.filteredBooks.map(book => {
            const canEdit = this.userRole === 'admin' || this.userRole === 'moderator';
            return `
                <div class="file-card">
                    <div class="file-icon">📄</div>
                    <div class="file-name">${book.name}</div>
                    <div class="file-info">
                        <div>${book.sizeFormatted}</div>
                        <div>${this.formatDate(book.uploadDate)}</div>
                        <div>رفع بواسطة: ${book.uploadedBy}</div>
                    </div>
                    <div class="file-actions">
                        <button class="action-btn view-btn" onclick="app.viewPdf('${book.id}')" title="عرض">
                            <i class="fas fa-eye"></i> عرض
                        </button>
                        <button class="action-btn download-btn" onclick="app.downloadBook('${book.id}')" title="تحميل">
                            <i class="fas fa-download"></i> تحميل
                        </button>
                        ${canEdit ? `
                            <button class="action-btn edit-btn" onclick="app.editBookName('${book.id}')" title="تعديل الاسم">
                                <i class="fas fa-edit"></i> تعديل
                            </button>
                            <button class="action-btn delete-btn" onclick="app.deleteBook('${book.id}')" title="حذف">
                                <i class="fas fa-trash"></i> حذف
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    }

    // --- إدارة المشرفين ---
    addModerator() {
        const username = document.getElementById('newModUsername').value.trim();
        const password = document.getElementById('newModPassword').value;
        if (!username || !password) {
            this.showMessage('يرجى إدخال اسم المستخدم وكلمة المرور', 'error');
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
        this.showMessage('تم إضافة المشرف بنجاح', 'success');
    }
    deleteModerator(modId) {
        const moderator = this.moderators.find(m => m.id === modId);
        if (!moderator) return;
        if (confirm(`هل أنت متأكد من حذف المشرف "${moderator.username}"؟`)) {
            this.moderators = this.moderators.filter(m => m.id !== modId);
            this.saveToStorage();
            this.loadModerators();
            this.updateStats();
            this.showMessage('تم حذف المشرف بنجاح', 'success');
        }
    }
    loadModerators() {
        const container = document.getElementById('moderatorsList');
        if (this.moderators.length === 0) {
            container.innerHTML = '<div class="no-files">لا يوجد مشرفون مسجلون في النظام</div>';
            return;
        }
        container.innerHTML = `
            <table style="width:100%; border-collapse:collapse; background:var(--bg-primary); border-radius:12px; overflow:hidden;">
                <thead>
                    <tr style="background:var(--bg-accent); color:var(--primary-color);">
                        <th style="padding:10px;">اسم المستخدم</th>
                        <th style="padding:10px;">تاريخ الإضافة</th>
                        <th style="padding:10px;">آخر دخول</th>
                        <th style="padding:10px;">الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    ${this.moderators.map(mod => `
                        <tr>
                            <td style="padding:8px;">${mod.username}</td>
                            <td style="padding:8px;">${this.formatDate(mod.createdDate)}</td>
                            <td style="padding:8px;">${mod.lastLogin ? this.formatDate(mod.lastLogin) : 'لم يسجل دخول بعد'}</td>
                            <td style="padding:8px;">
                                <button class="action-btn delete-btn" onclick="app.deleteModerator('${mod.id}')">
                                    <i class="fas fa-trash"></i> حذف
                                </button>
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        `;
    }

    // --- الإعدادات ---
    saveSettings() {
        const maxFileSize = parseInt(document.getElementById('maxFileSize').value);
        const newPassword = document.getElementById('newAdminPassword').value;
        const allowPublicView = document.getElementById('allowPublicView').checked;
        if (maxFileSize < 1 || maxFileSize > 500) {
            this.showMessage('الحد الأقصى لحجم الملف يجب أن يكون بين 1 و 500 ميجابايت', 'error');
            return;
        }
        this.settings.maxFileSize = maxFileSize;
        this.settings.allowPublicView = allowPublicView;
        if (newPassword.trim()) {
            this.settings.adminPassword = this.encodePassword(newPassword.trim());
            document.getElementById('newAdminPassword').value = '';
        }
        this.saveToStorage();
        this.showMessage('تم حفظ الإعدادات بنجاح', 'success');
    }

    // --- النسخ الاحتياطي ---
    exportData() {
        const data = {
            books: this.books,
            moderators: this.moderators,
            settings: this.settings,
            exportDate: new Date().toISOString(),
            version: '2.0'
        };
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `iqra-mana-backup-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        this.showMessage('تم تصدير البيانات بنجاح', 'success');
    }
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);
                if (confirm('هل أنت متأكد من استيراد البيانات؟ سيتم استبدال البيانات الحالية.')) {
                    this.books = data.books || [];
                    this.moderators = data.moderators || [];
                    this.settings = { ...this.settings, ...data.settings };
                    this.saveToStorage();
                    this.loadBooks();
                    this.loadModerators();
                    this.updateStats();
                    this.showMessage('تم استيراد البيانات بنجاح', 'success');
                }
            } catch {
                this.showMessage('خطأ في قراءة ملف البيانات', 'error');
            }
        };
        reader.readAsText(file);
        event.target.value = '';
    }

    // --- واجهة المستخدم ---
    switchTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.remove('active'));
        // تحديد الزر النشط
        let btn;
        if (event && event.target.classList.contains('tab-btn')) {
            btn = event.target;
        } else {
            btn = document.querySelector(`.tab-btn[onclick*="${tabName}"]`);
        }
        if (btn) btn.classList.add('active');
        document.getElementById(tabName + 'Tab').classList.add('active');
        if (tabName === 'settings') {
            document.getElementById('maxFileSize').value = this.settings.maxFileSize;
            document.getElementById('allowPublicView').checked = this.settings.allowPublicView;
        }
    }
    updateStats() {
        document.getElementById('totalBooks').textContent = this.books.length;
        const totalSize = this.books.reduce((sum, book) => sum + book.size, 0);
        document.getElementById('totalSize').textContent = this.formatFileSize(totalSize);
        document.getElementById('totalModerators').textContent = this.moderators.length;
        document.getElementById('lastUpload').textContent = this.books.length > 0
            ? this.books.sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate))[0].name
            : '-';
    }
    showMessage(message, type) {
        const statusDiv = document.getElementById('statusMessage');
        statusDiv.innerHTML = `<div class="status-message status-${type}">${message}</div>`;
        setTimeout(() => { statusDiv.innerHTML = ''; }, 5000);
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
        document.getElementById('loginPassword').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
        document.getElementById('loginUsername').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.login();
        });
    }
}

// --- ربط الدوال مع الواجهة ---
let app;
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
function switchTab(tabName, event) { app.switchTab(tabName, event); }
function closePdfViewer() { app.closePdfViewer(); }
function printPdf() { app.printPdf(); }
function downloadCurrentPdf() { app.downloadCurrentPdf(); }
function viewPdf(bookId) { app.viewPdf(bookId); }

// --- تهيئة التطبيق عند تحميل الصفحة ---
document.addEventListener('DOMContentLoaded', function() {
    app = new DigitalLibrary();
});

