// ============================================
// News Detail Page
// ============================================

document.addEventListener('DOMContentLoaded', async () => {
  const params = new URLSearchParams(window.location.search);
  const articleId = params.get('id');

  if (!articleId) {
    window.location.href = 'news.html';
    return;
  }

  await loadArticle(articleId);
});

async function loadArticle(id) {
  const container = document.getElementById('article-full');

  try {
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      container.innerHTML = `
        <div class="article-error">
          <div style="font-size:3rem;margin-bottom:1rem;">😕</div>
          <h2>الخبر غير موجود</h2>
          <p>الخبر اللي بتدور عليه ما لقيناه</p>
          <a href="news.html" class="btn-primary">العودة للأخبار</a>
        </div>
      `;
      return;
    }

    const article = data;

    // Update page title
    document.title = `${article.title} | الليرة - عملتنا`;

    // Render article
    container.innerHTML = `
      <div class="article-hero">
        <img src="${article.image_url || 'images/news-placeholder.jpg'}" alt="${article.title}" loading="eager">
        <div class="article-hero-overlay"></div>
      </div>
      
      <div class="article-body">
        <div class="article-header">
          <span class="news-card-category ${article.category}">${article.category}</span>
          <h1 class="article-title">${article.title}</h1>
          <div class="article-meta">
            <span class="article-author">
              <span class="article-author-icon">✍️</span>
              ${article.author || 'مصدر'}
            </span>
            <span class="article-date">
              <span class="article-date-icon">📅</span>
              ${formatDate(article.published_at)}
            </span>
            ${article.source_url ? `
              <a href="${article.source_url}" target="_blank" rel="noopener" class="article-source">
                <span>🔗</span>
                المصدر
              </a>
            ` : ''}
          </div>
        </div>

        <div class="article-summary">
          <p>${article.summary || ''}</p>
        </div>

        <div class="article-content">
          ${article.content || article.summary || '<p>لا يوجد محتوى إضافي</p>'}
        </div>

        <div class="article-tags">
          ${(article.tags || []).map(tag => `<span class="article-tag">${tag}</span>`).join('')}
        </div>

        <div class="article-share">
          <span>مشاركة:</span>
          <button onclick="shareArticle('${article.title}', '${window.location.href}')" class="share-btn">
            <span>📤</span>
          </button>
        </div>
      </div>
    `;

    // Load related news
    await loadRelatedNews(article.category, article.id);

  } catch (e) {
    console.error('Error loading article:', e);
    container.innerHTML = `
      <div class="article-error">
        <div style="font-size:3rem;margin-bottom:1rem;">⚠️</div>
        <h2>خطأ في التحميل</h2>
        <p>حاول مرة ثانية</p>
        <a href="news.html" class="btn-primary">العودة للأخبار</a>
      </div>
    `;
  }
}

async function loadRelatedNews(category, currentId) {
  const section = document.getElementById('related-news');
  const grid = document.getElementById('related-grid');

  try {
    // جلب كل أخبار نفس التصنيف
    const { data, error } = await supabase
      .from('news_articles')
      .select('*')
     
      .order('published_at', { ascending: false })
      .limit(4);

    if (error || !data || data.length === 0) return;

    // فلترة الخبر الحالي يدوياً
    const related = data.filter(article => article.id !== currentId).slice(0, 3);

    if (related.length === 0) return;

    section.style.display = '';
    grid.innerHTML = related.map(article => `
      <a href="news-detail.html?id=${article.id}" class="related-card">
        <img src="${article.image_url || 'images/news-placeholder.jpg'}" alt="${article.title}" loading="lazy">
        <div class="related-content">
          <h4>${article.title}</h4>
          <span class="related-date">${formatDate(article.published_at)}</span>
        </div>
      </a>
    `).join('');

  } catch (e) {
    console.error('Error loading related news:', e);
  }
}

window.shareArticle = function(title, url) {
  if (navigator.share) {
    navigator.share({ title, url });
  } else {
    navigator.clipboard.writeText(url);
    alert('تم نسخ الرابط!');
  }
};
