/**
 * menu.js
 * Handles mobile nav drawer:
 *   - Hamburger button toggles open/close
 *   - Tapping the overlay closes the menu
 *   - Tapping any nav link closes the menu
 *   - Pressing Escape closes the menu
 *   - Touching anywhere outside the drawer closes it
 */

(function () {

  const hamburger = document.getElementById('hamburger');
  const navLinks  = document.getElementById('nav-links');
  const overlay   = document.getElementById('nav-overlay');

  if (!hamburger || !navLinks) return;

  function openMenu() {
    navLinks.classList.add('open');
    hamburger.classList.add('open');
    hamburger.setAttribute('aria-expanded', 'true');
    if (overlay) overlay.classList.add('active');
    document.body.style.overflow = 'hidden'; // prevent background scroll
  }

  function closeMenu() {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    hamburger.setAttribute('aria-expanded', 'false');
    if (overlay) overlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  function isOpen() {
    return navLinks.classList.contains('open');
  }

  // ── Hamburger toggle ──
  hamburger.addEventListener('click', (e) => {
    e.stopPropagation();
    isOpen() ? closeMenu() : openMenu();
  });

  // ── Overlay tap / click ──
  if (overlay) {
    overlay.addEventListener('click', closeMenu);
    overlay.addEventListener('touchend', (e) => {
      e.preventDefault();
      closeMenu();
    }, { passive: false });
  }

  // ── Tapping any link inside the drawer closes it ──
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', closeMenu);
  });

  // ── Escape key ──
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && isOpen()) closeMenu();
  });

  // ── Touch outside the drawer on the document ──
  // Fires when a touch starts anywhere that isn't inside the nav or hamburger
  document.addEventListener('touchstart', (e) => {
    if (!isOpen()) return;
    const insideNav  = navLinks.contains(e.target);
    const insideBurger = hamburger.contains(e.target);
    if (!insideNav && !insideBurger) {
      closeMenu();
    }
  }, { passive: true });

})();
