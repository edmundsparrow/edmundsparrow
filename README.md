# Gnoke CMS

A lightweight, backend-free CMS. Posts are stored in the browser via
**IndexedDB** — no server, no database, no accounts. Perfect for
prototyping a publishing workflow before wiring up a real backend.

## Structure

```
gnoke-cms/
├── index.html            Public blog index (lists published posts)
├── article.html           Public single-article view (?id=...)
├── css/
│   └── site.css            Styles for the public-facing pages
├── js/
│   ├── db.js                Shared IndexedDB data layer (GnokeDB)
│   ├── devto-sync.js         Pulls published articles from dev.to into GnokeDB
│   ├── markdown.js           Shared markdown renderer + formatting helpers
│   ├── site.js                Blog index logic
│   └── article.js             Article page logic
└── admin/
    ├── index.html          Admin dashboard (search, filter, edit, delete)
    ├── editor.html          Post editor with live preview
    ├── css/
    │   └── admin.css          Styles for the admin panel
    └── js/
        ├── dashboard.js        Dashboard logic
        └── editor.js            Editor logic
```

`js/db.js` is the single source of truth for reading/writing posts. Both
the public site and the admin panel load it, so as long as they're served
from the same origin they share the same local database
(`GnokeCMSDB` → object store `posts`).

## Running it

Since it's all static files, any static server works:

```bash
npx serve .
# or
python3 -m http.server
```

Then open `index.html` for the public site and `admin/index.html` for
the admin panel.

> Opening the files directly via `file://` also mostly works, but some
> browsers restrict IndexedDB on `file://` — a local server is more
> reliable.

## Data model

Each post is a plain object:

```js
{
  id: 'uuid-or-slug',
  title: 'Post title',
  tags: ['Tag One', 'Tag Two'],
  imageUrl: 'https://...',
  excerpt: 'Short summary for the listing page',
  content: 'Markdown-ish body text',
  status: 'draft' | 'published',
  updatedAt: '2026-08-24T12:00:00.000Z'
}
```

Only posts with `status: 'published'` show up on the public site.

## dev.to sync

`js/devto-sync.js` replaces the old hardcoded demo posts. On every load of
`index.html` or `article.html`, it pulls the published articles for the
account set in `DEVTO_USERNAME` (currently `edmundsparrow`) from the public
dev.to API and mirrors them into GnokeDB as regular posts — the rest of the
CMS (site, article page, admin dashboard/editor) doesn't know or care that
the content originated on dev.to.

- **List page** (`index.html`) uses the lightweight `/api/articles` list
  endpoint: title, tags, cover image, excerpt, publish date. Cheap, one
  request for the whole account.
- **Article page** (`article.html`) fetches the full post body
  (`body_markdown`) from `/api/articles/{username}/{slug}` the first time
  someone opens it, then caches it into IndexedDB so it isn't re-fetched on
  every visit.
- **Cover images and any images embedded in the post body** come through
  as plain `https://` URLs already hosted on dev.to's own CDN, so they just
  work as `<img>` tags — no extra handling needed. `js/markdown.js` now
  also supports `![alt](url)` image syntax so inline images in the article
  body render, not just the cover image.
- **dev.to embeds** (YouTube, tweets, CodePen, etc., via `{% embed %}`
  Liquid tags) can't be rendered by this CMS's minimal markdown parser —
  they're swapped for a "View embedded content on the original page" link
  instead of showing raw syntax.
- **Offline / dev.to unreachable:** sync fails quietly and whatever was
  cached in IndexedDB from the last successful sync keeps showing — no
  demo content reappears as a fallback.
- To point this at a different account, change `USERNAME` at the top of
  `js/devto-sync.js`.

## Notes / next steps

- **Data is per-browser.** Because there's no backend, anything drafted
  in the admin panel (as opposed to synced from dev.to) is only visible on
  that same browser/device. To make posts visible to real visitors, swap
  `js/db.js` for calls to a real API (the function signatures —
  `getPublishedPosts`, `getPost`, `savePost`, `deletePost` — are designed
  to be a drop-in replacement).
- Branding: `assets/gnoke-mark.svg` is the app icon/favicon/logo, used
  everywhere via `<img>` or `<link rel="icon">` — swap that one file to
  re-skin the whole app for a client. Social links and other contact
  details are still left for you to fill in.
