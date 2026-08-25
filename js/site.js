/**
 * Gnoke CMS — public blog index page logic.
 * Reads published posts from IndexedDB (via GnokeDB) and renders them as cards,
 * paginated in batches with a "Load more" button.
 */

document.getElementById('year').textContent = new Date().getFullYear();

const PAGE_SIZE = 6;
let allPosts = [];
let shownCount = 0;

async function renderPosts() {
  const grid = document.getElementById('postsGrid');

  try {
    await GnokeDevTo.sync();
    allPosts = await GnokeDB.getPublishedPosts();

    if (allPosts.length === 0) {
      grid.innerHTML = '<p class="state-message">No posts published yet. Check back soon.</p>';
      return;
    }

    grid.innerHTML = '';
    shownCount = 0;
    showNextPage();
  } catch (err) {
    console.error('Failed to load posts:', err);
    grid.innerHTML = '<p class="state-message error">Could not load posts. Please refresh the page.</p>';
  }
}

function showNextPage() {
  const grid = document.getElementById('postsGrid');
  const nextBatch = allPosts.slice(shownCount, shownCount + PAGE_SIZE);

  grid.insertAdjacentHTML('beforeend', nextBatch.map(postCardHTML).join(''));
  shownCount += nextBatch.length;

  renderLoadMoreControl();
}

function renderLoadMoreControl() {
  let wrap = document.getElementById('loadMoreWrap');
  if (wrap) wrap.remove();

  if (shownCount >= allPosts.length) return; // everything's shown, nothing to add

  wrap = document.createElement('div');
  wrap.id = 'loadMoreWrap';
  wrap.className = 'load-more';
  wrap.innerHTML = `<button class="load-more-btn" id="loadMoreBtn">Load More Articles</button>`;
  document.getElementById('postsGrid').insertAdjacentElement('afterend', wrap);

  document.getElementById('loadMoreBtn').addEventListener('click', showNextPage);
}

function postCardHTML(post) {
  const tags = (post.tags || [])
    .map((t) => `<span class="post-card-tag">${escapeHTML(t)}</span>`)
    .join('');

  const image = post.imageUrl
    ? `<img src="${escapeAttr(post.imageUrl)}" alt="${escapeAttr(post.title)}" class="post-card-image">`
    : `<div class="post-card-image" style="display:flex;align-items:center;justify-content:center;color:#94a3b8;">No image</div>`;

  return `
    <a href="article.html?id=${encodeURIComponent(post.id)}" class="post-card">
      ${image}
      <div class="post-card-content">
        <div class="post-card-tags">${tags}</div>
        <h3 class="post-card-title">${escapeHTML(post.title || 'Untitled Post')}</h3>
        <p class="post-card-excerpt">${escapeHTML(post.excerpt || '')}</p>
        <div class="post-card-meta">
          <span>📅 ${formatDate(post.updatedAt)}</span>
          <span>⏱️ ${post.readingTime || estimateReadTime(post.content)} min read</span>
        </div>
      </div>
    </a>
  `;
}

function escapeHTML(str) {
  const div = document.createElement('div');
  div.textContent = str || '';
  return div.innerHTML;
}

function escapeAttr(str) {
  return (str || '').replace(/"/g, '&quot;');
}

renderPosts();
