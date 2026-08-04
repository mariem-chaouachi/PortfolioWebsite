document.addEventListener("DOMContentLoaded", () => {
  const container = document.querySelector('.skills-bubble-container');
  let bubbles = Array.from(document.querySelectorAll('.bubble'));
  
  if (bubbles.length === 0) {
    bubbles = Array.from(document.querySelectorAll('[class*="b-left-"], [class*="b-right-"]'));
  }
  if (!container || bubbles.length === 0) return;

  // 1. Force container visibility settings immediately
  container.style.display = 'block';
  container.style.opacity = '1';
  container.style.visibility = 'visible';

  const screenWidth = window.innerWidth;
  const isMobile = screenWidth <= 768;

  // Responsive bubble count
  if (isMobile) {
    // Show 4 bubbles on mobile
    bubbles.forEach((el, index) => {
      if (index >= 4) el.style.setProperty('display', 'none', 'important');
      else            el.style.setProperty('display', 'flex', 'important');
    });
    bubbles = bubbles.slice(0, 4);
  } else if (screenWidth <= 1024) {
    bubbles.forEach((el, index) => {
      if (index >= 4) el.style.setProperty('display', 'none', 'important');
      else            el.style.setProperty('display', 'flex', 'important');
    });
    bubbles = bubbles.slice(0, 4);
  } else {
    bubbles.forEach(el => el.style.setProperty('display', 'flex', 'important'));
  }

  const bubbleData = [];
  const navbar = document.querySelector('nav') || document.querySelector('header');
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;
  const topBarrier = navbar && navbar.offsetHeight > 0 ? navbar.offsetHeight : 80;

  bubbles.forEach((el, index) => {
    el.style.animation   = 'none';
    el.style.transition  = 'none';
    el.style.position    = 'absolute';
    el.style.opacity     = '1';
    el.style.visibility  = 'visible';

    const vx = (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.3);
    const vy = (Math.random() > 0.5 ? 1 : -1) * (0.1 + Math.random() * 0.15);

    const estimatedWidth = el.textContent.length * 8 + 40;
    const bWidth  = Math.min(Math.max(estimatedWidth, 90), 160);
    const bHeight = 38;

    let x, y;
    const usable = viewH - topBarrier;

    if (isMobile) {
      // 2 bubbles top zone, 2 bubbles bottom zone
      // Spread horizontally across full width
      const isTop = index < 2;
      x = index % 2 === 0
        ? viewW * 0.05
        : viewW * 0.55 + Math.random() * (viewW * 0.35 - bWidth);
      y = isTop
        ? topBarrier + 10 + Math.random() * (usable * 0.15)
        : topBarrier + usable * 0.78 + Math.random() * (usable * 0.15);
    } else {
      // Desktop: left/right sides spread
      x = index % 2 === 0
        ? 20 + Math.random() * (viewW * 0.18)
        : (viewW * 0.78) + Math.random() * (viewW * 0.18 - bWidth);
      y = topBarrier + 20 + ((index / bubbles.length) * (usable - bHeight - 40));
    }

    bubbleData.push({ el, x, y, vx, vy, radius: bWidth / 2, width: bWidth, height: bHeight });
  });

  // 4. Physics loop
  function updatePhysics() {
    const currentW   = container.clientWidth  || window.innerWidth;
    const currentH   = container.clientHeight || window.innerHeight;
    const currentTop = navbar && navbar.offsetHeight > 0 ? navbar.offsetHeight : 80;

    // Invisible rectangle — adapts to screen size
    const isMobileNow = currentW <= 768;
    let boxW, boxH, boxLeft, boxTop;
    if (isMobileNow) {
      // Mobile: 2/3 width × 2/3 height, centered
      boxW    = currentW * (2 / 3);
      boxH    = (currentH - currentTop) * (2 / 3);
      boxLeft = (currentW - boxW) / 2;
      boxTop  = currentTop + (currentH - currentTop) / 6;
    } else if (currentW <= 1024) {
      // Tablet/iPad: 2/3 width × 2/3 height, centered
      boxW    = currentW * (2 / 3);
      boxH    = (currentH - currentTop) * (2 / 3);
      boxLeft = (currentW - boxW) / 2;
      boxTop  = currentTop + (currentH - currentTop) / 6;
    } else {
      // Desktop: 1/3 width × 2/3 height, centered
      boxW    = currentW / 3;
      boxH    = (currentH - currentTop) * (2 / 3);
      boxLeft = (currentW - boxW) / 2;
      boxTop  = currentTop + (currentH - currentTop) / 6;
    }
    const textRect = { left: boxLeft, right: boxLeft + boxW, top: boxTop, bottom: boxTop + boxH };

    bubbleData.forEach((b) => {
      b.x += b.vx;
      b.y += b.vy;

      // Wall bounces
      if (b.x <= 0)                       { b.x = 0;                  b.vx =  Math.abs(b.vx); }
      else if (b.x + b.width >= currentW)  { b.x = currentW - b.width; b.vx = -Math.abs(b.vx); }
      if (b.y <= currentTop)               { b.y = currentTop;          b.vy =  Math.abs(b.vy); }
      else if (b.y + b.height >= currentH) { b.y = currentH - b.height; b.vy = -Math.abs(b.vy); }

      // Text box collision
      const bRight  = b.x + b.width;
      const bBottom = b.y + b.height;
      const inside  =
        b.x     < textRect.right  &&
        bRight  > textRect.left   &&
        b.y     < textRect.bottom &&
        bBottom > textRect.top;

      if (inside) {
        const overlapL = bRight  - textRect.left;
        const overlapR = textRect.right  - b.x;
        const overlapT = bBottom - textRect.top;
        const overlapB = textRect.bottom - b.y;
        const minO = Math.min(overlapL, overlapR, overlapT, overlapB);
        if      (minO === overlapL) { b.x = textRect.left   - b.width; b.vx = -Math.abs(b.vx); }
        else if (minO === overlapR) { b.x = textRect.right;             b.vx =  Math.abs(b.vx); }
        else if (minO === overlapT) { b.y = textRect.top    - b.height; b.vy = -Math.abs(b.vy); }
        else                        { b.y = textRect.bottom;             b.vy =  Math.abs(b.vy); }
      }
    });

    // Bubble-to-bubble — only collide when edges actually touch
    for (let i = 0; i < bubbleData.length; i++) {
      for (let j = i + 1; j < bubbleData.length; j++) {
        const b1 = bubbleData[i];
        const b2 = bubbleData[j];
        const cx1 = b1.x + b1.width / 2, cy1 = b1.y + b1.height / 2;
        const cx2 = b2.x + b2.width / 2, cy2 = b2.y + b2.height / 2;
        const dx = cx2 - cx1, dy = cy2 - cy1;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = b1.width / 2 + b2.width / 2;
        if (dist < minDist && dist > 0) {
          const overlap = minDist - dist;
          const nx = dx / dist, ny = dy / dist;
          b1.x -= nx * (overlap / 2); b1.y -= ny * (overlap / 2);
          b2.x += nx * (overlap / 2); b2.y += ny * (overlap / 2);
          const dvx = b1.vx - b2.vx, dvy = b1.vy - b2.vy;
          const dot = dvx * nx + dvy * ny;
          b1.vx -= dot * nx; b1.vy -= dot * ny;
          b2.vx += dot * nx; b2.vy += dot * ny;
        }
      }
    }

    bubbleData.forEach((b) => {
      b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
    });

    requestAnimationFrame(updatePhysics);
  }

  requestAnimationFrame(updatePhysics);
});

/* ── Bubble skill tooltips ── */
const tooltip = document.getElementById('bubbleTooltip');
const btTitle = tooltip ? tooltip.querySelector('.bt-title') : null;
const btDesc  = tooltip ? tooltip.querySelector('.bt-desc')  : null;
let activeB = null;

function showTooltip(el, e) {
  if (!tooltip || !el.dataset.skill) return;
  btTitle.textContent = el.dataset.skill;
  btDesc.textContent  = el.dataset.desc;
  tooltip.classList.add('visible');
  positionTooltip(e);
}
function hideTooltip() {
  if (!tooltip) return;
  tooltip.classList.remove('visible');
}
function positionTooltip(e) {
  if (!tooltip) return;
  const tw = tooltip.offsetWidth  || 220;
  const th = tooltip.offsetHeight || 90;
  let x = e.clientX + 16;
  let y = e.clientY + 16;
  if (x + tw > window.innerWidth  - 10) x = e.clientX - tw - 16;
  if (y + th > window.innerHeight - 10) y = e.clientY - th - 16;
  tooltip.style.left = x + 'px';
  tooltip.style.top  = y + 'px';
}

document.querySelectorAll('.bubble[data-skill]').forEach(b => {
  b.addEventListener('mouseenter', (e) => showTooltip(b, e));
  b.addEventListener('mousemove',  (e) => positionTooltip(e));
  b.addEventListener('mouseleave', () => { if (activeB !== b) hideTooltip(); });
  b.addEventListener('click', (e) => {
    e.stopPropagation();
    if (activeB === b) {
      b.classList.remove('active'); hideTooltip(); activeB = null;
    } else {
      if (activeB) activeB.classList.remove('active');
      b.classList.add('active'); activeB = b; showTooltip(b, e);
    }
  });
});
document.addEventListener('click', () => {
  if (activeB) { activeB.classList.remove('active'); activeB = null; }
  hideTooltip();
});

// ── Hamburger menu ──
const hamburger  = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

hamburger.addEventListener('click', (e) => {
  e.stopPropagation();
  mobileMenu.classList.toggle('open');
});
document.addEventListener('click', (e) => {
  if (mobileMenu.classList.contains('open') && !mobileMenu.contains(e.target) && e.target !== hamburger) {
    mobileMenu.classList.remove('open');
  }
});
// ── Smooth scroll with nav offset for mobile menu links ──
document.querySelectorAll('.mob-link').forEach(link => {
  link.addEventListener('click', (e) => {
    e.preventDefault();
    mobileMenu.classList.remove('open');
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      const navHeight = document.querySelector('nav').offsetHeight;
      const top = target.getBoundingClientRect().top + window.scrollY - navHeight - 12;
      window.scrollTo({ top, behavior: 'smooth' });
    }
  });
});

// ── Scroll reveal ──
const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.08, rootMargin: "0px 0px -40px 0px" });
document.querySelectorAll('.reveal, .tli').forEach(el => observer.observe(el));

// ── Scroll spy — active nav link ──
const sections = document.querySelectorAll('section[id]');
const navLinks  = document.querySelectorAll('.nav-links a[href^="#"]');
const spyObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      navLinks.forEach(link => link.classList.remove('active'));
      const active = document.querySelector(`.nav-links a[href="#${entry.target.id}"]`);
      if (active) active.classList.add('active');
    }
  });
}, { threshold: 0.3, rootMargin: "-66px 0px -40% 0px" });
sections.forEach(s => spyObserver.observe(s));

// ── Timeline accordion ──
document.querySelectorAll('.tl-header').forEach(header => {
  header.addEventListener('click', () => {
    const tli    = header.closest('.tli');
    const isOpen = tli.classList.contains('open');
    document.querySelectorAll('.tli.open').forEach(el => el.classList.remove('open'));
    if (!isOpen) tli.classList.add('open');
  });
});

// ── Project filter with fade ──
document.querySelectorAll('.p-filter-btn').forEach(btn => {
  btn.addEventListener('click', (e) => {
    document.querySelectorAll('.p-filter-btn').forEach(b => b.classList.remove('active'));
    e.target.classList.add('active');
    const filter = e.target.getAttribute('data-filter');

    document.querySelectorAll('.pc').forEach(card => {
      card.style.transition = 'opacity 0.2s, transform 0.2s';
      card.style.opacity    = '0';
      card.style.transform  = 'translateY(8px)';
    });

    setTimeout(() => {
      document.querySelectorAll('.pc').forEach(card => {
        const show = filter === 'all' || card.getAttribute('data-category') === filter;
        card.style.display = show ? 'flex' : 'none';
      });
      requestAnimationFrame(() => {
        document.querySelectorAll('.pc').forEach(card => {
          if (card.style.display !== 'none') {
            card.style.opacity   = card.classList.contains('coming-soon') ? '0.55' : '1';
            card.style.transform = 'translateY(0)';
          }
        });
      });
    }, 200);
  });
});

// ── Custom cursor ──
const cursor = document.querySelector('.custom-cursor');
const dot    = document.querySelector('.custom-cursor-dot');

document.addEventListener('mousemove', (e) => {
  cursor.animate({ left: `${e.clientX}px`, top: `${e.clientY}px` }, { duration: 250, fill: "forwards" });
  dot.style.left = `${e.clientX}px`;
  dot.style.top  = `${e.clientY}px`;
});

document.querySelectorAll('a, button, .btn-p, .btn-o').forEach(el => {
  el.addEventListener('mouseenter', () => cursor.classList.add('hovered'));
  el.addEventListener('mouseleave', () => cursor.classList.remove('hovered'));
});




// Add loading class to freeze scrolling during loading state
document.body.classList.add('loading');

function dismissLoader() {
  const loader = document.getElementById('loader');
  if (loader && loader.style.opacity !== '0') {
    loader.style.opacity = '0';
    loader.style.visibility = 'hidden';
    document.body.classList.remove('loading');
  }
}

// 1. Dismiss exactly 1.5 seconds after DOM structures are built
document.addEventListener('DOMContentLoaded', () => {
  setTimeout(dismissLoader, 1500); 
});

// 2. Backup trigger if the DOM event already swept past
if (document.readyState === 'complete' || document.readyState === 'interactive') {
  setTimeout(dismissLoader, 1500);
}

// 3. Absolute catch-all safety parameter
window.addEventListener('load', () => {
  setTimeout(dismissLoader, 1500);
});