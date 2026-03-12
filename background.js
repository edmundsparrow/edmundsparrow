/**
 * background.js
 * Injects a faint background image into the hero section of each page.
 *
 * Image naming convention (place files in an /images/ folder):
 *   index.html    → images/home.png  (or .jpg / .webp)
 *   gnoke.html    → images/gnoke.png
 *   services.html → images/services.png
 *   stack.html    → images/stack.png
 *   contact.html  → images/contact.png
 *   mission.html  → images/mission.png
 */

(function () {

  /* ── Page → image name map ── */
  const PAGE_IMAGES = {
    'index.html'    : 'home',
    ''              : 'home',
    'gnoke.html'    : 'gnoke',
    'services.html' : 'services',
    'stack.html'    : 'stack',
    'contact.html'  : 'contact',
    'mission.html'  : 'mission',
  };

  /* Extensions tried in order — png first */
  const EXTENSIONS = ['png', 'jpg', 'jpeg', 'webp'];

  /* ── Resolve current page key, case-insensitive ── */
  function getPageKey() {
    const file = window.location.pathname.split('/').pop() || '';
    return file.toLowerCase();
  }

  /* ── Apply image to a hero element ── */
  function applyHeroBackground(hero, imageName) {

    function tryNext(index) {
      if (index >= EXTENSIONS.length) return;

      const src = 'images/' + imageName + '.' + EXTENSIONS[index];
      const img = new Image();

      img.onload = function () {
        hero.style.backgroundImage    = "url('" + src + "')";
        hero.style.backgroundSize     = 'cover';
        hero.style.backgroundPosition = 'center';
        hero.style.backgroundRepeat   = 'no-repeat';
        hero.style.position           = 'relative';
        hero.classList.add('has-bg');

        /* Dark overlay so text stays readable */
        var overlay = hero.querySelector('.hero-bg-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'hero-bg-overlay';
          overlay.setAttribute('aria-hidden', 'true');
          hero.insertBefore(overlay, hero.firstChild);
        }

        overlay.style.position      = 'absolute';
        overlay.style.inset         = '0';
        overlay.style.background    = 'rgba(10, 20, 30, 0.62)';
        overlay.style.pointerEvents = 'none';
        overlay.style.zIndex        = '0';

        /* Lift hero children above the overlay */
        Array.from(hero.children).forEach(function (child) {
          if (!child.classList.contains('hero-bg-overlay')) {
            if (!child.style.position || child.style.position === 'static') {
              child.style.position = 'relative';
            }
            if (!child.style.zIndex) child.style.zIndex = '1';
          }
        });
      };

      img.onerror = function () { tryNext(index + 1); };
      img.src = src;
    }

    tryNext(0);
  }

  /* ── Init ── */
  function init() {
    var key = getPageKey();
    var imageName = PAGE_IMAGES[key];
    if (!imageName) return;

    /* Inner pages use .page-hero, home page uses .hero */
    var hero = document.querySelector('.page-hero') || document.querySelector('.hero');
    if (!hero) return;

    applyHeroBackground(hero, imageName);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
