// إعدادات Supabase مع بياناتك
const SUPABASE_URL = 'https://wwejcaljeigmgtptrpli.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3ZWpjYWxqZWlnbWd0cHRycGxpIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTE4OTYzMzksImV4cCI6MjA2NzQ3MjMzOX0.hdJt5iWnLRKzBx92Ez8WJfArnRMGtf4q8NvOPoT7U-o';

// إنشاء عميل Supabase
const supabase = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// إعدادات المكتبة
const CONFIG = {
    maxFileSize: 50 * 1024 * 1024, // 50 ميغابايت
    allowedTypes: ['application/pdf'],
    categories: ['عام', 'تعليمي', 'أدبي']
};

// متغيرات عامة
let allBooks = [];
let filteredBooks = [];

// =======================
// وظائف تحميل البيانات
// =======================

// تحميل جميع الكتب من Supabase
async function loadBooks() {
    try {
        showLoading(true);
        
        const { data: books, error } = await supabase
            .from('books')
            .select('*')
            .order('upload_date', { ascending: false });

        if (error) {
            throw error;
        }

        allBooks = books || [];
        filteredBooks = [...allBooks];
        
        displayBooks(filteredBooks);
        updateStats();
        
    } catch (error) {
        console.error('خطأ في تحميل الكتب:', error);
        showError('فشل في تحميل الكتب. يرجى المحاولة لاحقاً.');
    } finally {
        showLoading(false);
    }
}

// عرض الكتب في الواجهة
function displayBooks(books) {
    const booksGrid = document.getElementById('books-grid');
    const noResults = document.getElementById('no-results');
    
    if (!books || books.length === 0) {
        if (booksGrid) booksGrid.style.display = 'none';
        if (noResults) noResults.style.display = 'block';
        return;
    }
    
    if (booksGrid) booksGrid.style.display = 'grid';
    if (noResults) noResults.style.display = 'none';
    
    if (booksGrid) {
        booksGrid.innerHTML = books.map(book => `
            <div class="book-card" data-category="${book.category}">
                <div class="book-content">
                    <h3 class="book-title">${escapeHtml(book.title)}</h3>
                    <span class="book-category">${book.category}</span>
                    <span class="book-date">${formatDate(book.upload_date)}</span>
                </div>
                <div class="book-actions">
                    <a href="${book.file_url}" target="_blank" rel="noopener" class="btn btn-read">
                        📖 قراءة
                    </a>
                    <a href="${book.file_url}" download="${escapeHtml(book.title)}.pdf" class="btn btn-download">
                        ⬇️ تحميل
                    </a>
                </div>
            </div>
        `).join('');
    }
}

// تحديث الإحصائيات
function updateStats() {
    const stats = calculateStats(allBooks);
    
    updateElementText('total-books', stats.total);
    updateElementText('general-count', stats.عام);
    updateElementText('educational-count', stats.تعليمي);
    updateElementText('literary-count', stats.أدبي);
    
    // للوحة الإدارة
    updateElementText('admin-total-books', stats.total);
    updateElementText('admin-general-count', stats.عام);
    updateElementText('admin-educational-count', stats.تعليمي);
    updateElementText('admin-literary-count', stats.أدبي);
}

// حساب الإحصائيات
function calculateStats(books) {
    const stats = { total: 0, عام: 0, تعليمي: 0, أدبي: 0 };
    
    books.forEach(book => {
        stats.total++;
        if (stats.hasOwnProperty(book.category)) {
            stats[book.category]++;
        }
    });
    
    return stats;
}

// =======================
// وظائف البحث والفلترة
// =======================

// البحث في الكتب
function searchBooks() {
    const searchTerm = document.getElementById('search-input')?.value.toLowerCase() || '';
    const selectedCategory = document.getElementById('category-filter')?.value || 'الكل';
    
    filteredBooks = allBooks.filter(book => {
        const matchesSearch = book.title.toLowerCase().includes(searchTerm);
        const matchesCategory = selectedCategory === 'الكل' || book.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
    
    displayBooks(filteredBooks);
}

// إعداد مستمعي أحداث البحث
function setupSearchListeners() {
    const searchInput = document.getElementById('search-input');
    const categoryFilter = document.getElementById('category-filter');
    
    if (searchInput) {
        searchInput.addEventListener('input', searchBooks);
        searchInput.addEventListener('keyup', searchBooks);
    }
    
    if (categoryFilter) {
        categoryFilter.addEventListener('change', searchBooks);
    }
}

// =======================
// وظائف إدارة الكتب
// =======================

// إضافة كتاب جديد
async function handleAddBook(event) {
    event.preventDefault();
    
    const title = document.getElementById('book-title')?.value.trim();
    const category = document.getElementById('book-category')?.value;
    const pdfFile = document.getElementById('pdf-file')?.files[0];
    
    // التحقق من البيانات
    if (!title || !category || !pdfFile) {
        showAlert('يرجى ملء جميع الحقول المطلوبة', 'error');
        return;
    }
    
    // التحقق من نوع الملف
    if (!CONFIG.allowedTypes.includes(pdfFile.type)) {
        showAlert('نوع الملف غير مدعوم. يرجى رفع ملف PDF فقط', 'error');
        return;
    }
    
    // التحقق من حجم الملف
    if (pdfFile.size > CONFIG.maxFileSize) {
        showAlert('حجم الملف كبير جداً. الحد الأقصى 50 ميغابايت', 'error');
        return;
    }
    
    try {
        setUploadState(true);
        
        // رفع الملف إلى Supabase Storage
        const fileName = generateFileName(title, pdfFile.name);
        
        const { data: fileData, error: fileError } = await supabase.storage
            .from('books')
            .upload(fileName, pdfFile, {
                cacheControl: '3600',
                upsert: false
            });

        if (fileError) {
            throw new Error(`فشل في رفع الملف: ${fileError.message}`);
        }

        // الحصول على الرابط العام للملف
        const { data: urlData } = supabase.storage
            .from('books')
            .getPublicUrl(fileName);

        // إضافة البيانات لقاعدة البيانات
        const { data: bookData, error: dbError } = await supabase
            .from('books')
            .insert([{
                title: title,
                category: category,
                file_url: urlData.publicUrl,
                file_name: fileName,
                file_size: pdfFile.size
            }])
            .select()
            .single();

        if (dbError) {
            // حذف الملف إذا فشلت إضافة البيانات
            await supabase.storage.from('books').remove([fileName]);
            throw new Error(`فشل في حفظ بيانات الكتاب: ${dbError.message}`);
        }

        // نجح الحفظ
        showAlert('✅ تم إضافة الكتاب بنجاح!', 'success');
        
        // تحديث القوائم
        allBooks.unshift(bookData);
        filteredBooks = [...allBooks];
        updateStats();
        displayBooks(filteredBooks);
        loadAdminBooks();
        
        // إعادة تعيين النموذج
        document.getElementById('add-book-form').reset();
        
    } catch (error) {
        console.error('خطأ في إضافة الكتاب:', error);
        showAlert(`❌ ${error.message}`, 'error');
    } finally {
        setUploadState(false);
    }
}

// حذف كتاب
async function deleteBook(bookId, fileName) {
    if (!confirm('هل أنت متأكد من حذف هذا الكتاب؟\nهذا الإجراء لا يمكن التراجع عنه.')) {
        return;
    }
    
    try {
        // حذف الملف من Storage
        const { error: storageError } = await supabase.storage
            .from('books')
            .remove([fileName]);

        if (storageError) {
            console.warn('تحذير: فشل في حذف الملف من التخزين:', storageError);
        }

        // حذف البيانات من قاعدة البيانات
        const { error: dbError } = await supabase
            .from('books')
            .delete()
            .eq('id', bookId);

        if (dbError) {
            throw new Error(`فشل في حذف بيانات الكتاب: ${dbError.message}`);
        }

        // تحديث القوائم المحلية
        allBooks = allBooks.filter(book => book.id !== bookId);
        filteredBooks = filteredBooks.filter(book => book.id !== bookId);
        
        updateStats();
        displayBooks(filteredBooks);
        loadAdminBooks();
        
        showAlert('✅ تم حذف الكتاب بنجاح', 'success');
        
    } catch (error) {
        console.error('خطأ في حذف الكتاب:', error);
        showAlert(`❌ ${error.message}`, 'error');
    }
}

// =======================
// وظائف لوحة الإدارة
// =======================

// تحميل الكتب في لوحة الإدارة
async function loadAdminBooks() {
    const adminBooksList = document.getElementById('admin-books-list');
    if (!adminBooksList) return;
    
    if (allBooks.length === 0) {
        adminBooksList.innerHTML = `
            <div class="empty-state">
                <p>لا توجد كتب في المكتبة حالياً</p>
            </div>
        `;
        return;
    }
    
    adminBooksList.innerHTML = allBooks.map(book => `
        <div class="admin-book-item">
            <div class="admin-book-info">
                <h4>${escapeHtml(book.title)}</h4>
                <p>القسم: ${book.category} | التاريخ: ${formatDate(book.upload_date)} | الحجم: ${formatFileSize(book.file_size)}</p>
            </div>
            <div class="admin-book-actions">
                <button onclick="deleteBook(${book.id}, '${book.file_name}')" class="btn btn-delete">
                    🗑️ حذف
                </button>
            </div>
        </div>
    `).join('');
}

// تحديث إحصائيات الإدارة
async function loadAdminStats() {
    await loadBooks();
}

// تحديث قائمة الكتب في الإدارة
async function refreshAdminBooks() {
    await loadBooks();
    loadAdminBooks();
    showAlert('✅ تم تحديث القائمة', 'success');
}

// =======================
// وظائف مساعدة
// =======================

// إنشاء اسم ملف فريد
function generateFileName(title, originalName) {
    const timestamp = Date.now();
    const sanitizedTitle = sanitizeFileName(title);
    const extension = originalName.split('.').pop();
    return `${timestamp}_${sanitizedTitle}.${extension}`;
}

// تنظيف اسم الملف
function sanitizeFileName(fileName) {
    return fileName
        .replace(/[^\u0600-\u06FFa-zA-Z0-9\s]/g, '') // الاحتفاظ بالعربية والإنجليزية والأرقام فقط
        .replace(/\s+/g, '_') // استبدال المسافات بشرطات سفلية
        .substring(0, 50); // تحديد الطول
}

// تنسيق التاريخ
function formatDate(dateString) {
    if (!dateString) return 'غير محدد';
    
    const date = new Date(dateString);
    return date.toLocaleDateString('ar-SA', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// تنسيق حجم الملف
function formatFileSize(bytes) {
    if (!bytes) return 'غير محدد';
    if (bytes === 0) return '0 بايت';
    
    const k = 1024;
    const sizes = ['بايت', 'كيلوبايت', 'ميغابايت', 'غيغابايت'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

// حماية من XSS
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// تحديث نص عنصر
function updateElementText(id, text) {
    const element = document.getElementById(id);
    if (element) {
        element.textContent = text;
    }
}

// إظهار/إخفاء التحميل
function showLoading(show) {
    const loadingMessage = document.getElementById('loading-message');
    if (loadingMessage) {
        loadingMessage.style.display = show ? 'block' : 'none';
    }
}

// إظهار رسالة خطأ
function showError(message) {
    console.error(message);
    showAlert(message, 'error');
}

// إظهار تنبيه
function showAlert(message, type = 'info') {
    // يمكن تحسين هذا لاحقاً بتصميم أفضل
    alert(message);
}

// تعيين حالة الرفع
function setUploadState(isUploading) {
    const uploadText = document.getElementById('upload-text');
    const uploadLoading = document.getElementById('upload-loading');
    const submitButton = document.querySelector('#add-book-form button[type="submit"]');
    
    if (uploadText) uploadText.style.display = isUploading ? 'none' : 'inline';
    if (uploadLoading) uploadLoading.style.display = isUploading ? 'inline' : 'none';
    if (submitButton) submitButton.disabled = isUploading;
}

// =======================
// تهيئة التطبيق
// =======================

// تحميل مكتبة Supabase
function loadSupabaseLibrary() {
    return new Promise((resolve, reject) => {
        if (window.supabase) {
            resolve();
            return;
        }
        
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/@supabase/supabase-js@2';
        script.onload = resolve;
        script.onerror = reject;
        document.head.appendChild(script);
    });
}

// بدء التطبيق عند تحميل الصفحة
document.addEventListener('DOMContentLoaded', async function() {
    try {
        // تحميل مكتبة Supabase
        await loadSupabaseLibrary();
        
        // إعداد مستمعي الأحداث
        setupSearchListeners();
        
        // تحميل البيانات الأولية
        await loadBooks();
        
        console.log('✅ تم تحميل مكتبة إقرأ معنا بنجاح');
        
    } catch (error) {
        console.error('❌ خطأ في تهيئة التطبيق:', error);
        showError('فشل في تحميل المكتبة. يرجى إعادة تحميل الصفحة.');
    }
});

// جعل الوظائف متاحة عالمياً للاستخدام في HTML
window.handleAddBook = handleAddBook;
window.deleteBook = deleteBook;
window.loadAdminStats = loadAdminStats;
window.loadAdminBooks = loadAdminBooks;
window.refreshAdminBooks = refreshAdminBooks;
