
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

  // 2. Responsive quantity filter purely in JavaScript
  if (screenWidth <= 768) {
    bubbles.forEach((el, index) => {
      if (index >= 3) el.style.setProperty('display', 'none', 'important');
      else el.style.setProperty('display', 'flex', 'important');
    });
    bubbles = bubbles.slice(0, 3);
  } else if (screenWidth > 768 && screenWidth <= 1024) {
    bubbles.forEach((el, index) => {
      if (index >= 4) el.style.setProperty('display', 'none', 'important');
      else el.style.setProperty('display', 'flex', 'important');
    });
    bubbles = bubbles.slice(0, 4);
  } else {
    bubbles.forEach(el => el.style.setProperty('display', 'flex', 'important'));
  }

  const bubbleData = [];
  const navbar = document.querySelector('nav') || document.querySelector('header');
  
  // Use guaranteed viewport math instead of unstable getBoundingClientRect bounds
  const viewW = window.innerWidth;
  const viewH = window.innerHeight;
  const topBarrier = navbar && navbar.offsetHeight > 0 ? navbar.offsetHeight : 80;

  // 3. Setup static fallback dimensions so initialization never relies on browser loading speed
  bubbles.forEach((el, index) => {
    el.style.animation = 'none';
    el.style.transition = 'none';
    el.style.position = 'absolute';
    el.style.opacity = '1';
    el.style.visibility = 'visible';

    // Gentle, low-angle vectors
    const vx = (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.3);
    const vy = (Math.random() > 0.5 ? 1 : -1) * (0.1 + Math.random() * 0.15);

    // Hardcoded safety approximations for bubble boundaries (avoids reading 0px)
    const estimatedWidth = el.textContent.length * 8 + 40; 
    const bWidth = Math.min(Math.max(estimatedWidth, 90), 160);
    const bHeight = 38;

    // Direct geometric positioning map
    let x;
    if (index % 2 === 0) {
      x = 20 + Math.random() * (viewW * 0.18);
    } else {
      x = (viewW * 0.78) + Math.random() * (viewW * 0.18 - bWidth);
    }

    const usableHeight = viewH - topBarrier - bHeight - 40;
    const y = topBarrier + 20 + ((index / bubbles.length) * usableHeight);

    bubbleData.push({
      el: el,
      x: x,
      y: y,
      vx: vx,
      vy: vy,
      radius: bWidth / 2,
      width: bWidth,
      height: bHeight
    });
  });

  // 4. Live update tracking calculations loop
  function updatePhysics() {
    // Dynamic fallback checking handles live browser windows resizing gracefully
    const currentW = container.clientWidth || window.innerWidth;
    const currentH = container.clientHeight || window.innerHeight;
    const currentTop = navbar && navbar.offsetHeight > 0 ? navbar.offsetHeight : 80;

    bubbleData.forEach((b) => {
      b.x += b.vx;
      b.y += b.vy;

      // Outer boundary limit checks
      if (b.x <= 0) { b.x = 0; b.vx *= -1; }
      else if (b.x + b.width >= currentW) { b.x = currentW - b.width; b.vx *= -1; }

      if (b.y <= currentTop) { b.y = currentTop; b.vy *= -1; }
      else if (b.y + b.height >= currentH) { b.y = currentH - b.height; b.vy *= -1; }
    });

    // Handle interconnected ball impacts
    for (let i = 0; i < bubbleData.length; i++) {
      for (let j = i + 1; j < bubbleData.length; j++) {
        const b1 = bubbleData[i];
        const b2 = bubbleData[j];

        const cx1 = b1.x + b1.radius;
        const cy1 = b1.y + b1.radius;
        const cx2 = b2.x + b2.radius;
        const cy2 = b2.y + b2.radius;

        const dx = cx2 - cx1;
        const dy = cy2 - cy1;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const minDist = b1.radius + b2.radius;

        if (distance < minDist) {
          const overlap = minDist - distance;
          const nx = dx / distance;
          const ny = dy / distance;

          b1.x -= nx * (overlap / 2);
          b1.y -= ny * (overlap / 2);
          b2.x += nx * (overlap / 2);
          b2.y += ny * (overlap / 2);

          const kx = b1.vx - b2.vx;
          const ky = b1.vy - b2.vy;
          const p = 2 * (nx * kx + ny * ky) / 2;

          b1.vx -= p * nx;
          b1.vy -= p * ny;
          b2.vx += p * nx;
          b2.vy += p * ny;
        }
      }
    }

    // Apply translations directly via accelerated translate3d matrices
    bubbleData.forEach((b) => {
      b.el.style.transform = `translate3d(${b.x}px, ${b.y}px, 0)`;
    });

    requestAnimationFrame(updatePhysics);
  }

  // Instantly execute loop without using timers or window delays
  requestAnimationFrame(updatePhysics);
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
document.querySelectorAll('.mob-link').forEach(link => {
  link.addEventListener('click', () => mobileMenu.classList.remove('open'));
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