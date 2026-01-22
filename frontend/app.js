const API_BASE = window.location.origin;
let currentFilter = 'all';
let currentOffset = 0;
const ARTICLES_PER_PAGE = 20;
let allArticles = [];

// Initialize app
document.addEventListener('DOMContentLoaded', () => {
    loadArticles();
    loadStats();
    setupEventListeners();
    setupAutoRefresh();
});

// Event Listeners
function setupEventListeners() {
    // Filter buttons
    document.querySelectorAll('.filter-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
            e.target.classList.add('active');
            currentFilter = e.target.dataset.source;
            currentOffset = 0;
            loadArticles();
        });
    });

    // Refresh button
    document.getElementById('refreshBtn').addEventListener('click', async () => {
        const btn = document.getElementById('refreshBtn');
        btn.disabled = true;
        btn.innerHTML = '<span class="refresh-icon">↻</span> Refreshing...';

        try {
            const response = await fetch(`${API_BASE}/api/refresh`, { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                showNotification(`Loaded ${data.newArticles} new articles!`);
                currentOffset = 0;
                await loadArticles();
                await loadStats();
            }
        } catch (error) {
            console.error('Refresh error:', error);
            showNotification('Failed to refresh articles', 'error');
        }

        btn.disabled = false;
        btn.innerHTML = '<span class="refresh-icon">↻</span> Refresh';
    });

    // Load more button
    document.getElementById('loadMoreBtn').addEventListener('click', () => {
        currentOffset += ARTICLES_PER_PAGE;
        loadArticles(true);
    });
}

// Load articles from API
async function loadArticles(append = false) {
    const timeline = document.getElementById('timeline');
    const loading = document.getElementById('loading');
    const loadMore = document.getElementById('loadMore');

    if (!append) {
        loading.style.display = 'block';
        timeline.innerHTML = '';
    }

    try {
        let url;
        if (currentFilter === 'all') {
            url = `${API_BASE}/api/articles?limit=${ARTICLES_PER_PAGE}&offset=${currentOffset}`;
        } else {
            url = `${API_BASE}/api/articles/source/${encodeURIComponent(currentFilter)}?limit=${ARTICLES_PER_PAGE}&offset=${currentOffset}`;
        }

        const response = await fetch(url);
        const data = await response.json();

        if (data.success) {
            if (append) {
                allArticles = [...allArticles, ...data.articles];
            } else {
                allArticles = data.articles;
            }

            renderArticles(allArticles, append);

            // Show/hide load more button
            if (data.articles.length === ARTICLES_PER_PAGE && currentFilter === 'all') {
                loadMore.style.display = 'block';
            } else {
                loadMore.style.display = 'none';
            }

            updateLastUpdate();
        }
    } catch (error) {
        console.error('Error loading articles:', error);
        timeline.innerHTML = '<div class="no-articles">Failed to load articles. Please try again.</div>';
    }

    loading.style.display = 'none';
}

// Render articles to timeline
function renderArticles(articles, append = false) {
    const timeline = document.getElementById('timeline');

    if (!append) {
        timeline.innerHTML = '';
    }

    if (articles.length === 0) {
        timeline.innerHTML = '<div class="no-articles">No articles found for this filter.</div>';
        return;
    }

    articles.forEach(article => {
        const articleEl = createArticleElement(article);
        timeline.appendChild(articleEl);
    });
}

// Sanitize HTML content to prevent XSS
function sanitizeHTML(html) {
    if (typeof DOMPurify !== 'undefined') {
        return DOMPurify.sanitize(html, {
            ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a', 'p', 'br'],
            ALLOWED_ATTR: ['href', 'target', 'rel']
        });
    }
    // Fallback: basic HTML escape
    const div = document.createElement('div');
    div.textContent = html;
    return div.innerHTML;
}

// Sanitize URL to prevent javascript: and data: URLs
function sanitizeURL(url) {
    if (!url || typeof url !== 'string') return '#';

    try {
        const urlObj = new URL(url);
        // Only allow http and https protocols
        if (urlObj.protocol === 'http:' || urlObj.protocol === 'https:') {
            return url;
        }
    } catch (e) {
        // Invalid URL
    }
    return '#';
}

// Create article HTML element
function createArticleElement(article) {
    const div = document.createElement('div');
    div.className = 'timeline-item';

    const date = new Date(article.pubDate);
    const formattedDate = formatDate(date);

    // Sanitize all data
    const safeTitle = sanitizeHTML(article.title || 'No title');
    const safeSource = sanitizeHTML(article.source || 'Unknown');
    const safeDescription = sanitizeHTML(truncateText(article.description || '', 200));
    const safeLink = sanitizeURL(article.link);
    const safeImageUrl = sanitizeURL(article.imageUrl);

    // Build HTML with sanitized data
    const imageHtml = article.imageUrl && safeImageUrl !== '#'
        ? `<img src="${safeImageUrl}" alt="" class="article-image" onerror="this.style.display='none'" loading="lazy">`
        : '';

    div.innerHTML = `
        <div class="timeline-marker"></div>
        <div class="timeline-card">
            <div class="article-header">
                <div class="article-meta">
                    <span class="article-source">${safeSource}</span>
                    <span class="article-date">${formattedDate}</span>
                </div>
                ${imageHtml}
            </div>
            <h2 class="article-title">
                <a href="${safeLink}" target="_blank" rel="noopener noreferrer">${safeTitle}</a>
            </h2>
            <p class="article-description">${safeDescription}</p>
            <a href="${safeLink}" target="_blank" rel="noopener noreferrer" class="article-link">
                Read Full Article →
            </a>
        </div>
    `;

    return div;
}

// Load statistics
async function loadStats() {
    try {
        const response = await fetch(`${API_BASE}/api/stats`);
        const data = await response.json();

        if (data.success) {
            document.getElementById('totalArticles').textContent = data.stats.totalArticles;
            document.getElementById('last24h').textContent = data.stats.last24Hours;
        }
    } catch (error) {
        console.error('Error loading stats:', error);
    }
}

// Utility functions
function formatDate(date) {
    const now = new Date();
    const diff = now - date;
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (hours < 1) {
        const minutes = Math.floor(diff / (1000 * 60));
        return `${minutes} minute${minutes !== 1 ? 's' : ''} ago`;
    } else if (hours < 24) {
        return `${hours} hour${hours !== 1 ? 's' : ''} ago`;
    } else if (days < 7) {
        return `${days} day${days !== 1 ? 's' : ''} ago`;
    } else {
        return date.toLocaleDateString('pt-PT', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
}

function truncateText(text, maxLength) {
    if (!text) return '';
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
}

function updateLastUpdate() {
    const now = new Date();
    document.getElementById('lastUpdate').textContent = now.toLocaleTimeString('pt-PT');
}

function showNotification(message, type = 'success') {
    // Simple notification (you can enhance this with a better UI)
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        background: ${type === 'success' ? '#4CAF50' : '#f44336'};
        color: white;
        border-radius: 8px;
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
        z-index: 1000;
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Auto-refresh every 5 minutes
function setupAutoRefresh() {
    setInterval(async () => {
        try {
            console.log('Auto-refreshing articles...');
            const response = await fetch(`${API_BASE}/api/refresh`, { method: 'POST' });
            const data = await response.json();

            if (data.success && data.newArticles > 0) {
                showNotification(`${data.newArticles} new articles available!`);
                currentOffset = 0;
                await loadArticles();
                await loadStats();
            }
        } catch (error) {
            console.error('Auto-refresh failed:', error);
        }
    }, 5 * 60 * 1000); // 5 minutes
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);
