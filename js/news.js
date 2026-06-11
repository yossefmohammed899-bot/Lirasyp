// ============================================
// News Page - Links to detail page
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  if (!document.getElementById('news-full-grid')) return;
  await loadNews();
  initNewsFilters();
  initLoadMore();
});

let allNews = [];
let displayedCount = 0;
const BATCH_SIZE = 9;

async function loadNews() {
  allNews = await fetchLatestNews(50);
  const featured = document.getElementById('featured-news');
  const grid = document.getElementById('news-full-grid');

  if (allNews.length === 0) {
    if (grid) grid.innerHTML = '<div class="loading-cell" style="grid-column:1/-1;text-align:center;padding:3rem">لا توجد أخبار متاحة</div>';
    return;
  }

  // Featured article
  if (featured && allNews[0]) {
    const article = allNews[0];
    featured.innerHTML = `
      <a href="news-detail.html?id=${article.id}" class="news-card news-featured">
        <img src="${article.image_url || 'images/news-placeholder.jpg'}" alt="${article.title}" loading="lazy">
        <div class="news-card-content">
         
          <h3>${article.title}</h3>
          <p>${article.summary || ''}</p>
          <div class="news-card-meta">
            <span>${article.author || 'مصدر'}</span>
            <span>${formatDate(article.published_at)}</span>
          </div>
        </div>
      </a>
    `;
  }

  displayedCount = BATCH_SIZE;
  renderNewsGrid(allNews.slice(1, displayedCount));
}

function renderNewsGrid(news) {
  const grid = document.getElementById('news-full-grid');
  if (!grid) return;

  grid.innerHTML = news.map(article => `
    <a href="news-detail.html?id=${article.id}" class="news-card" data-category="${article.category}">
      <img src="${article.image_url || 'images/news-placeholder.jpg'}" alt="${article.title}" loading="lazy">
      <div class="news-card-content">
       
        <h3>${article.title}</h3>
        <p>${article.summary || ''}</p>
        <div class="news-card-meta">
          <span>${article.author || 'مصدر'}</span>
          <span>${formatDate(article.published_at)}</span>
        </div>
      </div>
    </a>
  `).join('');
}

// ... باقي الكود (initNewsFilters, initLoadMore) نفسه
