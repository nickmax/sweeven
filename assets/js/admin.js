(function () {
    const STORAGE_KEY = 'sweeven_cms_token';
    const container = document.getElementById('categories-container');
    const statusEl = document.getElementById('admin-status');
    const saveBtn = document.getElementById('save-menu');
    const dirtyIndicator = document.getElementById('dirty-indicator');
    const refreshBtn = document.getElementById('refresh-menu');
    const addCategoryBtn = document.getElementById('add-category');
    const tokenForm = document.getElementById('token-form');
    const tokenInput = document.getElementById('token-input');
    const tokenFeedback = document.getElementById('token-feedback');
    const clearTokenBtn = document.getElementById('clear-token');
    const loginScreen = document.getElementById('login-screen');
    const loginForm = document.getElementById('login-form');
    const loginUsername = document.getElementById('login-username');
    const loginPassword = document.getElementById('login-password');
    const loginFeedback = document.getElementById('login-feedback');
    const cmsApp = document.getElementById('cms-app');

    const AUTH_STORAGE_KEY = 'sweeven_cms_auth';
    const DEFAULT_USERNAME = 'sweeven';
    const DEFAULT_PASSWORD = 'adminpass';

    const state = {
        menu: null,
        dirty: false,
        loading: false,
        token: '',
        appStarted: false
    };

    const makeId = (prefix) => `${prefix}-${Math.random().toString(36).slice(2, 8)}-${Date.now()}`;

    const setStatus = (message, tone = 'info') => {
        if (!statusEl) {
            return;
        }
        statusEl.textContent = message;
        statusEl.className = `mt-6 text-sm ${
            tone === 'error'
                ? 'text-red-600'
                : tone === 'success'
                    ? 'text-green-600'
                    : 'text-gray-600'
        }`;
    };

    const setDirty = (dirty) => {
        state.dirty = dirty;
        if (!saveBtn || !dirtyIndicator) {
            return;
        }
        saveBtn.disabled = !dirty;
        dirtyIndicator.classList.toggle('hidden', !dirty);
    };

    const loadToken = () => {
        if (!window.localStorage) {
            return '';
        }
        return window.localStorage.getItem(STORAGE_KEY) || '';
    };

    const persistToken = (token) => {
        if (!window.localStorage) {
            return;
        }
        if (token) {
            window.localStorage.setItem(STORAGE_KEY, token);
        } else {
            window.localStorage.removeItem(STORAGE_KEY);
        }
    };

    const isSessionStorageAvailable = () => {
        try {
            const testKey = '__sweeven__';
            window.sessionStorage.setItem(testKey, testKey);
            window.sessionStorage.removeItem(testKey);
            return true;
        } catch (error) {
            return false;
        }
    };

    const loadAuth = () => {
        if (!isSessionStorageAvailable()) {
            return false;
        }
        return window.sessionStorage.getItem(AUTH_STORAGE_KEY) === 'true';
    };

    const persistAuth = (value) => {
        if (!isSessionStorageAvailable()) {
            return;
        }
        if (value) {
            window.sessionStorage.setItem(AUTH_STORAGE_KEY, 'true');
        } else {
            window.sessionStorage.removeItem(AUTH_STORAGE_KEY);
        }
    };

    const showLoginError = (message) => {
        if (!loginFeedback) {
            return;
        }
        loginFeedback.textContent = message;
        loginFeedback.classList.remove('hidden');
    };

    const clearLoginError = () => {
        if (!loginFeedback) {
            return;
        }
        loginFeedback.textContent = '';
        loginFeedback.classList.add('hidden');
    };

    const escapeHtml = (value) => String(value || '')
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

    const renderItems = (category, cIndex) => {
        if (!Array.isArray(category.items) || category.items.length === 0) {
            return `<p class="text-sm text-gray-500">No menu items yet. Use the button below to add one.</p>`;
        }
        return category.items.map((item, index) => {
            const price = Number(item.price) || 0;
            const description = item.description || '';
            return `<article class="border border-gray-200 rounded-lg p-4">
                        <div class="flex justify-between items-center gap-4 flex-wrap">
                            <h4 class="text-lg font-medium">${escapeHtml(item.name)}</h4>
                            <button type="button" class="text-sm text-red-600 hover:underline" data-action="remove-item" data-category="${cIndex}" data-item="${index}">Remove item</button>
                        </div>
                        <div class="mt-4 grid gap-4 md:grid-cols-2">
                            <label class="text-sm font-medium text-gray-700">
                                Name
                                <input type="text" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500" value="${escapeHtml(item.name)}" data-field="item-name" data-category="${cIndex}" data-item="${index}">
                            </label>
                            <label class="text-sm font-medium text-gray-700">
                                Price (Ksh)
                                <input type="number" min="0" step="10" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500" value="${price}" data-field="item-price" data-category="${cIndex}" data-item="${index}">
                            </label>
                        </div>
                        <label class="block mt-4 text-sm font-medium text-gray-700">
                            Short description
                            <textarea rows="2" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500" data-field="item-description" data-category="${cIndex}" data-item="${index}">${escapeHtml(description)}</textarea>
                        </label>
                    </article>`;
        }).join('');
    };

    const renderCategories = () => {
        if (!container) {
            return;
        }
        if (!state.menu || !Array.isArray(state.menu.categories) || state.menu.categories.length === 0) {
            container.innerHTML = `<p class="text-gray-500">No categories yet. Click "Add category" to get started.</p>`;
            return;
        }

        container.innerHTML = state.menu.categories.map((category, index) => {
            const note = category.note || '';
            return `<section class="bg-white border border-gray-200 rounded-lg shadow-sm">
                        <header class="flex flex-col gap-2 md:flex-row md:items-center md:justify-between border-b border-gray-200 px-6 py-4">
                            <div>
                                <h2 class="text-xl font-semibold" data-role="category-heading" data-category="${index}">${escapeHtml(category.title)}</h2>
                                <p class="text-sm text-gray-500">ID: <code>${escapeHtml(category.id)}</code></p>
                            </div>
                            <div class="flex items-center gap-3">
                                <button type="button" class="text-sm text-red-600 hover:underline" data-action="remove-category" data-category="${index}">Remove category</button>
                            </div>
                        </header>
                        <div class="px-6 py-6 space-y-6">
                            <div class="grid gap-4 md:grid-cols-3">
                                <label class="text-sm font-medium text-gray-700 md:col-span-2">
                                    Category title
                                    <input type="text" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500" value="${escapeHtml(category.title)}" data-field="category-title" data-category="${index}">
                                </label>
                                <label class="text-sm font-medium text-gray-700">
                                    Icon (Feather name)
                                    <input type="text" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500" value="${escapeHtml(category.icon || '')}" data-field="category-icon" data-category="${index}">
                                </label>
                            </div>
                            <label class="block text-sm font-medium text-gray-700">
                                Optional category note
                                <textarea rows="2" class="mt-1 w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-amber-500" data-field="category-note" data-category="${index}">${escapeHtml(note)}</textarea>
                            </label>
                            <div class="space-y-4">
                                <h3 class="text-lg font-semibold">Items</h3>
                                <div class="grid gap-4" data-role="items-container">
                                    ${renderItems(category, index)}
                                </div>
                                <button type="button" class="px-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition" data-action="add-item" data-category="${index}">Add item</button>
                            </div>
                        </div>
                    </section>`;
        }).join('');
    };

    const coercePrice = (value) => {
        const num = Number(value);
        return Number.isFinite(num) && num >= 0
            ? Math.round(num * 100) / 100
            : 0;
    };

    const ensureMenu = () => {
        if (!state.menu) {
            state.menu = {categories: []};
        }
        if (!Array.isArray(state.menu.categories)) {
            state.menu.categories = [];
        }
    };

    const addCategory = () => {
        ensureMenu();
        state.menu.categories.push({
            id: makeId('category'),
            title: 'New Category',
            icon: 'menu',
            items: []
        });
        renderCategories();
        setDirty(true);
    };

    const addItem = (categoryIndex) => {
        ensureMenu();
        const category = state.menu.categories[categoryIndex];
        if (!category) {
            return;
        }
        if (!Array.isArray(category.items)) {
            category.items = [];
        }
        category.items.push({
            id: makeId('item'),
            name: 'New Item',
            price: 0,
            description: ''
        });
        renderCategories();
        setDirty(true);
    };

    const removeCategory = (categoryIndex) => {
        ensureMenu();
        if (categoryIndex < 0 || categoryIndex >= state.menu.categories.length) {
            return;
        }
        const confirmed = window.confirm('Remove this entire category? This cannot be undone.');
        if (!confirmed) {
            return;
        }
        state.menu.categories.splice(categoryIndex, 1);
        renderCategories();
        setDirty(true);
    };

    const removeItem = (categoryIndex, itemIndex) => {
        ensureMenu();
        const category = state.menu.categories[categoryIndex];
        if (!category || !Array.isArray(category.items) || itemIndex < 0 || itemIndex >= category.items.length) {
            return;
        }
        category.items.splice(itemIndex, 1);
        renderCategories();
        setDirty(true);
    };

    const updateField = (target) => {
        ensureMenu();
        const categoryIndex = Number(target.dataset.category);
        const itemIndex = target.dataset.item !== undefined
            ? Number(target.dataset.item)
            : null;
        const category = state.menu.categories[categoryIndex];
        if (!category) {
            return;
        }

        switch (target.dataset.field) {
            case 'category-title':
                category.title = target.value;
                if (container) {
                    const heading = container.querySelector(`[data-role="category-heading"][data-category="${categoryIndex}"]`);
                    if (heading) {
                        heading.textContent = target.value || 'Untitled Category';
                    }
                }
                break;
            case 'category-icon':
                category.icon = target.value;
                break;
            case 'category-note':
                category.note = target.value;
                break;
            case 'item-name':
                if (itemIndex === null) {
                    return;
                }
                category.items[itemIndex].name = target.value;
                break;
            case 'item-price':
                if (itemIndex === null) {
                    return;
                }
                category.items[itemIndex].price = coercePrice(target.value);
                break;
            case 'item-description':
                if (itemIndex === null) {
                    return;
                }
                category.items[itemIndex].description = target.value;
                break;
            default:
                return;
        }

        setDirty(true);
    };

    const validateMenu = () => {
        ensureMenu();
        if (state.menu.categories.length === 0) {
            return 'Add at least one category before saving.';
        }
        for (const category of state.menu.categories) {
            if (!category.title || !category.title.trim()) {
                return 'Each category needs a title.';
            }
            if (!category.id) {
                category.id = makeId('category');
            }
            if (!Array.isArray(category.items)) {
                category.items = [];
            }
            for (const item of category.items) {
                if (!item.name || !item.name.trim()) {
                    return `Item in category "${category.title}" must have a name.`;
                }
                item.price = coercePrice(item.price);
                if (Number.isNaN(item.price)) {
                    return `Item "${item.name}" has an invalid price.`;
                }
                if (!item.id) {
                    item.id = makeId('item');
                }
                if (item.description === undefined) {
                    item.description = '';
                }
            }
            if (category.note === undefined) {
                delete category.note;
            }
        }
        return null;
    };

    const buildPayload = () => {
        return {
            categories: state.menu.categories.map((category) => ({
                id: category.id,
                title: category.title.trim(),
                icon: category.icon
                    ? category.icon.trim()
                    : undefined,
                note: category.note
                    ? category.note.trim()
                    : undefined,
                items: category.items.map((item) => ({
                    id: item.id,
                    name: item.name.trim(),
                    price: coercePrice(item.price),
                    description: item.description
                        ? item.description.trim()
                        : ''
                }))
            }))
        };
    };

    const fetchMenu = async () => {
        if (state.loading) {
            return;
        }
        state.loading = true;
        setStatus('Loading menu...');
        ensureMenu();

        const headers = {};
        if (state.token) {
            headers['X-CMS-Token'] = state.token;
        }

        try {
            const response = await fetch('/api/menu', {
                headers,
                cache: 'no-cache'
            });
            if (response.status === 401) {
                throw new Error('Unauthorized. Enter the correct CMS token and try again.');
            }
            if (!response.ok) {
                throw new Error(`Server responded with ${response.status}`);
            }
            const data = await response.json();
            if (!data || !Array.isArray(data.categories)) {
                throw new Error('Menu payload is missing categories.');
            }
            state.menu = data;
            renderCategories();
            setDirty(false);
            setStatus('Menu loaded. Make your changes and click Save.');
        } catch (error) {
            console.error('Failed to load menu', error);
            setStatus(`Failed to load menu: ${error.message}`, 'error');
            container.innerHTML = `<p class="text-red-600">Menu data unavailable. Check that the server is running and your token is correct.</p>`;
        } finally {
            state.loading = false;
        }
    };

    const startApp = () => {
        if (state.appStarted) {
            return;
        }
        state.appStarted = true;
        initToken();
        fetchMenu();
    };

    const unlockApp = (persist = true) => {
        clearLoginError();
        if (loginScreen) {
            loginScreen.classList.add('hidden');
        }
        if (cmsApp) {
            cmsApp.classList.remove('hidden');
        }
        if (persist) {
            persistAuth(true);
        }
        startApp();
    };

    const requireLogin = () => {
        clearLoginError();
        if (cmsApp) {
            cmsApp.classList.add('hidden');
        }
        if (loginScreen) {
            loginScreen.classList.remove('hidden');
        }
        if (loginUsername) {
            loginUsername.value = '';
            loginUsername.focus();
        }
        if (loginPassword) {
            loginPassword.value = '';
        }
        persistAuth(false);
    };

    const handleLoginSubmit = (event) => {
        event.preventDefault();
        if (!loginUsername || !loginPassword) {
            return;
        }
        const username = loginUsername.value.trim();
        const password = loginPassword.value;
        if (username === DEFAULT_USERNAME && password === DEFAULT_PASSWORD) {
            unlockApp();
            return;
        }
        showLoginError('Invalid credentials. Try again.');
        loginPassword.value = '';
        loginPassword.focus();
    };

    const saveMenu = async () => {
        ensureMenu();
        const validationError = validateMenu();
        if (validationError) {
            setStatus(validationError, 'error');
            return;
        }

        const payload = buildPayload();
        const headers = {'Content-Type': 'application/json'};
        if (state.token) {
            headers['X-CMS-Token'] = state.token;
        }

        setStatus('Saving menu...');
        saveBtn.disabled = true;

        try {
            const response = await fetch('/api/menu', {
                method: 'PUT',
                headers,
                body: JSON.stringify(payload)
            });
            if (response.status === 401) {
                throw new Error('Unauthorized. Enter the correct CMS token and try again.');
            }
            if (!response.ok) {
                const result = await response.json().catch(() => ({}));
                throw new Error(result.error || `Failed to save menu (status ${response.status}).`);
            }
            setDirty(false);
            setStatus('Menu saved successfully.', 'success');
        } catch (error) {
            console.error('Failed to save menu', error);
            setStatus(error.message || 'Failed to save menu.', 'error');
            setDirty(true);
        } finally {
            saveBtn.disabled = !state.dirty;
        }
    };

    const handleContainerInput = (event) => {
        const target = event.target;
        if (!target || !target.dataset || !target.dataset.field) {
            return;
        }
        updateField(target);
    };

    const handleContainerClick = (event) => {
        const target = event.target.closest('[data-action]');
        if (!target) {
            return;
        }
        const categoryIndex = Number(target.dataset.category);
        switch (target.dataset.action) {
            case 'add-item':
                addItem(categoryIndex);
                break;
            case 'remove-item': {
                const itemIndex = Number(target.dataset.item);
                removeItem(categoryIndex, itemIndex);
                break;
            }
            case 'remove-category':
                removeCategory(categoryIndex);
                break;
            default:
                break;
        }
    };

    const initToken = () => {
        state.token = loadToken();
        if (tokenInput) {
            tokenInput.value = state.token;
        }
        if (tokenFeedback) {
            tokenFeedback.textContent = state.token
                ? 'Token loaded from browser storage.'
                : 'No token stored.';
        }
    };

    const handleTokenSubmit = (event) => {
        event.preventDefault();
        const value = tokenInput
            ? tokenInput.value.trim()
            : '';
        state.token = value;
        persistToken(value);
        if (tokenFeedback) {
            tokenFeedback.textContent = value
                ? 'Token saved. It will be sent with future requests.'
                : 'Token cleared.';
        }
        fetchMenu();
    };

    const handleClearToken = () => {
        persistToken('');
        state.token = '';
        if (tokenInput) {
            tokenInput.value = '';
        }
        if (tokenFeedback) {
            tokenFeedback.textContent = 'Token cleared.';
        }
    };

    const bootstrap = () => {
        if (!container || !statusEl) {
            return;
        }
        if (loadAuth()) {
            unlockApp(false);
        } else {
            requireLogin();
        }
    };

    if (container) {
        container.addEventListener('input', handleContainerInput);
        container.addEventListener('click', handleContainerClick);
    }
    if (saveBtn) {
        saveBtn.addEventListener('click', saveMenu);
    }
    if (refreshBtn) {
        refreshBtn.addEventListener('click', fetchMenu);
    }
    if (addCategoryBtn) {
        addCategoryBtn.addEventListener('click', addCategory);
    }
    if (tokenForm) {
        tokenForm.addEventListener('submit', handleTokenSubmit);
    }
    if (clearTokenBtn) {
        clearTokenBtn.addEventListener('click', handleClearToken);
    }
    if (loginForm) {
        loginForm.addEventListener('submit', handleLoginSubmit);
    }
    if (loginUsername) {
        loginUsername.addEventListener('input', clearLoginError);
    }
    if (loginPassword) {
        loginPassword.addEventListener('input', clearLoginError);
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', bootstrap);
    } else {
        bootstrap();
    }
})();
