document.addEventListener("DOMContentLoaded", () => {
  // Bind Mouse Glow for all Liquid Glass Containers
  const glassElements = document.querySelectorAll('.liquid-glass-container');

  glassElements.forEach(element => {
    element.addEventListener('mousemove', (e) => {
      const rect = element.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      element.style.setProperty('--x', `${x}px`);
      element.style.setProperty('--y', `${y}px`);
    });
  });

  // Scroll Handler for AI Buddy Docking
  const aiBuddyContainer = document.getElementById('aiBuddyContainer');

  window.addEventListener('scroll', () => {
    if (window.scrollY > 10) {
      aiBuddyContainer.classList.add('docked-bottom-right');
    } else {
      aiBuddyContainer.classList.remove('docked-bottom-right');
    }
  });

  // 3D Flip Book Handler
  const book = document.getElementById('flipBook');
  const pages = [
    document.getElementById('page0'),
    document.getElementById('page1'),
    document.getElementById('page2')
  ];
  let currentPageIndex = 0;
  const totalPagePairs = pages.length;

  const prevBtn = document.getElementById('prevPageBtn');
  const nextBtn = document.getElementById('nextPageBtn');
  const pageIndicator = document.getElementById('pageIndicator');

  function updateBookPosition() {
    book.classList.remove('closed-front', 'open', 'closed-back');

    if (currentPageIndex === 0) {
      book.classList.add('closed-front');
    } else if (currentPageIndex === totalPagePairs) {
      book.classList.add('closed-back');
    } else {
      book.classList.add('open');
    }
  }

  function updateBook() {
    pages.forEach((page, index) => {
      if (index < currentPageIndex) {
        page.classList.add('flipped');
        page.style.zIndex = index + 1;
      } else {
        page.classList.remove('flipped');
        page.style.zIndex = totalPagePairs - index;
      }
    });

    updateBookPosition();

    if (currentPageIndex === 0) {
      pageIndicator.textContent = "Cover";
    } else if (currentPageIndex === totalPagePairs) {
      pageIndicator.textContent = "Back Cover";
    } else {
      pageIndicator.textContent = `Page ${currentPageIndex * 2 - 1} - ${currentPageIndex * 2}`;
    }

    prevBtn.disabled = currentPageIndex === 0;
    nextBtn.disabled = currentPageIndex === totalPagePairs;
  }

  nextBtn.addEventListener('click', () => {
    if (currentPageIndex < totalPagePairs) {
      currentPageIndex++;
      updateBook();
    }
  });

  prevBtn.addEventListener('click', () => {
    if (currentPageIndex > 0) {
      currentPageIndex--;
      updateBook();
    }
  });

  pages.forEach((page, idx) => {
    page.addEventListener('click', () => {
      if (idx === currentPageIndex) {
        currentPageIndex++;
        updateBook();
      } else if (idx === currentPageIndex - 1) {
        currentPageIndex--;
        updateBook();
      }
    });
  });

  updateBook();

  // Terminal Deck Scroll & Dock Animation
  const stage = document.querySelector(".terminal-scroll-stage");
  const stickyContainer = document.querySelector(".terminal-sticky");
  const cards = Array.from(document.querySelectorAll(".terminal-card"));

  if (!stage || !cards.length || !stickyContainer) return;

  const total = cards.length;

  const dock = document.createElement("div");
  dock.className = "terminal-dock";

  cards.forEach((card, index) => {
    const icon = document.createElement("div");
    icon.className = "terminal-dock-item";
    icon.textContent = `>_${index + 1}`;
    dock.appendChild(icon);
  });

  document.body.appendChild(dock);
  const dockItems = Array.from(dock.querySelectorAll(".terminal-dock-item"));

  cards.forEach((card, index) => {
    card.style.zIndex = String(100 - index);
  });

  function getProgress() {
    const rect = stage.getBoundingClientRect();
    const viewportHeight = window.innerHeight;
    const scrollDistance = stage.offsetHeight - viewportHeight;

    const inSection = rect.top <= 0 && rect.bottom >= viewportHeight;
    const scrollPosition = Math.min(Math.max(-rect.top, 0), scrollDistance);

    if (scrollDistance <= 0) return { progress: 0, inSection: false };

    const buffer = 0.35;
    const adjustedProgress = Math.max(0, (scrollPosition / scrollDistance) * (total + buffer) - buffer);

    return { progress: adjustedProgress, inSection };
  }

  function updateTerminals() {
    const { progress, inSection } = getProgress();

    if (inSection) {
      dock.classList.add("is-visible");
    } else {
      dock.classList.remove("is-visible");
    }

    cards.forEach((card, index) => {
      const windowEl = card.querySelector(".terminal-window");
      const dockItem = dockItems[index];

      windowEl.style.transformOrigin = "bottom center";

      const initialWidth = windowEl.offsetWidth || 795;
      const minScale = 1 / initialWidth;

      const initialDeckOffsetY = (cards.length - 1 - index) * 10;

      const currentTransform = windowEl.style.transform;
      windowEl.style.transform = "none";
      const baseRect = windowEl.getBoundingClientRect();
      windowEl.style.transform = currentTransform;

      const baseBottomY = baseRect.bottom;
      const baseCenterX = baseRect.left + baseRect.width / 2;

      const targetBottomY = window.innerHeight - 50;
      const dockRect = dockItem.getBoundingClientRect();
      const targetCenterX = dockRect.left + dockRect.width / 2;

      const deltaX = targetCenterX - baseCenterX;
      const deltaY = targetBottomY - baseBottomY;

      if (progress <= index) {
        windowEl.style.transform = `translate(0px, ${initialDeckOffsetY}px) scale(1)`;
        windowEl.style.opacity = "1";
        card.style.pointerEvents = index === 0 ? "auto" : "none";
        dockItem.classList.remove("minimized");
      } else if (progress > index && progress < index + 1) {
        const p = progress - index;
        const currentX = deltaX * p;
        const currentY = initialDeckOffsetY + (deltaY - initialDeckOffsetY) * p;
        const currentScale = 1 - p * (1 - minScale);

        windowEl.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentScale})`;
        card.style.pointerEvents = "none";

        if (p > 0.50) {
          const fadeP = Math.min(1, (p - 0.50) / 0.20);
          windowEl.style.opacity = String(Math.max(0, 1 - fadeP));
        } else {
          windowEl.style.opacity = "1";
        }

        if (p > 0.4) {
          dockItem.classList.add("minimized");
        } else {
          dockItem.classList.remove("minimized");
        }
      } else {
        windowEl.style.transform = `translate(${deltaX}px, ${deltaY}px) scale(${minScale})`;
        windowEl.style.opacity = "0";
        card.style.pointerEvents = "none";
        dockItem.classList.add("minimized");
      }
    });

    const activeIndex = Math.min(total - 1, Math.max(0, Math.floor(progress)));
    dockItems.forEach((icon, index) => {
      icon.classList.toggle("active", index === activeIndex);
    });
  }

  // Pinned Horizontal Experience Gallery Scroll Handler
  const expSection = document.querySelector(".experience-section");
  const expTrack = document.querySelector(".experience-gallery-track");
  const expCards = document.querySelectorAll(".experience-card");

  function updateExperienceScroll() {
    if (!expSection || !expTrack || !expCards.length) return;

    const rect = expSection.getBoundingClientRect();
    const sectionHeight = expSection.offsetHeight;
    const viewportHeight = window.innerHeight;

    const totalScrollable = sectionHeight - viewportHeight;
    const currentScroll = -rect.top;

    const screenWidth = window.innerWidth;
    const firstCard = expCards[0];
    const lastCard = expCards[expCards.length - 1];

    const cardWidth = firstCard.offsetWidth || 700;
    
    // Calculates exact offset to center the 1st card horizontally
    const initialCenterX = (screenWidth / 2) - (cardWidth / 2) - firstCard.offsetLeft;

    // Freeze ratio before horizontal sliding starts
    const freezeRatio = 0.15;

    if (currentScroll <= 0) {
      expTrack.style.transform = `translateX(${initialCenterX}px)`;
    } else if (currentScroll >= totalScrollable) {
      const lastCardOffsetLeft = lastCard.offsetLeft;
      const finalTranslateX = (screenWidth / 2) - (cardWidth / 2) - lastCardOffsetLeft;
      expTrack.style.transform = `translateX(${finalTranslateX}px)`;
    } else {
      const rawProgress = currentScroll / totalScrollable;

      if (rawProgress < freezeRatio) {
        expTrack.style.transform = `translateX(${initialCenterX}px)`;
      } else {
        const activeProgress = (rawProgress - freezeRatio) / (1 - freezeRatio);
        const lastCardOffsetLeft = lastCard.offsetLeft - firstCard.offsetLeft;

        const currentTranslateX = initialCenterX - (activeProgress * lastCardOffsetLeft);
        expTrack.style.transform = `translateX(${currentTranslateX}px)`;
      }
    }
  }

  let ticking = false;
  window.addEventListener(
    "scroll",
    () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateTerminals();
        updateExperienceScroll();
        ticking = false;
      });
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    updateTerminals();
    updateExperienceScroll();
  });

  updateTerminals();
  updateExperienceScroll();
});

document.querySelectorAll('.faq-item').forEach((item) => {
  item.addEventListener('click', () => {
    // Optional: Close all other open items
    document.querySelectorAll('.faq-item').forEach((otherItem) => {
      if (otherItem !== item) {
        otherItem.classList.remove('active');
      }
    });

    // Toggle current card
    item.classList.toggle('active');
  });
});