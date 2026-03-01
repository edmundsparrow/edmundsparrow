/**
 * background.js
 * Automatically injects a faint background image into the .page-hero
 * section of each page based on the current page filename.
 *
 * Image naming convention:
 *   index.html    → images/home.jpg
 *   gnoke.html    → images/gnoke.jpg
 *   services.html → images/services.jpg
 *   stack.html    → images/stack.jpg
 *   contact.html  → images/contact.jpg
 *
 * Just drop your images in an /images/ folder next to the HTML files.
 */

(function () {
  // Map page filenames to image names
  const PAGE_IMAGES = {
    'index.html'    : 'home',
    ''              : 'home',       // handles root /
    'gnoke.html'    : 'gnoke',
    'services.html' : 'services',
    'stack.html'    : 'stack',
    'contact.html'  : 'contact',
  };

  // How faint the image appears (0 = invisible, 1 = full)
  const OPACITY = 0.10;

  // Supported extensions to try in order
  const EXTENSIONS = ['jpg', 'jpeg', 'webp', 'png'];

  function getPageKey() {
    const path = window.location.pathname;
    const file = path.split('/').pop() || '';
    return file;
  }

  function applyHeroBackground(hero, imageName) {
    // Try each extension until one loads
    let tried = 0;

    function tryNext(index) {
      if (index >= EXTENSIONS.length) return; // none worked, leave as-is

      const src = `images/${imageName}.${EXTENSIONS[index]}`;
      const img = new Image();

      img.onload = () => {
        hero.style.backgroundImage    = `url('${src}')`;
        hero.style.backgroundSize     = 'cover';
        hero.style.backgroundPosition = 'center';
        hero.style.backgroundRepeat   = 'no-repeat';
        hero.style.position           = 'relative';
        hero.classList.add('has-bg');

        // Dark overlay so text sits bold and clear on top of the image
        let overlay = hero.querySelector('.hero-bg-overlay');
        if (!overlay) {
          overlay = document.createElement('div');
          overlay.className = 'hero-bg-overlay';
          overlay.setAttribute('aria-hidden', 'true');
          hero.insertBefore(overlay, hero.firstChild);
        }

        Object.assign(overlay.style, {
          position        : 'absolute',
          inset           : '0',
          background      : 'rgba(10, 20, 30, 0.58)',
          pointerEvents   : 'none',
          zIndex          : '0',
        });

        // Make sure hero content sits above the overlay
        Array.from(hero.children).forEach(child => {
          if (!child.classList.contains('hero-bg-overlay')) {
            if (!child.style.position || child.style.position === 'static') {
              child.style.position = 'relative';
            }
            if (!child.style.zIndex) {
              child.style.zIndex = '1';
            }
          }
        });
      };

      img.onerror = () => tryNext(index + 1);
      img.src = src;
    }

    tryNext(0);
  }

  function init() {
    const hero = document.querySelector('.page-hero');
    if (!hero) return; // home page has .hero not .page-hero — skip

    const key       = getPageKey();
    const imageName = PAGE_IMAGES[key];
    if (!imageName) return;

    applyHeroBackground(hero, imageName);
  }

  // Run after DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
