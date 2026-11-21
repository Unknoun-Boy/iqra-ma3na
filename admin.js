const repository = {
    owner: 'Unknoun-Boy',
    name: 'iqra-ma3na',
    branch: 'main'
};

const categoryLabels = {
    general: 'عام',
    educational: 'تعليمي',
    literary: 'أدبي'
};

const categoryFolders = Object.keys(categoryLabels);
const apiRoot = `https://api.github.com/repos/${repository.owner}/${repository.name}/contents`;

const loginSection = document.getElementById('login-section');
const adminApp = document.getElementById('admin-app');
const loginForm = document.getElementById('login-form');
const tokenInput = document.getElementById('token-input');
const uploadForm = document.getElementById('upload-form');
const fileInput = document.getElementById('book-file');
const titleInput = document.getElementById('book-title');
const categoryInput = document.getElementById('book-category');
const uploadButton = document.getElementById('upload-button');
const logoutButton = document.getElementById('logout-button');
const status = document.getElementById('admin-status');
const booksContainer = document.getElementById('admin-books');

let token = sessionStorage.getItem('iqra-admin-token') || '';

function setStatus(message, isError = false) {
    status.textContent = message;
    status.className = `admin-status${isError ? ' error' : ''}`;
}

function headers(extra = {}) {
    return {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': '2022-11-28',
        ...extra
    };
}

async function api(path, options = {}) {
    const response = await fetch(path, options);
    if (response.ok) {
        return response.status === 204 ? null : response.json();
    }

    let message = `GitHub returned ${response.status}`;
    try {
        const body = await response.json();
        if (body.message) message = body.message;
    } catch (_) {
        // The status code is enough when GitHub has no JSON error body.
    }
    throw new Error(message);
}

function safeFileName(name) {
    return name
        .replace(/[\\/:*?"<>|]+/g, '-')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^\.+|\.+$/g, '')
        .trim();
}

function fileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(',')[1]);
        reader.onerror = () => reject(new Error('تعذر قراءة الملف'));
        reader.readAsDataURL(file);
    });
}

async function verifyToken() {
    await api(`https://api.github.com/repos/${repository.owner}/${repository.name}`, {
        headers: headers()
    });
}

function showAdmin() {
    loginSection.hidden = true;
    adminApp.hidden = false;
    loadBooks();
}

function showLogin() {
    loginSection.hidden = false;
    adminApp.hidden = true;
}

async function loadBooks() {
    setStatus('جاري تحميل الكتب...');
    booksContainer.replaceChildren();

    try {
        const groups = await Promise.all(categoryFolders.map(async (folder) => {
            let files;
            try {
                files = await api(`${apiRoot}/${folder}?ref=${repository.branch}`, {
                    headers: headers()
                });
            } catch (error) {
                if (error.message.includes('404')) return [];
                throw error;
            }

            return files
                .filter((file) => file.type === 'file' && /\.pdf$/i.test(file.name))
                .map((file) => ({ ...file, folder, category: categoryLabels[folder] }));
        }));

        const books = groups.flat().sort((a, b) =>
            a.name.localeCompare(b.name, 'ar')
        );

        if (books.length === 0) {
            booksContainer.innerHTML = '<p class="muted">لا توجد كتب حتى الآن.</p>';
        } else {
            booksContainer.replaceChildren(...books.map(createAdminBookRow));
        }
        setStatus(`${books.length} كتاب متاح`);
    } catch (error) {
        setStatus(error.message, true);
    }
}

function createAdminBookRow(book) {
    const row = document.createElement('article');
    row.className = 'admin-book';

    const details = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = book.name.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ');
    const category = document.createElement('span');
    category.className = 'admin-category';
    category.textContent = book.category;
    details.append(title, category);

    const actions = document.createElement('div');
    actions.className = 'admin-book-actions';

    const openLink = document.createElement('a');
    openLink.className = 'small-button';
    openLink.href = book.download_url;
    openLink.target = '_blank';
    openLink.rel = 'noopener noreferrer';
    openLink.textContent = 'عرض';

    const deleteButton = document.createElement('button');
    deleteButton.className = 'small-button danger';
    deleteButton.type = 'button';
    deleteButton.textContent = 'حذف';
    deleteButton.addEventListener('click', () => deleteBook(book, deleteButton));

    actions.append(openLink, deleteButton);
    row.append(details, actions);
    return row;
}

async function deleteBook(book, button) {
    if (!window.confirm(`هل تريد حذف «${book.name}»؟`)) return;

    button.disabled = true;
    setStatus('جاري حذف الكتاب...');
    try {
        await api(`${apiRoot}/${book.folder}/${encodeURIComponent(book.name)}`, {
            method: 'DELETE',
            headers: headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify({
                message: `Delete ${book.name}`,
                sha: book.sha,
                branch: repository.branch
            })
        });
        setStatus('تم حذف الكتاب');
        await loadBooks();
    } catch (error) {
        setStatus(error.message, true);
        button.disabled = false;
    }
}

loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();
    token = tokenInput.value.trim();
    setStatus('جاري التحقق...');
    try {
        await verifyToken();
        sessionStorage.setItem('iqra-admin-token', token);
        tokenInput.value = '';
        showAdmin();
    } catch (error) {
        setStatus(error.message, true);
    }
});

uploadForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const file = fileInput.files[0];
    if (!file) {
        setStatus('اختر ملف PDF أولًا', true);
        return;
    }
    if (!/\.pdf$/i.test(file.name)) {
        setStatus('يجب أن يكون الملف بصيغة PDF', true);
        return;
    }
    if (file.size > 25 * 1024 * 1024) {
        setStatus('حجم الملف أكبر من 25 ميغابايت', true);
        return;
    }

    const enteredTitle = titleInput.value.trim();
    const baseName = enteredTitle
        ? safeFileName(enteredTitle)
        : safeFileName(file.name.replace(/\.pdf$/i, ''));
    const fileName = `${baseName || 'book'}.pdf`;
    const folder = categoryInput.value;
    const path = `${apiRoot}/${folder}/${encodeURIComponent(fileName)}`;

    uploadButton.disabled = true;
    setStatus('جاري رفع الكتاب...');

    try {
        const content = await fileToBase64(file);
        const body = {
            message: `Add ${fileName}`,
            content,
            branch: repository.branch
        };

        try {
            const existing = await api(`${path}?ref=${repository.branch}`, {
                headers: headers()
            });
            body.sha = existing.sha;
            body.message = `Update ${fileName}`;
        } catch (error) {
            if (!error.message.includes('404')) throw error;
        }

        await api(path, {
            method: 'PUT',
            headers: headers({ 'Content-Type': 'application/json' }),
            body: JSON.stringify(body)
        });
        uploadForm.reset();
        setStatus(`تم رفع «${fileName}»`);
        await loadBooks();
    } catch (error) {
        setStatus(error.message, true);
    } finally {
        uploadButton.disabled = false;
    }
});

logoutButton.addEventListener('click', () => {
    sessionStorage.removeItem('iqra-admin-token');
    token = '';
    showLogin();
});

if (token) {
    setStatus('جاري التحقق من الجلسة...');
    verifyToken()
        .then(showAdmin)
        .catch(() => {
            sessionStorage.removeItem('iqra-admin-token');
            token = '';
            showLogin();
        });
}
