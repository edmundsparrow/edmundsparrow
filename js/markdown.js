/**
 * Gnoke CMS — tiny markdown renderer and formatting helpers.
 * Shared by the article editor's live preview and the public article page.
 * Supports: # / ## headings, **bold**, *italic*, [text](url), - lists, paragraphs.
 */

function parseMarkdown(text) {
  if (!text || !text.trim()) {
    return '<p class="content-empty">Nothing here yet.</p>';
  }

  let html = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/^## (.+)$/gm, '<h2>$1</h2>')
    .replace(/^# (.+)$/gm, '<h2>$1</h2>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Images before links — image syntax is link syntax with a leading "!".
    .replace(/!\[(.*?)\]\((.+?)\)/g, '<img src="$2" alt="$1" class="content-image" loading="lazy">')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>')
    .replace(/^- (.+)$/gm, '<li>$1</li>')
    // dev.to embeds ({% embed url %}, {% youtube id %}, etc.) can't render
    // here — link back to the original post instead of showing raw syntax.
    .replace(/\{%\s*embed\s+(\S+?)\s*%\}/g, '<p><a href="$1" target="_blank" rel="noopener">↗ View embedded content on the original page</a></p>')
    .replace(/\{%[^%]*%\}/g, '');

  html = html.replace(/(<li>.*?<\/li>\n?)+/g, (match) => `<ul>${match}</ul>`);

  return html
    .split(/\n\n+/)
    .map((block) => {
      block = block.trim();
      if (!block) return '';
      if (block.startsWith('<h2>') || block.startsWith('<ul>')) return block;
      return '<p>' + block.replace(/\n/g, '<br>') + '</p>';
    })
    .join('\n');
}

function estimateReadTime(text) {
  const words = (text || '').trim().split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.ceil(words / 200));
}

function wordCount(text) {
  return (text || '').trim().split(/\s+/).filter(Boolean).length;
}

function formatDate(iso) {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}
