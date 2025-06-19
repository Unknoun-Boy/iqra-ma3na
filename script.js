// إعدادات Google Drive API - المحدثة حسب بياناتك الجديدة
const API_KEY = 'AIzaSyDtb-wHM70VJFnnb_yPuCSFacscEFbAmbY';
const CLIENT_ID = '1033541660682-udi2rct0i74bq80mnqcugnb0bip79ajo.apps.googleusercontent.com';
const DISCOVERY_DOC = 'https://www.googleapis.com/discovery/v1/apis/drive/v3/rest';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';

// إعدادات خاصة بـ GitHub Pages
const GITHUB_DOMAIN = 'https://unknoun-boy.github.io/iqra-ma3na/';
const isGitHubPages = window.location.href.includes('unknoun-boy.github.io');

// متغيرات عامة
let gapi;
let isSignedIn = false;
let currentBooks = [];
let filteredBooks = [];
let currentFilter = 'all';
let totalDownloads = parseInt(localStorage.getItem('totalDownloads') || '0');
let currentPdfUrl = '';
let authInstance = null;

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

// تحميل Google API مع معالجة أخطاء محسنة
function loadGoogleAPI() {
    return new Promise((resolve, reject) => {
        console.log('🔄 بدء تحميل Google API...');
        console.log('🌐 النطاق الحالي:', window.location.origin);
        
        if (typeof gapi === 'undefined') {
            console.error('❌ مكتبة Google API غير محملة');
            showNotification('تعذر تحميل خدمات Google. تأكد من الاتصال بالإنترنت.', 'error');
            reject(new Error('Google API غير متوفر'));
            return;
        }

        console.log('✅ مكتبة Google API متوفرة');

        // تحميل المكونات المطلوبة مع timeout
        const loadTimeout = setTimeout(() => {
            console.error('❌ انتهت مهلة تحميل Google API');
            reject(new Error('انتهت مهلة تحميل Google API'));
        }, 20000);

        gapi.load('client:auth2', async () => {
            try {
                clearTimeout(loadTimeout);
                
                console.log('🔧 تهيئة Google Client...');
                
                await gapi.client.init({
                    apiKey: API_KEY,
                    clientId: CLIENT_ID,
                    discoveryDocs: [DISCOVERY_DOC],
                    scope: SCOPES
                });
                
                console.log('✅ تم تهيئة Google Client بنجاح');
                
                // التحقق من وجود auth2
                authInstance = gapi.auth2.getAuthInstance();
                if (!authInstance) {
                    throw new Error('فشل تهيئة مكون المصادقة');
                }
                
                console.log('✅ مكون المصادقة جاهز');
                
                isSignedIn = authInstance.isSignedIn.get();
                updateAuthUI();
                authInstance.isSignedIn.listen(updateAuthUI);
                
                resolve();
                
            } catch (error) {
                clearTimeout(loadTimeout);
                console.error('❌ خطأ في تهيئة Google API:', error);
                
                // رسائل خطأ مخصصة
                let errorMessage = 'خطأ في تهيئة خدمات Google';
                
                if (error.details) {
                    const details = error.details.toLowerCase();
                    if (details.includes('api key')) {
                        errorMessage = 'خطأ في مفتاح API. تحقق من الإعدادات.';
                    } else if (details.includes('client id') || details.includes('client_id')) {
                        errorMessage = 'خطأ في معرف العميل. تحقق من الإعدادات.';
                    } else if (details.includes('origin') || details.includes('unauthorized')) {
                        errorMessage = 'النطاق غير مصرح به في Google Cloud Console.';
                    }
                } else if (error.message) {
                    if (error.message.includes('unauthorized_client')) {
                        errorMessage = 'العميل غير مصرح. تحقق من إعدادات OAuth في Google Console.';
                    } else if (error.message.includes('invalid_client')) {
                        errorMessage = 'معرف العميل غير صحيح.';
                    }
                }
                
                showNotification(errorMessage, 'error');
                reject(error);
            }
        }, (error) => {
            clearTimeout(loadTimeout);
            console.error('❌ فشل تحميل مكونات Google API:', error);
            showNotification('فشل تحميل مكونات Google API', 'error');
            reject(error);
        });
    });
}

// تهيئة التطبيق مع إعادة المحاولة
async function initializeApp() {
    console.log('🚀 تهيئة مكتبة إقرأ معنا...');
    console.log('📊 معلومات البيئة:');
    console.log('  - النطاق:', window.location.origin);
    console.log('  - GitHub Pages:', isGitHubPages);
    console.log('  - Client ID:', CLIENT_ID.substring(0, 20) + '...');
    
    updateDownloadsCount();
    
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
        try {
            await loadGoogleAPI();
            console.log('✅ تم تحميل Google API بنجاح');
            break;
        } catch (error) {
            retryCount++;
            console.error(`❌ المحاولة ${retryCount} فشلت:`, error.message);
            
            if (retryCount < maxRetries) {
                showNotification(`إعادة المحاولة ${retryCount}/${maxRetries}...`, 'warning');
                await new Promise(resolve => setTimeout(resolve, 2000));
            } else {
                console.error('❌ فشل في جميع المحاولات');
                showNotification('تعذر الاتصال بخدمات Google. تحقق من الاتصال بالإنترنت والإعدادات.', 'error');
                addReloadButton();
            }
        }
    }
    
    setupEventListeners();
    await loadBooks();
    hideLoading();
    console.log('✅ تم تهيئة المكتبة بنجاح!');
}

// إضافة زر إعادة التحميل
function addReloadButton() {
    if (document.querySelector('.reload-btn')) return;
    
    const reloadBtn = document.createElement('button');
    reloadBtn.className = 'reload-btn';
    reloadBtn.innerHTML = '<i class="fas fa-refresh"></i> إعادة تحميل الخدمات';
    reloadBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        left: 20px;
        background: #ea4335;
        color: white;
        padding: 0.75rem 1rem;
        border: none;
        border-radius: 25px;
        cursor: pointer;
        z-index: 1000;
        font-family: var(--font-family);
        box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        font-size: 0.9rem;
    `;
    
    reloadBtn.onclick = async () => {
        reloadBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> جاري التحميل...';
        try {
            await initializeApp();
            reloadBtn.remove();
            showNotification('تم إعادة تحميل الخدمات بنجاح', 'success');
        } catch (error) {
            reloadBtn.innerHTML = '<i class="fas fa-refresh"></i> إعادة تحميل الخدمات';
            showNotification('فشل إعادة التحميل', 'error');
        }
    };
    
    document.body.appendChild(reloadBtn);
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

// إدارة المصادقة مع معالجة أخطاء محسنة
async function handleAuth() {
    try {
        if (!authInstance) {
            showNotification('خدمة المصادقة غير متاحة. جاري إعادة التحميل...', 'warning');
            await initializeApp();
            return;
        }
        
        if (isSignedIn) {
            await authInstance.signOut();
            showNotification('تم تسجيل الخروج بنجاح', 'success');
        } else {
            // تحسين عملية تسجيل الدخول
            const user = await authInstance.signIn({
                prompt: 'select_account'
            });
            
            if (user && user.isSignedIn()) {
                showNotification('تم تسجيل الدخول بنجاح', 'success');
                // إعادة تحميل الكتب بعد تسجيل الدخول
                setTimeout(() => loadBooks(), 1000);
            }
        }
    } catch (error) {
        console.error('❌ خطأ في المصادقة:', error);
        
        // معالجة أخطاء محددة
        if (error.error === 'popup_closed_by_user') {
            showNotification('تم إلغاء تسجيل الدخول', 'warning');
        } else if (error.error === 'access_denied') {
            showNotification('تم رفض الوصول. تحقق من الأذونات.', 'error');
        } else if (error.error === 'unauthorized_client') {
            showNotification('العميل غير مصرح. تحقق من إعدادات Google Console.', 'error');
        } else {
            showNotification('خطأ في تسجيل الدخول. يرجى المحاولة مرة أخرى', 'error');
        }
    }
}

// تحديث واجهة المصادقة
function updateAuthUI() {
    if (!authBtn) return;
    
    try {
        if (!authInstance) {
            console.warn('⚠️ authInstance غير متوفر');
            return;
        }
        
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
            
            console.log('✅ المستخدم مسجل الدخول:', profile.getEmail());
        } else {
            authBtn.innerHTML = `
                <i class="fas fa-sign-in-alt"></i>
                <span>تسجيل الدخول</span>
            `;
            authBtn.title = 'تسجيل الدخول';
            if (adminPanel) adminPanel.style.display = 'none';
            
            console.log('ℹ️ المستخدم غير مسجل الدخول');
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

// البحث المحسن
function performSearch() {
    if (!searchInput) return;
    
    const query = searchInput.value.trim().toLowerCase();
    
    if (query === '') {
        filteredBooks = [...currentBooks];
    } else {
        filteredBooks = currentBooks.filter(book => 
            book.name.toLowerCase().includes(query) ||
            (book.description && book.description.toLowerCase().includes(query)) ||
            (book.author && book.author.toLowerCase().includes(query))
        );
    }
    
    renderBooks();
    
    // حفظ تاريخ البحث
    if (query) {
        saveSearchToHistory(query);
    }
}

// حفظ تاريخ البحث
function saveSearchToHistory(query) {
    try {
        const searches = JSON.parse(localStorage.getItem('searchHistory') || '[]');
        if (!searches.includes(query)) {
            searches.unshift(query);
            if (searches.length > 10) searches.pop();
            localStorage.setItem('searchHistory', JSON.stringify(searches));
        }
    } catch (error) {
        console.warn('⚠️ خطأ في حفظ تاريخ البحث:', error);
    }
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

// رفع ملف واحد مع معالجة أخطاء محسنة
async function uploadFile(file, current, total) {
    try {
        showUploadProgress(true);
        updateUploadProgress(0, `رفع ${current} من ${total}: ${file.name}`);
        
        console.log(`📤 بدء رفع ملف: ${file.name} (${formatFileSize(file.size)})`);
        
        // إنشاء metadata للملف
        const metadata = {
            name: file.name,
            description: `كتاب PDF - مكتبة إقرأ معنا - ${new Date().toLocaleDateString('ar-SA')}`,
            parents: ['root'] // يمكنك تغيير هذا لمجلد معين
        };
        
        // رفع الملف باستخدام multipart
        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], {type: 'application/json'}));
        form.append('file', file);
        
        // الحصول على access token
        if (!authInstance || !authInstance.currentUser.get().isSignedIn()) {
            throw new Error('المستخدم غير مسجل الدخول');
        }
        
        const accessToken = authInstance.currentUser.get().getAuthResponse().access_token;
        
        if (!accessToken) {
            throw new Error('لا يمكن الحصول على رمز الوصول');
        }
        
        const xhr = new XMLHttpRequest();
        
        // تتبع تقدم الرفع
        xhr.upload.addEventListener('progress', (e) => {
            if (e.lengthComputable) {
                const progress = Math.round((e.loaded / e.total) * 100);
                updateUploadProgress(progress, `جاري الرفع... ${progress}%`);
            }
        });
        
        await new Promise((resolve, reject) => {
            xhr.onload = () => {
                if (xhr.status === 200) {
                    const response = JSON.parse(xhr.responseText);
                    console.log('✅ تم رفع الملف بنجاح:', response.name);
                    updateUploadProgress(100, `تم رفع: ${file.name}`);
                    showNotification(`تم رفع ${file.name} بنجاح`, 'success');
                    resolve(response);
                } else {
                    console.error('❌ خطأ HTTP:', xhr.status, xhr.responseText);
                    reject(new Error(`خطأ HTTP: ${xhr.status}`));
                }
            };
            
            xhr.onerror = () => {
                console.error('❌ خطأ في الشبكة');
                reject(new Error('خطأ في الشبكة'));
            };
            
            xhr.open('POST', 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart');
            xhr.setRequestHeader('Authorization', `Bearer ${accessToken}`);
            xhr.send(form);
        });
        
    } catch (error) {
        console.error('❌ خطأ في رفع الملف:', error);
        updateUploadProgress(0, 'فشل الرفع');
        
        let errorMessage = `خطأ في رفع ${file.name}`;
        if (error.message.includes('unauthorized') || error.message.includes('401')) {
            errorMessage = 'انتهت صلاحية تسجيل الدخول. يرجى تسجيل الدخول مرة أخرى.';
        } else if (error.message.includes('quota')) {
            errorMessage = 'تم تجاوز حد التخزين في Google Drive.';
        }
        
        showNotification(errorMessage, 'error');
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
            if (progressFill) progressFill.classList.remove('animate');
            showUploadProgress(false);
        }, 1000);
    }
}

// تحميل الكتب مع معالجة أخطاء محسنة
async function loadBooks() {
    try {
        console.log('📚 تحميل الكتب...');
        
        if (!isSignedIn || !authInstance) {
            console.log('ℹ️ المستخدم غير مسجل الدخول أو API غير متوفر');
            currentBooks = [];
            filteredBooks = [];
            renderBooks();
            updateStats();
            return;
        }
        
        // التحقق من صحة الاتصال
        if (!gapi.client || !gapi.client.drive) {
            throw new Error('Google Drive API غير متوفر');
        }
        
        console.log('🔍 البحث عن ملفات PDF...');
        
        const response = await gapi.client.drive.files.list({
            q: "mimeType='application/pdf' and trashed=false",
            fields: 'files(id,name,size,createdTime,modifiedTime,description,webContentLink,webViewLink,thumbnailLink)',
            orderBy: 'createdTime desc',
            pageSize: 100
        });
        
        console.log(`📊 تم العثور على ${response.result.files.length} ملف PDF`);
        
        currentBooks = response.result.files.map(file => {
            // استخراج اسم المؤلف من اسم الملف إن أمكن
            const fileName = file.name.replace('.pdf', '');
            const parts = fileName.split(' - ');
            const bookName = parts[0] || fileName;
            const author = parts[1] || 'غير محدد';
            
            return {
                id: file.id,
                name: bookName.trim(),
                author: author.trim(),
                size: formatFileSize(file.size),
                rawSize: parseInt(file.size) || 0,
                date: formatDate(file.createdTime),
                rawDate: new Date(file.createdTime),
                modifiedDate: formatDate(file.modifiedTime),
                description: file.description || `كتاب ${bookName}`,
                downloadUrl: file.webContentLink,
                viewUrl: `https://drive.google.com/file/d/${file.id}/preview`,
                directViewUrl: file.webViewLink,
                thumbnailUrl: file.thumbnailLink
            };
        });
        
        applyCurrentFilter();
        updateStats();
        
        console.log(`✅ تم تحميل ${currentBooks.length} كتاب بنجاح`);
        
    } catch (error) {
        console.error('❌ خطأ في تحميل الكتب:', error);
        currentBooks = [];
        filteredBooks = [];
        renderBooks();
        updateStats();
        
        let errorMessage = 'خطأ في تحميل الكتب';
        if (error.status === 401 || error.message.includes('unauthorized')) {
            errorMessage = 'انتهت صلاحية تسجيل الدخول';
            showNotification(errorMessage, 'warning');
        } else if (error.status === 403) {
            errorMessage = 'لا تملك صلاحية الوصول لـ Google Drive';
            showNotification(errorMessage, 'error');
        } else {
            showNotification(errorMessage, 'error');
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
            // ترتيب حسب حجم الملف (افتراض أن الملفات الأكبر أكثر شيوعاً)
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

// عرض الكتب المحسن
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
                    ${book.thumbnailUrl ? 
                        `<img src="${book.thumbnailUrl}" alt="${escapeHtml(book.name)}" loading="lazy">` :
                        `<i class="fas fa-book book-icon"></i>`
                    }
                </div>
                
                <div class="book-info">
                    <h3 class="book-title" title="${escapeHtml(book.name)}">${truncateText(book.name, 50)}</h3>
                    
                    ${book.author !== 'غير محدد' ? `
                        <p class="book-author" title="${escapeHtml(book.author)}">
                            <i class="fas fa-user"></i>
                            ${truncateText(book.author, 30)}
                        </p>
                    ` : ''}
                    
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
    
    console.log('👁️ فتح كتاب للقراءة:', bookName);
    
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
    console.log('📥 تحميل كتاب:', bookName);
    
    // زيادة عداد التحميلات
    totalDownloads++;
    localStorage.setItem('totalDownloads', totalDownloads.toString());
    updateDownloadsCount();
    
    // تحميل الملف
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = `${bookName}.pdf`;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
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
        
        console.log('🗑️ حذف كتاب:', bookToDelete.name);
        
        const bookCard = document.querySelector(`[data-book-id="${bookToDelete.id}"]`);
        if (bookCard) bookCard.classList.add('loading');
        
        await gapi.client.drive.files.delete({
            fileId: bookToDelete.id
        });
        
        console.log('✅ تم حذف الكتاب بنجاح');
        showNotification(`تم حذف: ${bookToDelete.name}`, 'success');
        await loadBooks();
        
    } catch (error) {
        console.error('❌ خطأ في حذف الكتاب:', error);
        
        let errorMessage = `خطأ في حذف: ${bookToDelete.name}`;
        if (error.status === 403) {
            errorMessage = 'لا تملك صلاحية حذف هذا الملف';
        } else if (error.status === 404) {
            errorMessage = 'الملف غير موجود';
        }
        
        showNotification(errorMessage, 'error');
        
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
    }, 1500);
}

// إظهار الإشعارات المحسن
function showNotification(message, type = 'info') {
    console.log(`🔔 إشعار (${type}):`, message);
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.innerHTML = `
        <div class="notification-content">
            <i class="fas fa-${getNotificationIcon(type)}"></i>
            <span>${message}</span>
            <button class="notification-close" onclick="this.parentElement.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
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
        max-width: 350px;
        font-family: var(--font-family);
        font-size: 0.9rem;
        direction: rtl;
    `;
    
    // ستايل زر الإغلاق
    const style = document.createElement('style');
    style.textContent = `
        .notification-close {
            background: none;
            border: none;
            color: white;
            margin-left: 10px;
            cursor: pointer;
            opacity: 0.7;
            transition: opacity 0.2s;
        }
        .notification-close:hover {
            opacity: 1;
        }
        .notification-content {
            display: flex;
            align-items: center;
            gap: 10px;
        }
    `;
    document.head.appendChild(style);
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.transform = 'translateX(0)';
    }, 100);
    
    // إخفاء تلقائي
    const autoHideTimeout = setTimeout(() => {
        if (document.body.contains(notification)) {
            notification.style.transform = 'translateX(400px)';
            setTimeout(() => {
                if (document.body.contains(notification)) {
                    document.body.removeChild(notification);
                }
            }, 300);
        }
    }, type === 'error' ? 8000 : 5000);
    
    // إلغاء الإخفاء التلقائي عند hover
    notification.addEventListener('mouseenter', () => clearTimeout(autoHideTimeout));
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
    if (!unsafe) return '';
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
    // Ctrl/Cmd + K للبحث
    if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        toggleSearch();
    }
    
    // Escape لإغلاق النوافذ
    if (e.key === 'Escape') {
        if (pdfModal && pdfModal.classList.contains('active')) {
            closePdfModal();
        } else if (confirmModal && confirmModal.classList.contains('active')) {
            closeConfirmModal();
        } else if (searchContainer && searchContainer.classList.contains('active')) {
            toggleSearch();
        }
    }
    
    // F5 لإعادة تحميل الكتب
    if (e.key === 'F5' && isSignedIn) {
        e.preventDefault();
        loadBooks();
        showNotification('تم إعادة تحميل الكتب', 'info');
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

// فحص الاتصال بالإنترنت
window.addEventListener('online', () => {
    showNotification('تم استعادة الاتصال بالإنترنت', 'success');
    if (isSignedIn) loadBooks();
});

window.addEventListener('offline', () => {
    showNotification('تم فقدان الاتصال بالإنترنت', 'warning');
});

// إعادة تحميل دورية للكتب (كل 5 دقائق)
setInterval(() => {
    if (isSignedIn && navigator.onLine) {
        console.log('🔄 إعادة تحميل دورية للكتب...');
        loadBooks();
    }
}, 5 * 60 * 1000);

// تنظيف الذاكرة عند إغلاق الصفحة
window.addEventListener('beforeunload', () => {
    if (pdfFrame) pdfFrame.src = '';
    currentPdfUrl = '';
});

// رسالة ترحيب في الكونسول
console.log(`
🎉 مكتبة إقرأ معنا
📚 المكتبة الرقمية العربية
🔗 ${window.location.origin}
✅ JavaScript محمل ومُفعل
`);

console.log('📚 مكتبة إقرأ معنا - script.js تم تحميله بنجاح!');
