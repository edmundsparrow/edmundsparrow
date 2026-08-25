/**
 * Gnoke CMS — dev.to sync layer.
 *
 * Replaces the old hardcoded DEMO_POSTS. On load, the public site pulls
 * the account's published articles from the public dev.to API and mirrors
 * them into GnokeDB (IndexedDB) as regular posts — so site.js, article.js,
 * and the admin dashboard/editor all keep working unmodified against
 * GnokeDB, unaware the content originated on dev.to.
 *
 * Two dev.to endpoints are used:
 *  - GET /api/articles?username=...   → list (title, tags, cover image,
 *    excerpt, published date). Cheap, used to populate the index page.
 *  - GET /api/articles/{username}/{slug} → single article, including
 *    body_markdown (the full post). Fetched lazily, only when someone
 *    actually opens that article, and then cached into IndexedDB so it
 *    isn't re-fetched on every visit.
 *
 * If dev.to is unreachable (offline, CORS hiccup, rate limit), sync()
 * fails quietly and whatever was cached in IndexedDB from the last
 * successful sync is shown instead — no demo content, no hard error.
 */
const GnokeDevTo = (() => {
  const USERNAME = 'edmundsparrow';
  const LIST_URL = `https://dev.to/api/articles?username=${USERNAME}&per_page=100`;
  const articleUrl = (username, slug) => `https://dev.to/api/articles/${username}/${slug}`;

  function mapListItem(a) {
    return {
      id: `devto-${a.id}`,
      title: a.title || 'Untitled Post',
      tags: a.tag_list || [],
      // Only ever use a genuine custom cover. dev.to's `social_image` is an
      // auto-generated fallback for posts with no cover set — it has the
      // title, author avatar, name, and the DEV logo baked into the image
      // pixels at dev.to's own font size. Using it as a card photo made it
      // look like every such post had two different-sized titles stacked
      // (one real, one a picture of text). No cover_image → show our own
      // clean placeholder instead, same as any other post without a photo.
      imageUrl: a.cover_image || '',
      excerpt: a.description || '',
      content: '', // filled in lazily by fetchFullContent()
      status: 'published',
      updatedAt: a.edited_at || a.published_at || new Date().toISOString(),
      readingTime: a.reading_time_minutes || null,
      devto: { slug: a.slug, username: (a.user && a.user.username) || USERNAME, url: a.url },
    };
  }

  /** Pulls the article list from dev.to and mirrors it into GnokeDB. Returns true on success. */
  async function sync() {
    try {
      const res = await fetch(LIST_URL);
      if (!res.ok) throw new Error(`dev.to list request failed (${res.status})`);
      const articles = await res.json();
      if (!Array.isArray(articles)) throw new Error('unexpected dev.to response shape');

      const existing = await GnokeDB.getAllPosts();
      const existingById = new Map(existing.map((p) => [p.id, p]));

      for (const a of articles) {
        const mapped = mapListItem(a);
        const prev = existingById.get(mapped.id);
        // Preserve any full body already cached from a previous visit so
        // article pages don't re-fetch it every single sync.
        if (prev && prev.content) mapped.content = prev.content;
        await GnokeDB.savePost(mapped);
      }
      return true;
    } catch (err) {
      console.warn('Gnoke CMS: dev.to sync failed, falling back to cached posts.', err);
      return false;
    }
  }

  /** Lazily loads and caches the full markdown body for a dev.to-sourced post. */
  async function fetchFullContent(post) {
    if (!post || !post.devto) return (post && post.content) || '';
    if (post.content && post.content.trim()) return post.content;

    try {
      const res = await fetch(articleUrl(post.devto.username, post.devto.slug));
      if (!res.ok) throw new Error(`dev.to article request failed (${res.status})`);
      const full = await res.json();
      const content = full.body_markdown || full.description || '';
      post.content = content;
      await GnokeDB.savePost(post);
      return content;
    } catch (err) {
      console.warn('Gnoke CMS: could not load full article body from dev.to.', err);
      return post.excerpt || '';
    }
  }

  return { sync, fetchFullContent, USERNAME };
})();
