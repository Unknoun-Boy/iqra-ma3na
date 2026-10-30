const repository = {
    owner: 'Unknoun-Boy',
    name: 'iqra-ma3na',
    branch: 'main'
};

const categories = [
    { folder: 'general', label: 'عام', stat: 'general' },
    { folder: 'educational', label: 'تعليمي', stat: 'educational' },
    { folder: 'literary', label: 'أدبي', stat: 'literary' }
];

const elements = {
    search: document.getElementById('search-input'),
    category: document.getElementById('category-filter'),
    loading: document.getElementById('loading-message'),
    grid: document.getElementById('books-grid'),
    empty: document.getElementById('no-results'),
    total: document.getElementById('total-books'),
    general: document.getElementById('general-count'),
    educational: document.getElementById('educational-count'),
    literary: document.getElementById('literary-count')
};

let books = [];

function getApiUrl(folder) {
    return `https://api.github.com/repos/${repository.owner}/${repository.name}/contents/books/${folder}?ref=${repository.branch}`;
}

function getFilteredBooks() {
    const searchTerm = elements.search.value.trim().toLocaleLowerCase('ar');
    const selectedCategory = elements.category.value;

    return books.filter((book) => {
        const title = book.title.toLocaleLowerCase('ar');
        const matchesSearch = title.includes(searchTerm);
        const matchesCategory = selectedCategory === 'الكل' || book.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });
}

function getTitle(fileName) {
    return fileName.replace(/\.pdf$/i, '').replace(/[-_]+/g, ' ');
}

function createBookCard(book) {
    const card = document.createElement('article');
    card.className = 'book-card';

    const content = document.createElement('div');
    content.className = 'book-content';

    const title = document.createElement('h2');
    title.className = 'book-title';
    title.textContent = book.title;

    const category = document.createElement('span');
    category.className = 'book-category';
    category.textContent = book.category;

    content.append(title, category);

    const actions = document.createElement('div');
    actions.className = 'book-actions';
    actions.append(
        createBookLink(book.url, '📖 قراءة', 'btn btn-read'),
        createBookLink(book.url, '⬇️ تحميل', 'btn btn-download', book.title)
    );

    card.append(content, actions);
    return card;
}

function createBookLink(url, label, className, downloadName) {
    const link = document.createElement('a');
    link.className = className;
    link.href = url;
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    link.textContent = label;

    if (downloadName) {
        link.download = downloadName;
    }

    return link;
}

function updateStats() {
    const counts = books.reduce((result, book) => {
        result.total += 1;
        const category = categories.find((item) => item.label === book.category);
        if (category) {
            result[category.stat] += 1;
        }
        return result;
    }, { total: 0, general: 0, educational: 0, literary: 0 });

    elements.total.textContent = counts.total;
    elements.general.textContent = counts.general;
    elements.educational.textContent = counts.educational;
    elements.literary.textContent = counts.literary;
}

function renderBooks() {
    const filteredBooks = getFilteredBooks();
    elements.grid.replaceChildren(...filteredBooks.map(createBookCard));
    elements.grid.hidden = filteredBooks.length === 0;
    elements.empty.hidden = filteredBooks.length !== 0;
}

async function loadBooks() {
    elements.loading.hidden = false;
    elements.empty.hidden = true;

    try {
        const responses = await Promise.all(categories.map(async (category) => {
            const response = await fetch(getApiUrl(category.folder));
            if (!response.ok) {
                throw new Error(`GitHub returned ${response.status}`);
            }

            const files = await response.json();
            return files
                .filter((file) => file.type === 'file' && /\.pdf$/i.test(file.name))
                .map((file) => ({
                    title: getTitle(file.name),
                    category: category.label,
                    url: file.download_url
                }));
        }));

        books = responses.flat();
        books.sort((first, second) => first.title.localeCompare(second.title, 'ar'));
        updateStats();
        renderBooks();
    } catch (error) {
        console.error('Unable to load books from GitHub:', error);
        elements.empty.querySelector('h3').textContent = 'تعذر تحميل الكتب';
        elements.empty.querySelector('p').textContent =
            'تحقق من اتصال الإنترنت وحاول تحديث الصفحة.';
        elements.empty.hidden = false;
    } finally {
        elements.loading.hidden = true;
    }
}

elements.search.addEventListener('input', renderBooks);
elements.category.addEventListener('change', renderBooks);
loadBooks();
