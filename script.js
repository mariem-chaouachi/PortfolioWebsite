document.addEventListener("DOMContentLoaded", () => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Bind Mouse Glow for all Liquid Glass Containers
  if (!prefersReducedMotion) {
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
  }

  // Scroll Handler for AI Buddy + CV Widget Docking
  // Large ("hero style") at the very top of the page AND while the
  // Let's Connect section is in view; docked to the corners everywhere else.
  const aiBuddyContainer = document.getElementById('aiBuddyContainer');
  const cvWidgetContainer = document.getElementById('cvWidgetContainer');
  const contactSection = document.getElementById('contact');

  function updateWidgetDocking() {
    let large = window.scrollY <= 10;

    if (!large && contactSection) {
      const rect = contactSection.getBoundingClientRect();
      large = rect.top < window.innerHeight * 0.65 && rect.bottom > window.innerHeight * 0.15;
    }

    aiBuddyContainer.classList.toggle('docked-bottom-right', !large);
    cvWidgetContainer.classList.toggle('docked-bottom-left', !large);
  }

  window.addEventListener('scroll', updateWidgetDocking, { passive: true });
  window.addEventListener('resize', updateWidgetDocking);
  updateWidgetDocking();

  // AI Buddy: "under development" status toast
  const aiBuddyBtn = document.getElementById('aiBuddyBtn');
  const aiBuddyStatus = document.getElementById('aiBuddyStatus');
  let aiBuddyStatusTimer = null;

  aiBuddyBtn.addEventListener('click', () => {
    aiBuddyStatus.classList.add('show');
    clearTimeout(aiBuddyStatusTimer);
    aiBuddyStatusTimer = setTimeout(() => {
      aiBuddyStatus.classList.remove('show');
    }, 2800);
  });

  // CV Modal
  const cvWidgetBtn = document.getElementById('cvWidgetBtn');
  const cvModalOverlay = document.getElementById('cvModalOverlay');
  const cvModalCloseBtn = document.getElementById('cvModalCloseBtn');

  function openCvModal() {
    cvModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeCvModal() {
    cvModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  cvWidgetBtn.addEventListener('click', openCvModal);
  cvModalCloseBtn.addEventListener('click', closeCvModal);

  cvModalOverlay.addEventListener('click', (e) => {
    if (e.target === cvModalOverlay) closeCvModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cvModalOverlay.classList.contains('active')) {
      closeCvModal();
    }
  });

  // Skill Detail Modal
  const skillDetails = {
    'html-css': {
      name: 'HTML / CSS',
      icon: 'Skills/html.png',
      learned: "Learned by building and iterating on this portfolio site from scratch — structuring layouts, then refining them section by section.",
      used: "Used across this portfolio website and in NeuroBalance, a single-file HTML/CSS/JS game prototype.",
      certImage: 'certs/html-css.png'
    },
    'javascript': {
      name: 'JavaScript',
      icon: 'Skills/javascript.png',
      learned: "Picked up alongside HTML/CSS while adding interactivity to personal projects.",
      used: "Powers the interactive logic on this portfolio and NeuroBalance's neurochemistry simulation.",
      certImage: 'certs/javascript.png'
    },
    'typescript': {
      name: 'TypeScript',
      icon: 'Skills/typescript.png',
      learned: "Explored while working with typed front-end codebases for more reliable UI development.",
      used: "Applied in front-end experiments and component-based interfaces.",
      certImage: 'certs/typescript.png'
    },
    'python': {
      name: 'Python',
      icon: 'Skills/python.png',
      learned: "Learned through coursework and hands-on scripting for data processing.",
      used: "Built the stress-scoring layer for BioFarm, a wearable-connected hackathon project.",
      certImage: 'certs/python.png'
    },
    'cpp': {
      name: 'C / C++',
      icon: 'Skills/cpp.png',
      learned: "Learned through embedded systems coursework and Arduino development.",
      used: "Used to write firmware/sketches for sensor-based hardware prototypes like BioFarm.",
      certImage: 'certs/cpp.png'
    },
    'arduino': {
      name: 'Arduino',
      icon: 'Skills/arduino.png',
      learned: "Learned through hands-on hardware projects and biomedical engineering coursework.",
      used: "Used to connect a MAX30100 heart rate sensor for BioFarm, a hackathon wellness project.",
      certImage: 'certs/arduino.png'
    },
    'esp32': {
      name: 'ESP32',
      icon: 'Skills/esp32.png',
      learned: "Explored as a step up from Arduino for more connected, sensor-driven prototypes.",
      used: "Used in embedded prototyping alongside Arduino-based sensor projects.",
      certImage: 'certs/esp32.png'
    },
    'sensor': {
      name: 'MAX30100 Sensor',
      icon: 'Skills/sensor.png',
      learned: "Learned while integrating a heart rate sensor into a hardware prototype.",
      used: "Central to BioFarm — reads heart rate data to drive in-game stress scoring and breathing exercise triggers.",
      certImage: 'certs/sensor.png'
    },
    'circuit': {
      name: 'Circuit Design',
      icon: 'Skills/circuit.png',
      learned: "Developed through biomedical engineering coursework covering electronics and instrumentation.",
      used: "Applied in hardware prototyping for sensor-based projects.",
      certImage: 'certs/circuit.png'
    },
    'embedded': {
      name: 'Embedded Systems',
      icon: 'Skills/embedded.png',
      learned: "Learned through Arduino/ESP32 hardware projects and coursework.",
      used: "Used to bridge sensor hardware with software logic in BioFarm.",
      certImage: 'certs/embedded.png'
    },
    'unity': {
      name: 'Unity',
      icon: 'Skills/unity.png',
      learned: "Learned while building game prototypes around biomedical and health concepts.",
      used: "Built BioFarm's pixel-art farm game, and prototyped HormoneQuest in Unity.",
      certImage: 'certs/unity.png'
    },
    'react-native': {
      name: 'React Native',
      icon: 'Skills/react.png',
      learned: "Learned while building a cross-platform mobile app from the ground up.",
      used: "Built RadConnect's frontend — role-based views, real-time messaging, localization, and notifications.",
      certImage: 'certs/react-native.png'
    },
    'nodejs': {
      name: 'Node.js',
      icon: 'Skills/node.png',
      learned: "Learned while connecting a mobile frontend to a live backend service.",
      used: "Powers RadConnect's backend, built with Node.js and Express.",
      certImage: 'certs/nodejs.png'
    },
    'postgresql': {
      name: 'PostgreSQL',
      icon: 'Skills/postgresql.png',
      learned: "Learned while designing a relational schema for a real application.",
      used: "Used as RadConnect's database, hosted on Neon.",
      certImage: 'certs/postgresql.png'
    },
    'notion': {
      name: 'Notion',
      icon: 'Skills/notion.png',
      learned: "Adopted for organizing club initiatives and personal project planning.",
      used: "Used to plan and track projects for Club Biomed Innov and personal work.",
      certImage: 'certs/notion.png'
    },
    'imaging': {
      name: 'Medical Imaging',
      icon: 'Skills/imaging.png',
      learned: "Learned through an internship studying medical imaging equipment.",
      used: "Studied imaging systems sold by STIET, a Philips distributor in Tunisia, during an internship.",
      certImage: 'certs/imaging.png'
    },
    'biomedical': {
      name: 'Biomedical Devices',
      icon: 'Skills/biomedical.png',
      learned: "Core focus of biomedical engineering coursework at ISTMT.",
      used: "Applied across coursework, the STIET internship, and biomedical hackathon projects.",
      certImage: 'certs/biomedical.png'
    },
    'clinical': {
      name: 'Clinical Data',
      icon: 'Skills/clinical.png',
      learned: "Learned through coursework on lab analysis and diagnostic systems.",
      used: "Built a clinical diagnostic web tool for homeostasis/milieu intérieur analysis, covering sodium, acid-base, potassium, calcium, and renal function panels.",
      certImage: 'certs/clinical.png'
    },
    'healthcare': {
      name: 'Healthcare Innovation',
      icon: 'Skills/healthcare.png',
      learned: "Developed through biomedical engineering studies and club leadership.",
      used: "Drives project choices — from BioFarm to the homeostasis diagnostic tool — and club work as Head of External Relations at Club Biomed Innov.",
      certImage: 'certs/healthcare.png'
    },
    'english': {
      name: 'English',
      iconEmoji: '🇬🇧',
      learned: "Developed through years of academic study and regular use in technical work.",
      used: "Used for coursework, technical documentation, and this portfolio.",
      certImage: 'certs/english.png'
    },
    'french': {
      name: 'French',
      iconEmoji: '🇫🇷',
      learned: "Learned through Tunisia's bilingual education system.",
      used: "Used daily in academic and professional settings.",
      certImage: 'certs/french.png'
    },
    'arabic': {
      name: 'Arabic',
      iconEmoji: '🇹🇳',
      learned: "Native language.",
      used: "Used for everyday communication.",
      certImage: 'certs/arabic.png'
    }
  };

  const skillModalOverlay = document.getElementById('skillModalOverlay');
  const skillModalCloseBtn = document.getElementById('skillModalCloseBtn');
  const skillModalFilename = document.getElementById('skillModalFilename');
  const skillModalIcon = document.getElementById('skillModalIcon');
  const skillModalIconEmoji = document.getElementById('skillModalIconEmoji');
  const skillModalName = document.getElementById('skillModalName');
  const skillModalLearned = document.getElementById('skillModalLearned');
  const skillModalUsed = document.getElementById('skillModalUsed');
  const skillModalCertArea = document.getElementById('skillModalCertArea');

  function openSkillModal(slug) {
    const data = skillDetails[slug];
    if (!data) return;

    skillModalFilename.textContent = `${slug}.md`;
    skillModalName.textContent = data.name;
    skillModalLearned.textContent = data.learned;
    skillModalUsed.textContent = data.used;

    if (data.iconEmoji) {
      skillModalIcon.style.display = 'none';
      skillModalIconEmoji.style.display = 'flex';
      skillModalIconEmoji.textContent = data.iconEmoji;
    } else {
      skillModalIconEmoji.style.display = 'none';
      skillModalIcon.style.display = 'block';
      skillModalIcon.src = data.icon;
      skillModalIcon.alt = data.name;
    }

    skillModalCertArea.innerHTML = '';
    const certPath = data.certImage || `certs/${slug}.png`;
    const img = document.createElement('img');
    img.src = certPath;
    img.alt = `${data.name} certificate`;
    img.className = 'skill-cert-image';
    img.onerror = () => {
      img.remove();
    };
    skillModalCertArea.appendChild(img);

    skillModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeSkillModal() {
    skillModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.skill-chip[data-skill]').forEach((chip) => {
    chip.addEventListener('click', () => openSkillModal(chip.dataset.skill));
    chip.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openSkillModal(chip.dataset.skill);
      }
    });
  });

  skillModalCloseBtn.addEventListener('click', closeSkillModal);

  skillModalOverlay.addEventListener('click', (e) => {
    if (e.target === skillModalOverlay) closeSkillModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && skillModalOverlay.classList.contains('active')) {
      closeSkillModal();
    }
  });

  // Project Detail Modal
  const projectDetails = {
    'radconnect': {
      name: 'RadConnect',
      tag: 'Mobile App',
      description: "A React Native / Expo mobile app that streamlines communication between radiology technicians and radiologists, with role-based views, real-time messaging, and localization. Connected to a Node.js/Express backend on Neon PostgreSQL.",
      stack: ['React Native', 'Expo', 'Node.js', 'PostgreSQL'],
      videoSrc: 'videos/radconnect.mp4'
    },
    'homeostasis': {
      name: 'Homeostasis Diagnostic Tool',
      tag: 'Web Tool',
      description: "A clinical web tool for milieu intérieur analysis, covering sodium, acid-base, potassium, calcium, and renal function panels. Uses Claude's API to extract data directly from uploaded lab files.",
      stack: ['Web', 'Claude API', 'Clinical Data'],
      videoSrc: 'videos/homeostasis.mp4'
    },
    'biofarm': {
      name: 'BioFarm',
      tag: 'Hackathon',
      description: "A pixel-art Unity farm game connected to an Arduino MAX30100 heart-rate sensor, with a Python stress-scoring layer, guided breathing triggers, and a weekly wellness review for parents.",
      stack: ['Unity', 'Arduino', 'Python'],
      videoSrc: 'videos/biofarm.mp4'
    }
  };

  const projectModalOverlay = document.getElementById('projectModalOverlay');
  const projectModalCloseBtn = document.getElementById('projectModalCloseBtn');
  const projectModalFilename = document.getElementById('projectModalFilename');
  const projectModalTag = document.getElementById('projectModalTag');
  const projectModalName = document.getElementById('projectModalName');
  const projectModalDescription = document.getElementById('projectModalDescription');
  const projectModalStack = document.getElementById('projectModalStack');
  const projectModalVideo = document.getElementById('projectModalVideo');
  const projectModalVideoSource = document.getElementById('projectModalVideoSource');

  function openProjectModal(slug) {
    const data = projectDetails[slug];
    if (!data) return;

    projectModalFilename.textContent = `${slug}.md`;
    projectModalTag.textContent = data.tag;
    projectModalName.textContent = data.name;
    projectModalDescription.textContent = data.description;

    projectModalStack.innerHTML = '';
    data.stack.forEach((item) => {
      const span = document.createElement('span');
      span.textContent = item;
      projectModalStack.appendChild(span);
    });

    projectModalVideoSource.src = data.videoSrc || '';
    projectModalVideo.load();

    projectModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeProjectModal() {
    projectModalVideo.pause();
    projectModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.projects-list-item[data-project]').forEach((item) => {
    item.addEventListener('click', () => openProjectModal(item.dataset.project));
  });

  projectModalCloseBtn.addEventListener('click', closeProjectModal);

  projectModalOverlay.addEventListener('click', (e) => {
    if (e.target === projectModalOverlay) closeProjectModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && projectModalOverlay.classList.contains('active')) {
      closeProjectModal();
    }
  });

  // Experience / Leadership Detail Modal
  const experienceDetails = {
    'external-relations': {
      role: 'Head of External Relations',
      org: 'Club Biomed Innov · ISTMT',
      date: 'Present',
      description: "Leading outreach and partnerships for the biomedical innovation club, connecting student projects with industry professionals and academic collaborators.",
      certImage: 'certs/external-relations.png'
    },
    'stiet-internship': {
      role: 'Observation Internship',
      org: 'STIET — Philips Distributor, Tunisia',
      date: 'July 2026',
      description: "Studied and reported on medical imaging equipment across conventional & interventional radiology, CT, ultrasound, MRI, and nuclear medicine.",
      certImage: 'certs/stiet-internship.png'
    },
    'clinical-internship': {
      role: 'Clinical Internship',
      org: 'Clinique Zaghouan',
      date: 'Clinical Practice',
      description: "Observed clinical workflows and medical equipment in a hospital setting, building a practical understanding of patient care environments.",
      certImage: 'certs/clinical-internship.png'
    },
    'sponsorship': {
      role: 'External Relations & Sponsorship Manager',
      org: 'Biomed Innov Club',
      date: 'Present',
      description: "Building partnerships and securing sponsorships to support the club's biomedical engineering initiatives.",
      certImage: 'certs/sponsorship.png'
    },
    'notion-campus-leader': {
      role: 'Campus Leader',
      org: 'Notion',
      date: 'Present',
      description: "Representing Notion on campus, helping students and organizations adopt it for their workflows.",
      certImage: 'certs/notion-campus-leader.png'
    },
    'robotics-week': {
      role: 'Ambassador',
      org: 'National Robotics Week',
      date: '2026',
      description: "Promoting robotics engagement and outreach as part of National Robotics Week.",
      certImage: 'certs/robotics-week.png'
    },
    'mindhack': {
      role: 'Challenger',
      org: 'MindHack 1.0 Hackathon',
      date: 'MindHack 1.0',
      description: "Competed in MindHack 1.0, developing a project under hackathon time constraints.",
      certImage: 'certs/mindhack.png'
    }
  };

  const experienceModalOverlay = document.getElementById('experienceModalOverlay');
  const experienceModalCloseBtn = document.getElementById('experienceModalCloseBtn');
  const experienceModalFilename = document.getElementById('experienceModalFilename');
  const experienceModalRole = document.getElementById('experienceModalRole');
  const experienceModalOrg = document.getElementById('experienceModalOrg');
  const experienceModalDate = document.getElementById('experienceModalDate');
  const experienceModalDescription = document.getElementById('experienceModalDescription');
  const experienceModalCert = document.getElementById('experienceModalCert');

  function openExperienceModal(slug) {
    const data = experienceDetails[slug];
    if (!data) return;

    experienceModalFilename.textContent = `${slug}.md`;
    experienceModalRole.textContent = data.role;
    experienceModalOrg.textContent = data.org;
    experienceModalDate.textContent = data.date;
    experienceModalDescription.textContent = data.description;
    experienceModalCert.src = data.certImage;
    experienceModalCert.alt = `${data.role} certificate`;

    experienceModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeExperienceModal() {
    experienceModalOverlay.classList.remove('active');
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.experience-card[data-card]').forEach((card) => {
    card.addEventListener('click', () => openExperienceModal(card.dataset.card));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openExperienceModal(card.dataset.card);
      }
    });
  });

  experienceModalCloseBtn.addEventListener('click', closeExperienceModal);

  experienceModalOverlay.addEventListener('click', (e) => {
    if (e.target === experienceModalOverlay) closeExperienceModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && experienceModalOverlay.classList.contains('active')) {
      closeExperienceModal();
    }
  });

  // Nav Scroll-Spy
  const navLinks = document.querySelectorAll('.nav-links a[data-section]');
  const spySections = Array.from(navLinks)
    .map(link => document.getElementById(link.dataset.section))
    .filter(Boolean);

  if (spySections.length && 'IntersectionObserver' in window) {
    const spyObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          navLinks.forEach(link => {
            link.classList.toggle('active', link.dataset.section === entry.target.id);
          });
        }
      });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

    spySections.forEach(section => spyObserver.observe(section));
  }

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

    // Whichever card is currently "at rest" on top of the stack (the next
    // one due to animate away) is the one the user can actually see and
    // click — not just card 0.
    let activeCardIndex = -1;
    for (let i = 0; i < cards.length; i++) {
      if (progress <= i) {
        activeCardIndex = i;
        break;
      }
    }

    cards.forEach((card, index) => {
      const windowEl = card.querySelector(".terminal-window");
      const dockItem = dockItems[index];

      windowEl.style.transformOrigin = "bottom center";

      const initialWidth = windowEl.offsetWidth || 950;
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
        card.style.pointerEvents = index === activeCardIndex ? "auto" : "none";
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

  // Pinned Horizontal Gallery Scroll Handler
  // Reusable for both Experience and Leadership. `reverse: true` makes the
  // gallery reveal its cards in the opposite order/direction.
  function createGalleryScroller(sectionSelector, trackSelector, cardSelector, options = {}) {
    const section = document.querySelector(sectionSelector);
    const track = document.querySelector(trackSelector);
    const cardsNodeList = document.querySelectorAll(cardSelector);

    if (!section || !track || !cardsNodeList.length) {
      return () => {};
    }

    const cards = options.reverse
      ? Array.from(cardsNodeList).slice().reverse()
      : Array.from(cardsNodeList);

    function getCenteredTranslateX(card, screenWidth, cardWidth) {
      return (screenWidth / 2) - (cardWidth / 2) - card.offsetLeft;
    }

    return function update() {
      const rect = section.getBoundingClientRect();
      const sectionHeight = section.offsetHeight;
      const viewportHeight = window.innerHeight;

      const totalScrollable = sectionHeight - viewportHeight;
      const currentScroll = -rect.top;

      const screenWidth = window.innerWidth;
      const firstCard = cards[0];
      const midCard = cards[Math.min(1, cards.length - 1)];
      const lastCard = cards[cards.length - 1];

      const cardWidth = firstCard.offsetWidth || 700;

      const xFirst = getCenteredTranslateX(firstCard, screenWidth, cardWidth);
      const xMid = getCenteredTranslateX(midCard, screenWidth, cardWidth);
      const xLast = getCenteredTranslateX(lastCard, screenWidth, cardWidth);

      if (currentScroll <= 0) {
        track.style.transform = `translateX(${xFirst}px)`;
        return;
      }
      if (currentScroll >= totalScrollable || totalScrollable <= 0) {
        track.style.transform = `translateX(${xLast}px)`;
        return;
      }

      const rawProgress = currentScroll / totalScrollable;

      // Piecewise timeline: brief pause on card 1 (start), slide, brief pause
      // on card 2, slide, brief pause on the last card (end).
      const pauseWidth = 0.12;
      const transitionWidth = (1 - pauseWidth * 3) / 2;

      const z1End = pauseWidth;
      const z2End = z1End + transitionWidth;
      const z3End = z2End + pauseWidth;
      const z4End = z3End + transitionWidth;

      let x;
      if (rawProgress <= z1End) {
        x = xFirst;
      } else if (rawProgress <= z2End) {
        const p = (rawProgress - z1End) / transitionWidth;
        x = xFirst + (xMid - xFirst) * p;
      } else if (rawProgress <= z3End) {
        x = xMid;
      } else if (rawProgress <= z4End) {
        const p = (rawProgress - z3End) / transitionWidth;
        x = xMid + (xLast - xMid) * p;
      } else {
        x = xLast;
      }

      track.style.transform = `translateX(${x}px)`;
    };
  }

  const updateExperienceScroll = createGalleryScroller(
    ".experience-section", ".experience-gallery-track", ".experience-card:not(.leadership-card)"
  );
  const updateLeadershipScroll = createGalleryScroller(
    ".leadership-section", ".leadership-gallery-track", ".leadership-card",
    { reverse: true }
  );

  // Projects folder tabs (Main / Software / Hardware)
  const projectsTabs = document.querySelectorAll('.projects-tab');
  const projectRows = document.querySelectorAll('.project-row');

  projectsTabs.forEach((tab) => {
    tab.addEventListener('click', () => {
      const filter = tab.dataset.filter;

      projectsTabs.forEach((t) => {
        t.classList.toggle('active', t === tab);
        t.setAttribute('aria-selected', t === tab ? 'true' : 'false');
      });

      projectRows.forEach((row) => {
        const show = filter === 'main' || row.dataset.category === filter;
        row.style.display = show ? '' : 'none';
      });
    });
  });

  // "All" button — jumps to the permanent project list at the end of the section
  const projectsAllBtn = document.getElementById('projectsAllBtn');
  const projectsList = document.getElementById('projectsList');

  if (projectsAllBtn && projectsList) {
    projectsAllBtn.addEventListener('click', () => {
      projectsList.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
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
        updateLeadershipScroll();
        ticking = false;
      });
    },
    { passive: true }
  );

  window.addEventListener("resize", () => {
    updateTerminals();
    updateExperienceScroll();
    updateLeadershipScroll();
  });

  updateTerminals();
  updateExperienceScroll();
  updateLeadershipScroll();
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