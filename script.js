// إعدادات Google Drive API
const API_KEY = 'AIzaSyAlzkca99-POCd7oKYFV1dPmd6Tv5qxYbI';
const CLIENT_ID = '112937826203-drj4j9pv73vf9bpr882kdfbipg4rjk2k.apps.googleusercontent.com';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';

// متغيرات عامة
let gapi;
let isSignedIn = false;
let currentBooks = [];
let filteredBooks = [];
let currentFilter = 'all';
let totalDownloads = parseInt(localStorage.getItem('totalDownloads') || '0');
let currentPdfUrl = '';

// عناصر DOM
const loadingOverlay = document.getElementById('loadingOverlay');
const authBtn = document.getElementById('authBtn');
const adminPanel = document.getElementById('adminPanel');
const searchToggle = document.getElementById('searchToggle');
const searchContainer = document.getElementById('searchContainer');
const searchInput = document.getElementById('searchInput');
const searchBtn = document.getElementById('searchBtn');
const pdfFile = document.getElementById('pdfFile');
const uploadProgress = document.getElementById('uploadProgress');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const booksGrid = document.getElementById('booksGrid');
const emptyState = document.getElementById('emptyState');
const totalBooksSpan = document.getElementById('totalBooks');
const totalDownloadsSpan = document.getElementById('totalDownloads');
const pdfModal = document.getElementById('pdfModal');
const pdfTitle = document.getElementById('pdfTitle');
const pdfFrame = document.getElementById('pdfFrame');
const downloadPdf = document.getElementById('downloadPdf');
const closePdf = document.getElementById('closePdf');
const confirmModal = document.getElementById('confirmModal');
const confirmDelete = document.getElementById('confirmDelete');
const cancelDelete = document.getElementById('cancelDelete');

// متغيرات للحذف
let bookToDelete = null;

// تحميل Google API
function loadGoogleAPI() {
    return new Promise((resolve, reject) => {
        if (typeof gapi !== 'undefined') {
            gapi.load('client:auth2', async () => {
                try {
                    await gapi.client.init({
                        apiKey: API_KEY,
                        clientId: CLIENT_ID,
                        discoveryDocs: [DISCOVERY_DOC],
                        scope: SCOPES
                    });
                    
                    const authInstance = gapi.auth2.getAuthInstance();
                    if (authInstance) {
                        isSignedIn = authInstance.isSignedIn.get();
                        updateAuthUI();
                        authInstance.isSignedIn.listen(updateAuthUI);
                        resolve();
                    } else {
                        reject(new Error('فشل في تهيئة المصادقة'));
                    }
                } catch (error) {
                    console.error('❌ خطأ في تهيئة Google API:', error);
                    showNotification('خطأ في الاتصال بـ Google Drive', 'error');
                    reject(error);
                }
            });
        } else {
            reject(new Error('Google API غير متوفر'));
        }
    });
}

// تهيئة التطبيق
async function initializeApp() {
    console.log('🚀 تهيئة مكتبة إقرأ معنا...');
    
    updateDownloadsCount();
    
    try {
        await loadGoogleAPI();
        console.log('✅ تم تحميل Google API بنجاح');
    } catch (error) {
        console.error('❌ فشل تحميل Google API:', error);
        showNotification('تعذر الاتصال بخدمة Google Drive', 'warning');
    }
    
    setupEventListeners();
    await loadBooks();
    hideLoading();
    console.log('✅ تم تهيئة المكتبة بنجاح!');
}

document.addEventListener('DOMContentLoaded', initializeApp);

// إعداد المستمعين
function setupEventListeners() {
    if (authBtn) authBtn.addEventListener('click', handleAuth);
    if (searchToggle) searchToggle.addEventListener('click', toggleSearch);
    if (searchBtn) searchBtn.addEventListener('click', performSearch);
    
    if (searchInput) {
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') performSearch();
        });
        searchInput.addEventListener('input', debounce(performSearch, 300));
    }
    
    if (pdfFile) pdfFile.addEventListener('change', handleFileUpload);
    
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.addEventListener('click', (e) => {
            setActiveFilter(e.target.dataset.filter);
        });
    });
    
    if (closePdf) closePdf.addEventListener('click', closePdfModal);
    if (downloadPdf) downloadPdf.addEventListener('click', downloadCurrentPdf);
    if (confirmDelete) confirmDelete.addEventListener('click', performDelete);
    if (cancelDelete) cancelDelete.addEventListener('click', closeConfirmModal);
    
    if (pdfModal) {
        pdfModal.addEventListener('click', (e) => {
            if (e.target === pdfModal) closePdfModal();
        });
    }
    
    if (confirmModal) {
        confirmModal.addEventListener('click', (e) => {
            if (e.target === confirmModal) closeConfirmModal();
        });
    }
    
    // اختصارات لوحة المفاتيح
    document.addEventListener('keydown', handleKeyboardShortcuts);
}

// إدارة المصادقة
async function handleAuth() {
    try {
        if (typeof gapi === 'undefined' || !gapi.auth2) {
            showNotification('خدمة Google غير متاحة حالياً', 'error');
            return;
        }
        
        const authInstance = gapi.auth2.getAuthInstance();
        if (!authInstance) {
            showNotification('خطأ في خدمة المصادقة', 'error');
            return;
        }
        
        if (isSignedIn) {
            await authInstance.signOut();
            showNotification('تم تسجيل الخروج بنجاح', 'success');
        } else {
            await authInstance.signIn();
            showNotification('تم تسجيل الدخول بنجاح', 'success');
        }
    } catch (error) {
        console.error('❌ خطأ في المصادقة:', error);
        showNotification('خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى', 'error');
    }
}

// تحديث واجهة المصادقة
function updateAuthUI() {
    if (!authBtn) return;
    
    try {
        const authInstance = gapi.auth2.getAuthInstance();
        isSignedIn = authInstance.isSignedIn.get();
        
        if (isSignedIn) {
            const user = authInstance.currentUser.get();
            const profile = user.getBasicProfile();
            
            authBtn.innerHTML = `
                <i class="fas fa-user-circle"></i>
                <span>${profile.getName()}</span>
            `;
            authBtn.title = 'تسجيل الخروج';
            if (adminPanel) adminPanel.style.display = 'block';
        } else {
            authBtn.innerHTML = `
                <i class="fas fa-sign-in-alt"></i>
                <span>تسجيل الدخول</span>
            `;
            authBtn.title = 'تسجيل الدخول';
            if (adminPanel) adminPanel.style.display = 'none';
        }
    } catch (error) {
        console.error('❌ خطأ في تحديث واجهة المصادقة:', error);
    }
}

// تبديل البحث
function toggleSearch() {
    if (!searchContainer) return;
    
    searchContainer.classList.toggle('active');
    if (searchContainer.classList.contains('active')) {
        if (searchInput) searchInput.focus();
    } else {
        if (searchInput) searchInput.value = '';
        performSearch();
    }
}

// البحث
function performSearch() {
    if (!searchInput) return;
    
    const query = searchInput.value.trim().toLowerCase();
    
    if (query === '') {
        filteredBooks = [...currentBooks];
    } else {
        filteredBooks = currentBooks.filter(book => 
            book.name.toLowerCase().includes(query) ||
            (book.description && book.description.toLowerCase().includes(query))
        );
    }
    
    renderBooks();
}

// معالجة رفع الملفات
async function handleFileUpload(event) {
    const files = Array.from(event.target.files);
    
    if (files.length === 0) return;
    
    if (!isSignedIn) {
        showNotification('يجب تسجيل الدخول أولاً', 'warning');
        return;
    }
    
    // فحص أن جميع الملفات PDF
    const invalidFiles = files.filter(file => file.type !== 'application/pdf');
    if (invalidFiles.length > 0) {
        showNotification('يرجى اختيار ملفات PDF فقط', 'error');
        return;
    }
    
    // فحص حجم الملفات (100MB لكل ملف)
    const largeFiles = files.filter(file => file.size > 100 * 1024 * 1024);
    if (largeFiles.length > 0) {
        showNotification('حجم الملف يجب أن يكون أقل من 100 ميجابايت', 'error');
        return;
    }
    
    // رفع الملفات
    for (let i = 0; i < files.length; i++) {
        await uploadFile(files[i], i + 1, files.length);
    }
    
    // إعادة تحميل الكتب
    await loadBooks();
    
    // مسح الملفات المحددة
    event.target.value = '';
}

// رفع ملف واحد
async function uploadFile(file, current, total) {
    try {
        showUploadProgress(true);
        updateUploadProgress(0, `رفع ${current} من ${total}: ${file.name}`);
        
        const metadata = {
            name: file.name,
            description: `كتاب PDF - مكتبة إقرأ معنا - ${new Date().toLocaleDateString('ar-SA')}`
        };
        
        // رفع الملف باستخدام multipart
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        form.append('file', file);
        
        const xhr = new XMLHttpRequest();
        
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100);
                updateUploadProgress(progress, `جاري الرفع... ${progress}%`);
            }
        });
        
        await new Promise((resolve, reject) => {
            xhr.onload = () => {
                if (xhr.status === 200) {
                    updateUploadProgress(100, `تم رفع: ${file.name}`);
                    showNotification(`تم رفع ${file.name} بنجاح`, 'success');
                    resolve();
                } else {
                    reject(new Error(`خطأ HTTP: ${xhr.status}`));
                }
            };
            
            xhr.onerror = () => reject(new Error('خطأ في الشبكة'));
            
            const accessToken = gapi.auth2.getAuthInstance().currentUser.get().getAuthResponse().access_token;
            xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
            xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
            xhr.send(form);
        });
        
    } catch (error) {
        console.error('❌ خطأ في رفع الملف:', error);
        showNotification(`خطأ في رفع ${file.name}`, 'error');
    }
}

// إظهار/إخفاء تقدم الرفع
function showUploadProgress(show) {
    if (!uploadProgress) return;
    
    uploadProgress.style.display = show ? 'block' : 'none';
    if (!show) {
        updateUploadProgress(0, '');
    }
}

// تحديث تقدم الرفع
function updateUploadProgress(progress, text) {
    if (progressFill) progressFill.style.width = `${progress}%`;
    if (progressText) progressText.textContent = text;
    
    if (progress === 100 && progressFill) {
        progressFill.classList.add('animate');
        setTimeout(() => {
            progressFill.classList.remove('animate');
            showUploadProgress(false);
        }, 1000);
    }
}

// تحميل الكتب
async function loadBooks() {
    try {
        console.log('📚 تحميل الكتب...');
        
        if (!isSignedIn || typeof gapi === 'undefined' || !gapi.client || !gapi.client.drive) {
            console.log('المستخدم غير مسجل الدخول أو API غير متوفر');
            currentBooks = [];
            filteredBooks = [];
            renderBooks();
            updateStats();
            return;
        }
        
        const response = await gapi.client.drive.files.list({
            q: "mimeType='application/pdf' and trashed=false",
            fields: 'files(id,name,size,createdTime,description,webContentLink,webViewLink)',
            orderBy: 'createdTime desc',
            pageSize: 100
        });
        
        currentBooks = response.result.files.map(file => ({
            id: file.id,
            name: file.name.replace('.pdf', ''),
            size: formatFileSize(file.size),
            rawSize: parseInt(file.size) || 0,
            date: formatDate(file.createdTime),
            rawDate: new Date(file.createdTime),
            description: file.description || '',
            downloadUrl: file.webContentLink,
            viewUrl: `https://drive.google.com/file/d/${file.id}/preview`,
            directViewUrl: file.webViewLink
        }));
        
        applyCurrentFilter();
        updateStats();
        
        console.log(`✅ تم تحميل ${currentBooks.length} كتاب`);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل الكتب:', error);
        currentBooks = [];
        filteredBooks = [];
        renderBooks();
        updateStats();
        
        if (error.status === 401) {
            showNotification('انتهت صلاحية تسجيل الدخول', 'warning');
        } else {
            showNotification('خطأ في تحميل الكتب', 'error');
        }
    }
}

// تطبيق الفلتر الحالي
function applyCurrentFilter() {
    switch (currentFilter) {
        case 'recent':
            filteredBooks = [...currentBooks].sort((a, b) => b.rawDate - a.rawDate);
            break;
        case 'popular':
            filteredBooks = [...currentBooks].sort((a, b) => b.rawSize - a.rawSize);
            break;
        default:
            filteredBooks = [...currentBooks];
    }
    
    renderBooks();
}

// تعيين الفلتر النشط
function setActiveFilter(filter) {
    currentFilter = filter;
    
    document.querySelectorAll('.filter-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    
    const activeTab = document.querySelector(`[data-filter="${filter}"]`);
    if (activeTab) activeTab.classList.add('active');
    
    applyCurrentFilter();
}

// عرض الكتب
function renderBooks() {
    if (!booksGrid || !emptyState) return;
    
    if (filteredBooks.length === 0) {
        booksGrid.style.display = 'none';
        emptyState.style.display = 'block';
        emptyState.innerHTML = currentBooks.length === 0 ? `
            <i class="fas fa-book-open"></i>
            <h3>لا توجد كتب بعد</h3>
            <p>قم برفع أول كتاب لبدء مكتبتك الرقمية</p>
        ` : `
            <i class="fas fa-search"></i>
            <h3>لا توجد نتائج</h3>
            <p>جرب البحث بكلمات مختلفة</p>
        `;
    } else {
        booksGrid.style.display = 'grid';
        emptyState.style.display = 'none';
        
        booksGrid.innerHTML = filteredBooks.map(book => `
            <div class="book-card" data-book-id="${book.id}">
                ${isSignedIn ? `
                    <button class="delete-btn" onclick="confirmDeleteBook('${book.id}', '${escapeHtml(book.name)}')" title="حذف الكتاب">
                        <i class="fas fa-trash"></i>
                    </button>
                ` : ''}
                
                <div class="book-cover">
                    <i class="fas fa-book book-icon"></i>
                </div>
                
                <div class="book-info">
                    <h3 class="book-title" title="${escapeHtml(book.name)}">${truncateText(book.name, 50)}</h3>
                    
                    <div class="book-meta">
                        <span class="book-size">
                            <i class="fas fa-file-pdf"></i>
                            ${book.size}
                        </span>
                        <span class="book-date">
                            <i class="fas fa-calendar"></i>
                            ${book.date}
                        </span>
                    </div>
                    
                    <div class="book-actions">
                        <button class="btn btn-primary" onclick="viewBook('${book.id}', '${escapeHtml(book.name)}', '${book.viewUrl}')">
                            <i class="fas fa-eye"></i>
                            قراءة
                        </button>
                        <button class="btn btn-secondary" onclick="downloadBook('${book.downloadUrl}', '${escapeHtml(book.name)}')">
                            <i class="fas fa-download"></i>
                            تحميل
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    }
}

// عرض كتاب
function viewBook(bookId, bookName, viewUrl) {
    if (!pdfModal || !pdfTitle || !pdfFrame) return;
    
    pdfTitle.textContent = bookName;
    pdfFrame.src = viewUrl;
    pdfModal.classList.add('active');
    
    // تعيين رابط التحميل
    const book = currentBooks.find(b => b.id === bookId);
    if (book) {
        currentPdfUrl = book.downloadUrl;
    }
}

// تحميل كتاب حالي
function downloadCurrentPdf() {
    if (currentPdfUrl) {
        const book = currentBooks.find(b => b.downloadUrl === currentPdfUrl);
        if (book) {
            downloadBook(currentPdfUrl, book.name);
        }
    }
}

// تحميل كتاب
function downloadBook(downloadUrl, bookName) {
    totalDownloads++;
    localStorage.setItem('totalDownloads', totalDownloads.toString());
    updateDownloadsCount();
    
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${bookName}.pdf`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showNotification(`بدء تحميل: ${bookName}`, 'success');
}

// تأكيد حذف كتاب
function confirmDeleteBook(bookId, bookName) {
    bookToDelete = { id: bookId, name: bookName };
    if (confirmModal) confirmModal.classList.add('active');
}

// تنفيذ الحذف
async function performDelete() {
    if (!bookToDelete) return;
    
    try {
        closeConfirmModal();
        
        const bookCard = document.querySelector(`[data-book-id="${bookToDelete.id}"]`);
        if (bookCard) bookCard.classList.add('loading');
        
        await gapi.client.drive.files.delete({
            fileId: bookToDelete.id
        });
        
        showNotification(`تم حذف: ${bookToDelete.name}`, 'success');
        await loadBooks();
        
    } catch (error) {
        console.error('❌ خطأ في حذف الكتاب:', error);
        showNotification(`خطأ في حذف: ${bookToDelete.name}`, 'error');
        
        const bookCard = document.querySelector(`[data-book-id="${bookToDelete.id}"]`);
        if (bookCard) bookCard.classList.remove('loading');
    }
    
    bookToDelete = null;
}

// إغلاق عارض PDF
function closePdfModal() {
    if (!pdfModal || !pdfFrame) return;
    
    pdfModal.classList.remove('active');
    pdfFrame.src = '';
    currentPdfUrl = '';
}

// إغلاق نافذة التأكيد
function closeConfirmModal() {
    if (confirmModal) confirmModal.classList.remove('active');
    bookToDelete = null;
}

// تحديث الإحصائيات
function updateStats() {
    if (totalBooksSpan) totalBooksSpan.textContent = currentBooks.length;
    updateDownloadsCount();
}

// تحديث عداد التحميلات
function updateDownloadsCount() {
    if (totalDownloadsSpan) {
        totalDownloadsSpan.textContent = totalDownloads.toLocaleString('ar-SA');
    }
}

// إخفاء شاشة التحميل
function hideLoading() {
    if (!loadingOverlay) return;
    
    setTimeout(() => {
        loadingOverlay.style.opacity = '0';
        setTimeout(() => {
            loadingOverlay.style.display = 'none';
        }, 300);
    }, 1000);
}

// إظهار الإشعارات
function showNotification(message, type = 'info') {
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
        </div>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: ${getNotificationColor(type)};
        color: white;
        padding: 1rem 1.5rem;
        border-radius: 10px;
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        z-index: 10000;
        transform: translateX(400px);
        transition: transform 0.3s ease;
        max-width: 300px;
        font-family: var(--font-family);
        font-size: 0.9rem;
    `;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(400px)';
        setTimeout(() => {
            if (document.body.contains(notification)) {
                document.body.removeChild(notification);
            }
        }, 300);
    }, 4000);
}

// الحصول على أيقونة الإشعار
function getNotificationIcon(type) {
    switch (type) {
        case 'success': return 'check-circle';
        case 'error': return 'exclamation-circle';
        case 'warning': return 'exclamation-triangle';
        default: return 'info-circle';
    }
}

// الحصول على لون الإشعار
function getNotificationColor(type) {
    switch (type) {
        case 'success': return '#34a853';
        case 'error': return '#ea4335';
        case 'warning': return '#fbbc04';
        default: return '#1a73e8';
    }
}

// تنسيق حجم الملف
function formatFileSize(bytes) {
    if (!bytes || bytes === 0) return '0 بايت';
    
    const sizes = ['بايت', 'كيلوبايت', 'ميجابايت', 'جيجابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = (bytes / Math.pow(1024, i)).toFixed(1);
    
    return `${size} ${sizes[i]}`;
}

// تنسيق التاريخ
function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
}

// اختصار النص
function truncateText(text, maxLength) {
    if (!text || text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

// تأمين HTML
function escapeHtml(unsafe) {
    return unsafe
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// تأخير التنفيذ (للبحث)
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// اختصارات لوحة المفاتيح
function handleKeyboardShortcuts(e) {
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
    }
    
    if (e.key === 'Escape') {
        if (pdfModal && pdfModal.classList.contains('active')) {
            closePdfModal();
        } else if (confirmModal && confirmModal.classList.contains('active')) {
            closeConfirmModal();
        } else if (searchContainer && searchContainer.classList.contains('active')) {
            toggleSearch();
        }
    }
}

// معالجة الأخطاء العامة
window.addEventListener('error', (event) => {
    console.error('❌ خطأ في التطبيق:', event.error);
    showNotification('حدث خطأ غير متوقع', 'error');
});

window.addEventListener('unhandledrejection', (event) => {
    console.error('❌ خطأ في الشبكة:', event.reason);
    showNotification('خطأ في الاتصال بالخدمة', 'error');
});

// إعادة تحميل دورية للكتب (كل 5 دقائق)
setInterval(() => {
    if (isSignedIn) {
        loadBooks();
    }
}, 5 * 60 * 1000);

// تحسين الأداء
function lazyLoadImages() {
    const images = document.querySelectorAll('img[data-src]');
    const imageObserver = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const img = entry.target;
                img.src = img.dataset.src;
                img.removeAttribute('data-src');
                imageObserver.unobserve(img);
            }
        });
    });
    
    images.forEach(img => imageObserver.observe(img));
}

console.log('📚 مكتبة إقرأ معنا - script.js تم تحميله بنجاح!');
