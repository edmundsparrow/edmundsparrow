/**
 * Gnoke CMS — public article page logic.
 * Reads a single post (by ?id=) from IndexedDB and renders it in full,
 * along with a couple of "more articles" links.
 */

document.getElementById('year').textContent = new Date().getFullYear();

async function renderArticle() {
  const root = document.getElementById('articleRoot');
  const id = new URLSearchParams(window.location.search).get('id');

  if (!id) {
    root.innerHTML = notFoundHTML();
    return;
  }

  try {
    let post = await GnokeDB.getPost(id);

    // Not cached locally yet? Give dev.to one chance to sync before giving up.
    if (!post) {
      await GnokeDevTo.sync();
      post = await GnokeDB.getPost(id);
    }

    if (!post || post.status !== 'published') {
      root.innerHTML = notFoundHTML();
      return;
    }

    const content = await GnokeDevTo.fetchFullContent(post);

    document.getElementById('pageTitle').textContent = `${post.title || 'Untitled Post'} — Gnoke CMS`;
    document.getElementById('breadcrumbTitle').textContent = post.title || 'Untitled Post';

    const tags = (post.tags || []).map((t) => `<span class="tag">${escapeHTML(t)}</span>`).join('');
    const image = post.imageUrl
      ? `<div class="featured-image-wrap"><img src="${escapeAttr(post.imageUrl)}" alt="${escapeAttr(post.title)}" class="featured-image"></div>`
      : '';

    root.innerHTML = `
      <header class="post-header">
        <div class="container">
          <div class="logo-header">
            <a href="index.html"><img src="assets/gnoke-mark.svg" alt="Gnoke CMS" width="40" height="40"></a>
            <span>Gnoke CMS</span>
          </div>
          <div class="post-tags">${tags}</div>
          <h1 class="post-title">${escapeHTML(post.title || 'Untitled Post')}</h1>
          <div class="post-meta">
            <span class="meta-item">📅 ${formatDate(post.updatedAt)}</span>
            <span class="meta-item">⏱️ ${estimateReadTime(content)} min read</span>
          </div>
        </div>
      </header>

      ${image}

      <main class="post-body">
        <div class="container-narrow">
          <article class="post-content">${parseMarkdown(content)}</article>

          <div class="post-actions">
            <a href="index.html" class="back-link">← Back to all posts</a>
          </div>
        </div>
      </main>

      <section class="related-section" id="relatedSection"></section>
    `;

    renderRelated(post.id);
  } catch (err) {
    console.error('Failed to load article:', err);
    root.innerHTML = `<p class="state-message error" style="padding:60px 0;">Could not load this article.</p>`;
  }
}

async function renderRelated(currentId) {
  const section = document.getElementById('relatedSection');
  const posts = await GnokeDB.getPublishedPosts();
  const others = posts.filter((p) => p.id !== currentId).slice(0, 3);

  if (others.length === 0) {
    section.remove();
    return;
  }

  section.innerHTML = `
    <div class="container-narrow">
      <h2 class="related-title">More Articles</h2>
      <div class="related-grid">
        ${others
          .map(
            (p) => `
          <a href="article.html?id=${encodeURIComponent(p.id)}" class="related-card">
            <img src="${escapeAttr(p.imageUrl || '')}" alt="${escapeAttr(p.title)}">
            <div class="related-card-content"><h3>${escapeHTML(p.title || 'Untitled Post')}</h3></div>
          </a>`
          )
          .join('')}
      </div>
    </div>
  `;
}

function notFoundHTML() {
  return `
    <div class="container-narrow">
      <p class="state-message" style="padding:60px 0;">
        This article couldn't be found — it may have been unpublished or removed.<br>
        <a href="index.html" class="back-link">← Back to all posts</a>
      </p>
    </div>
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

renderArticle();
