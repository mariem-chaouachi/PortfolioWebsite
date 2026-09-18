// ---- Language (EN/FR) ----
const I18N = (function initI18N() {
  const STORAGE_KEY = 'siteLang';
  let lang = 'en';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored === 'fr' || stored === 'en') lang = stored;
  } catch (e) { /* localStorage unavailable — default to English */ }

  function get() {
    return lang;
  }

  function set(newLang) {
    lang = newLang === 'fr' ? 'fr' : 'en';
    try { localStorage.setItem(STORAGE_KEY, lang); } catch (e) { /* ignore */ }
    apply();
    document.dispatchEvent(new CustomEvent('languagechange', { detail: { lang } }));
  }

  // Swaps every translatable node's visible text/markup/attributes to
  // match the current language. Called on load and whenever the toggle
  // is pressed.
  function apply() {
    document.documentElement.setAttribute('lang', lang);

    // Plain text nodes: data-en / data-fr → textContent
    document.querySelectorAll('[data-en]').forEach((el) => {
      const value = lang === 'fr' ? el.dataset.fr : el.dataset.en;
      if (value !== undefined) el.textContent = value;
    });

    // Nodes needing inner markup preserved (e.g. a nested <em>/<span>):
    // data-en-html / data-fr-html → innerHTML
    document.querySelectorAll('[data-en-html]').forEach((el) => {
      const value = lang === 'fr' ? el.dataset.frHtml : el.dataset.enHtml;
      if (value !== undefined) el.innerHTML = value;
    });

    // aria-label translations
    document.querySelectorAll('[data-en-aria]').forEach((el) => {
      const value = lang === 'fr' ? el.dataset.frAria : el.dataset.enAria;
      if (value !== undefined) el.setAttribute('aria-label', value);
    });

    // Bee speech-bubble messages: data-bee-msg holds the live value the
    // bee script reads; data-bee-msg-fr holds the French swap. English
    // is captured into data-bee-msg-en the first time apply() runs so
    // switching back to English later doesn't need its own attribute in
    // the HTML.
    document.querySelectorAll('[data-bee-msg]').forEach((el) => {
      if (el.dataset.beeMsgEn === undefined) {
        el.dataset.beeMsgEn = el.getAttribute('data-bee-msg');
      }
      const fr = el.dataset.beeMsgFr;
      el.setAttribute('data-bee-msg', lang === 'fr' && fr ? fr : el.dataset.beeMsgEn);
    });
  }

  return { get, set, apply };
})();

document.addEventListener("DOMContentLoaded", () => {
  I18N.apply();
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobileMediaQuery = window.matchMedia('(max-width: 900px)');

  // ---- Loading screen: wait for the hero background image ----
  (function initLoadingScreen() {
    const loadingScreen = document.getElementById('loadingScreen');
    if (!loadingScreen) return;
    const fill = document.getElementById('loadingBarFill');

    document.body.classList.add('is-loading');

    let progress = 0;
    let tick = null;
    if (!prefersReducedMotion) {
      // Purely cosmetic progress creep while we wait — not tied to real
      // download progress (the browser doesn't expose that for a plain
      // background-image), just enough motion to read as "loading"
      // rather than frozen.
      tick = setInterval(() => {
        progress = Math.min(progress + Math.random() * 18, 90);
        if (fill) fill.style.width = `${progress}%`;
      }, 150);
    }

    let finished = false;
    function finish() {
      if (finished) return;
      finished = true;
      if (tick) clearInterval(tick);
      if (fill) fill.style.width = '100%';
      setTimeout(() => {
        loadingScreen.classList.add('loaded');
        document.body.classList.remove('is-loading');
      }, prefersReducedMotion ? 0 : 200);
    }

    const heroImg = new Image();
    heroImg.onload = finish;
    heroImg.onerror = finish; // don't get stuck if the image fails to load
    heroImg.src = 'assets/images/hero-background.png';

    // Safety net: never block the site for more than ~6s even if the
    // image is unusually slow or the load/error events never fire.
    setTimeout(finish, 6000);
  })();
  function isMobileLayout() {
    return mobileMediaQuery.matches;
  }

  // ---- Language toggle button ----
  const langToggleBtn = document.getElementById('langToggleBtn');
  const langToggleLabel = document.getElementById('langToggleLabel');
  if (langToggleBtn) {
    const syncLangBtn = () => {
      const current = I18N.get();
      // Button shows the language you'd switch TO, not the current one.
      langToggleLabel.textContent = current === 'fr' ? 'EN' : 'FR';
      langToggleBtn.setAttribute('aria-label', current === 'fr' ? 'Switch to English' : 'Switch to French');
    };
    syncLangBtn();
    langToggleBtn.addEventListener('click', () => {
      I18N.set(I18N.get() === 'fr' ? 'en' : 'fr');
      syncLangBtn();
    });
  }

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

  // Scroll Handler for CV Widget Docking
  // Large ("hero style") at the very top of the page AND while the
  // Let's Connect section is in view; docked to the corner everywhere else.
  const cvWidgetContainer = document.getElementById('cvWidgetContainer');
  const contactSection = document.getElementById('contact');

  function updateWidgetDocking() {
    let large = window.scrollY <= 10;

    if (!large && contactSection) {
      const rect = contactSection.getBoundingClientRect();
      large = rect.top < window.innerHeight * 0.65 && rect.bottom > window.innerHeight * 0.15;
    }

    // Extra "pop" — bigger than even the normal large state — tied
    // specifically to the BOTTOM edge of Let's Connect scrolling into
    // view (i.e. you've scrolled through the whole section), not just
    // "near the bottom of the page". Contact is a short section, so
    // those two used to fire at nearly the same scroll position, which
    // read as popping right at the section's start instead of its end.
    let atSectionEnd = false;
    if (contactSection) {
      const rect = contactSection.getBoundingClientRect();
      atSectionEnd = rect.bottom <= window.innerHeight + 4;
    }

    cvWidgetContainer.classList.toggle('docked-bottom-right', !large && !atSectionEnd);
    cvWidgetContainer.classList.toggle('cv-widget-pop', atSectionEnd);
  }

  window.addEventListener('scroll', updateWidgetDocking, { passive: true });
  window.addEventListener('resize', updateWidgetDocking);
  updateWidgetDocking();

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
      icon: 'assets/icons/skills/html.png',
      learned: "Learned by building and iterating on this portfolio site from scratch, structuring layouts, then refining them section by section.",
      used: "Used across this portfolio website and in NeuroBalance, a single-file HTML/CSS/JS game prototype.",
      certImage: 'assets/certs/skills/html-css.png'
    },
    'javascript': {
      name: 'JavaScript',
      icon: 'assets/icons/skills/javascript.png',
      learned: "Picked up alongside HTML/CSS while adding interactivity to personal projects.",
      used: "Powers the interactive logic on this portfolio and NeuroBalance's neurochemistry simulation.",
      certImage: 'assets/certs/skills/javascript.png'
    },
    'typescript': {
      name: 'TypeScript',
      icon: 'assets/icons/skills/typescript.png',
      learned: "Explored while working with typed front-end codebases for more reliable UI development.",
      used: "Applied in front-end experiments and component-based interfaces.",
      certImage: 'assets/certs/skills/typescript.png'
    },
    'python': {
      name: 'Python',
      icon: 'assets/icons/skills/python.png',
      learned: "Learned through coursework and hands-on scripting for data processing.",
      used: "Built the stress-scoring layer for BioFarm, a wearable-connected hackathon project.",
      certImage: 'assets/certs/skills/python.png'
    },
    'cpp': {
      name: 'C / C++',
      icon: 'assets/icons/skills/cpp.png',
      learned: "Learned through embedded systems coursework and Arduino development.",
      used: "Used to write firmware/sketches for sensor-based hardware prototypes like BioFarm.",
      certImage: 'assets/certs/skills/cpp.png'
    },
    'arduino': {
      name: 'Arduino',
      icon: 'assets/icons/skills/arduino.png',
      learned: "Learned through hands-on hardware projects and biomedical engineering coursework.",
      used: "Used to connect a MAX30100 heart rate sensor for BioFarm, a hackathon wellness project.",
      certImage: 'assets/certs/skills/arduino.png'
    },
    'esp32': {
      name: 'ESP32',
      icon: 'assets/icons/skills/esp32.png',
      learned: "Explored as a step up from Arduino for more connected, sensor-driven prototypes.",
      used: "Used in embedded prototyping alongside Arduino-based sensor projects.",
      certImage: 'assets/certs/skills/esp32.png'
    },
    'sensor': {
      name: 'MAX30100 Sensor',
      icon: 'assets/icons/skills/sensor.png',
      learned: "Learned while integrating a heart rate sensor into a hardware prototype.",
      used: "Central to BioFarm, reading heart rate data to drive in-game stress scoring and breathing exercise triggers.",
      certImage: 'assets/certs/skills/sensor.png'
    },
    'circuit': {
      name: 'Circuit Design',
      icon: 'assets/icons/skills/circuit.png',
      learned: "Developed through biomedical engineering coursework covering electronics and instrumentation.",
      used: "Applied in hardware prototyping for sensor-based projects.",
      certImage: 'assets/certs/skills/circuit.png'
    },
    'embedded': {
      name: 'Embedded Systems',
      icon: 'assets/icons/skills/embedded.png',
      learned: "Learned through Arduino/ESP32 hardware projects and coursework.",
      used: "Used to bridge sensor hardware with software logic in BioFarm.",
      certImage: 'assets/certs/skills/embedded.png'
    },
    'unity': {
      name: 'Unity',
      icon: 'assets/icons/skills/unity.png',
      learned: "Learned while building game prototypes around biomedical and health concepts.",
      used: "Built BioFarm's pixel-art farm game, and prototyped HormoneQuest in Unity.",
      certImage: 'assets/certs/skills/unity.png'
    },
    'react-native': {
      name: 'React Native',
      icon: 'assets/icons/skills/react.png',
      learned: "Learned while building a cross-platform mobile app from the ground up.",
      used: "Built RadConnect's frontend: role-based views, real-time messaging, localization, and notifications.",
      certImage: 'assets/certs/skills/react-native.png'
    },
    'nodejs': {
      name: 'Node.js',
      icon: 'assets/icons/skills/node.png',
      learned: "Learned while connecting a mobile frontend to a live backend service.",
      used: "Powers RadConnect's backend, built with Node.js and Express.",
      certImage: 'assets/certs/skills/nodejs.png'
    },
    'postgresql': {
      name: 'PostgreSQL',
      icon: 'assets/icons/skills/postgresql.png',
      learned: "Learned while designing a relational schema for a real application.",
      used: "Used as RadConnect's database, hosted on Neon.",
      certImage: 'assets/certs/skills/postgresql.png'
    },
    'notion': {
      name: 'Notion',
      icon: 'assets/icons/skills/notion.png',
      learned: "Adopted for organizing club initiatives and personal project planning.",
      used: "Used to plan and track projects for Club Biomed Innov and personal work.",
      certImage: 'assets/certs/skills/notion.png'
    },
    'imaging': {
      name: 'Medical Imaging',
      icon: 'assets/icons/skills/imaging.png',
      learned: "Learned through an internship studying medical imaging equipment.",
      used: "Studied imaging systems sold by STIET, a Philips distributor in Tunisia, during an internship.",
      certImage: 'assets/certs/skills/imaging.png'
    },
    'biomedical': {
      name: 'Biomedical Devices',
      icon: 'assets/icons/skills/biomedical.png',
      learned: "Core focus of biomedical engineering coursework at ISTMT.",
      used: "Applied across coursework, the STIET internship, and biomedical hackathon projects.",
      certImage: 'assets/certs/skills/biomedical.png'
    },
    'clinical': {
      name: 'Clinical Data',
      icon: 'assets/icons/skills/clinical.png',
      learned: "Learned through coursework on lab analysis and diagnostic systems.",
      used: "Built a clinical diagnostic web tool for homeostasis/milieu intérieur analysis, covering sodium, acid-base, potassium, calcium, and renal function panels.",
      certImage: 'assets/certs/skills/clinical.png'
    },
    'healthcare': {
      name: 'Healthcare Innovation',
      icon: 'assets/icons/skills/healthcare.png',
      learned: "Developed through biomedical engineering studies and club leadership.",
      used: "Drives project choices, from BioFarm to the homeostasis diagnostic tool, and club work as Head of External Relations at Club Biomed Innov.",
      certImage: 'assets/certs/skills/healthcare.png'
    },
    'english': {
      name: 'English',
      iconEmoji: 'EN',
      learned: "Developed through years of academic study and regular use in technical work.",
      used: "Used for coursework, technical documentation, and this portfolio.",
      certImage: 'assets/certs/skills/english.png'
    },
    'french': {
      name: 'French',
      iconEmoji: 'FR',
      learned: "Learned through Tunisia's bilingual education system.",
      used: "Used daily in academic and professional settings.",
      certImage: 'assets/certs/skills/french.png'
    },
    'arabic': {
      name: 'Arabic',
      iconEmoji: 'AR',
      learned: "Native language.",
      used: "Used for everyday communication.",
      certImage: 'assets/certs/skills/arabic.png'
    }
  };

  // French text for the modal content above — kept as a separate parallel
  // dictionary (rather than restructuring every field into {en, fr}
  // pairs) since only name/learned/used need a translation; icon paths,
  // emoji, and cert images stay the same regardless of language and are
  // read from skillDetails either way.
  const skillDetailsFR = {
    'html-css': {
      name: 'HTML / CSS',
      learned: "Appris en construisant et en itérant sur ce portfolio depuis zéro, en structurant les mises en page, puis en les affinant section par section.",
      used: "Utilisé sur l'ensemble de ce portfolio et dans NeuroBalance, un prototype de jeu HTML/CSS/JS en un seul fichier."
    },
    'javascript': {
      name: 'JavaScript',
      learned: "Appris en parallèle du HTML/CSS en ajoutant de l'interactivité à des projets personnels.",
      used: "Alimente la logique interactive de ce portfolio et la simulation de neurochimie de NeuroBalance."
    },
    'typescript': {
      name: 'TypeScript',
      learned: "Exploré en travaillant sur des bases de code front-end typées pour un développement d'interface plus fiable.",
      used: "Appliqué dans des expérimentations front-end et des interfaces à base de composants."
    },
    'python': {
      name: 'Python',
      learned: "Appris à travers des cours et des scripts pratiques de traitement de données.",
      used: "A servi à construire la couche de calcul du stress pour BioFarm, un projet de hackathon connecté à un capteur portable."
    },
    'cpp': {
      name: 'C / C++',
      learned: "Appris à travers des cours de systèmes embarqués et le développement sur Arduino.",
      used: "Utilisé pour écrire le firmware/les sketches de prototypes matériels à capteurs comme BioFarm."
    },
    'arduino': {
      name: 'Arduino',
      learned: "Appris à travers des projets matériels pratiques et des cours de génie biomédical.",
      used: "Utilisé pour connecter un capteur cardiaque MAX30100 pour BioFarm, un projet de bien-être de hackathon."
    },
    'esp32': {
      name: 'ESP32',
      learned: "Exploré comme une évolution d'Arduino pour des prototypes plus connectés, pilotés par capteurs.",
      used: "Utilisé en prototypage embarqué aux côtés de projets à capteurs basés sur Arduino."
    },
    'sensor': {
      name: 'Capteur MAX30100',
      learned: "Appris en intégrant un capteur cardiaque dans un prototype matériel.",
      used: "Central à BioFarm, il lit les données cardiaques pour piloter le calcul du stress en jeu et déclencher des exercices de respiration."
    },
    'circuit': {
      name: 'Conception de circuits',
      learned: "Développé à travers des cours de génie biomédical couvrant l'électronique et l'instrumentation.",
      used: "Appliqué dans le prototypage matériel pour des projets à capteurs."
    },
    'embedded': {
      name: 'Systèmes embarqués',
      learned: "Appris à travers des projets matériels Arduino/ESP32 et des cours.",
      used: "Utilisé pour relier le matériel des capteurs à la logique logicielle dans BioFarm."
    },
    'unity': {
      name: 'Unity',
      learned: "Appris en créant des prototypes de jeux autour de concepts biomédicaux et de santé.",
      used: "A servi à créer le jeu de ferme en pixel art de BioFarm, et à prototyper HormoneQuest sous Unity."
    },
    'react-native': {
      name: 'React Native',
      learned: "Appris en développant une application mobile multiplateforme depuis zéro.",
      used: "A servi à construire le frontend de RadConnect : vues selon le rôle, messagerie en temps réel, localisation et notifications."
    },
    'nodejs': {
      name: 'Node.js',
      learned: "Appris en connectant un frontend mobile à un service backend en production.",
      used: "Alimente le backend de RadConnect, construit avec Node.js et Express."
    },
    'postgresql': {
      name: 'PostgreSQL',
      learned: "Appris en concevant un schéma relationnel pour une application réelle.",
      used: "Utilisé comme base de données de RadConnect, hébergée sur Neon."
    },
    'notion': {
      name: 'Notion',
      learned: "Adopté pour organiser les initiatives du club et planifier des projets personnels.",
      used: "Utilisé pour planifier et suivre les projets du Club Biomed Innov et du travail personnel."
    },
    'imaging': {
      name: 'Imagerie médicale',
      learned: "Appris lors d'un stage d'étude des équipements d'imagerie médicale.",
      used: "Étude des systèmes d'imagerie commercialisés par STIET, distributeur Philips en Tunisie, durant un stage."
    },
    'biomedical': {
      name: 'Dispositifs biomédicaux',
      learned: "Axe central des cours de génie biomédical à l'ISTMT.",
      used: "Appliqué à travers les cours, le stage chez STIET et des projets de hackathon biomédical."
    },
    'clinical': {
      name: 'Données cliniques',
      learned: "Appris à travers des cours sur l'analyse de laboratoire et les systèmes de diagnostic.",
      used: "A servi à construire un outil web de diagnostic clinique pour l'analyse de l'homéostasie/milieu intérieur, couvrant les bilans sodium, acido-basique, potassium, calcium et fonction rénale."
    },
    'healthcare': {
      name: 'Innovation en santé',
      learned: "Développé à travers des études de génie biomédical et un rôle de direction au sein du club.",
      used: "Guide mes choix de projets, de BioFarm à l'outil de diagnostic Homéostasie, ainsi que mon rôle de responsable des relations extérieures au Club Biomed Innov."
    },
    'english': {
      name: 'Anglais',
      learned: "Développé à travers des années d'études académiques et une utilisation régulière dans le travail technique.",
      used: "Utilisé pour les cours, la documentation technique et ce portfolio."
    },
    'french': {
      name: 'Français',
      learned: "Appris à travers le système éducatif bilingue de la Tunisie.",
      used: "Utilisé quotidiennement dans des contextes académiques et professionnels."
    },
    'arabic': {
      name: 'Arabe',
      learned: "Langue maternelle.",
      used: "Utilisé pour la communication quotidienne."
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
  const skillModalCertBlock = document.getElementById('skillModalCertBlock');
  const skillModalCertArea = document.getElementById('skillModalCertArea');

  function openSkillModal(slug) {
    const data = skillDetails[slug];
    if (!data) return;
    const fr = skillDetailsFR[slug];
    const t = (I18N.get() === 'fr' && fr) ? fr : data;

    skillModalFilename.textContent = `${slug}.md`;
    skillModalName.textContent = t.name;
    skillModalLearned.textContent = t.learned;
    skillModalUsed.textContent = t.used;

    if (data.iconEmoji) {
      skillModalIcon.style.display = 'none';
      skillModalIconEmoji.style.display = 'flex';
      skillModalIconEmoji.textContent = data.iconEmoji;
    } else {
      skillModalIconEmoji.style.display = 'none';
      skillModalIcon.style.display = 'block';
      skillModalIcon.src = data.icon;
      skillModalIcon.alt = t.name;
    }

    skillModalCertArea.innerHTML = '';
    skillModalCertBlock.style.display = '';
    const certPath = data.certImage || `certs/${slug}.png`;
    const img = document.createElement('img');
    img.src = certPath;
    img.alt = `${t.name} certificate`;
    img.className = 'skill-cert-image';
    img.onerror = () => {
      skillModalCertBlock.style.display = 'none';
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
      videoSrc: 'assets/videos/radconnect.mp4',
      repoUrl: 'https://github.com/mariem-chaouachi/RadConnect-App'
    },
    'homeostasis': {
      name: 'Homeostasis Diagnostic Tool',
      tag: 'Web Tool',
      description: "A clinical web tool for milieu intérieur analysis, covering sodium, acid-base, potassium, calcium, and renal function panels. Uses Claude's API to extract data directly from uploaded lab files.",
      stack: ['Web', 'Claude API', 'Clinical Data'],
      videoSrc: 'assets/videos/homeostasis.mp4',
      repoUrl: 'https://github.com/mariem-chaouachi/Homeostasis-Diagnostic-Panel'
    },
    'biofarm': {
      name: 'BioFarm',
      tag: 'Hackathon',
      description: "A pixel-art Unity farm game connected to an Arduino MAX30100 heart-rate sensor, with a Python stress-scoring layer, guided breathing triggers, and a weekly wellness review for parents.",
      stack: ['Unity', 'Arduino', 'Python'],
      videoSrc: 'assets/videos/biofarm.mp4',
      repoUrl: 'https://github.com/mariem-chaouachi/BioFarm'
    },
    'portfolio': {
      name: 'Portfolio Website',
      tag: 'Personal Project',
      description: "This very site, an interactive portfolio with a flip-book About Me section, terminal-styled skill cards, a cursor-following bee companion, synthesized sound effects, and full English/French bilingual support.",
      stack: ['HTML', 'CSS', 'JavaScript'],
      videoSrc: 'assets/videos/portfolio-demo.mp4',
      repoUrl: 'https://github.com/mariem-chaouachi/PortfolioWebsite'
    },
    'dyslexia-app': {
      name: 'Dyslexia Companion App',
      tag: 'Ideathon',
      description: "An assistive app concept for children with dyslexia, pitched at the National Robotics Week 8.0 Biomed Day Ideathon under the \"open biomedical innovation\" theme. Structured around the full pitch: healthcare need, problem identification, user understanding, solution design, demonstration, and entrepreneurial perspective.",
      stack: ['Concept', 'UX Design', 'Pitch'],
      videoSrc: 'assets/videos/dyslexia-app.mp4',
      repoUrl: null
    }
  };

  // Reuses the same French copy already shown on the visible project
  // cards, so the modal and the card stay consistent.
  const projectDetailsFR = {
    'radconnect': {
      name: 'RadConnect',
      tag: 'Application mobile',
      description: "Une application mobile React Native / Expo qui fluidifie la communication entre techniciens et radiologues, avec des vues selon le rôle, une messagerie en temps réel et une localisation multilingue. Connectée à un backend Node.js/Express sur Neon PostgreSQL.",
      stack: ['React Native', 'Expo', 'Node.js', 'PostgreSQL']
    },
    'homeostasis': {
      name: 'Outil de diagnostic Homéostasie',
      tag: 'Outil web',
      description: "Un outil web clinique pour l'analyse du milieu intérieur, couvrant les bilans sodium, acido-basique, potassium, calcium et fonction rénale. Utilise l'API Claude pour extraire les données directement des fichiers de laboratoire téléversés.",
      stack: ['Web', 'API Claude', 'Données cliniques']
    },
    'biofarm': {
      name: 'BioFarm',
      tag: 'Hackathon',
      description: "Un jeu de ferme en pixel art sous Unity connecté à un capteur cardiaque Arduino MAX30100, avec un calcul du stress en Python, des exercices de respiration guidée et un bilan de bien-être hebdomadaire pour les parents.",
      stack: ['Unity', 'Arduino', 'Python']
    },
    'portfolio': {
      name: 'Site portfolio',
      tag: 'Projet personnel',
      description: "Ce site lui-même, un portfolio interactif avec une section « À propos » façon carnet à feuilleter, des cartes de compétences façon terminal, une abeille compagne qui suit le curseur, des effets sonores synthétisés, et un support bilingue complet anglais/français.",
      stack: ['HTML', 'CSS', 'JavaScript']
    },
    'dyslexia-app': {
      name: 'Application compagnon pour la dyslexie',
      tag: 'Ideathon',
      description: "Un concept d'application d'assistance pour les enfants dyslexiques, présenté à l'Ideathon Biomed Day du National Robotics Week 8.0, sous le thème « open biomedical innovation ». Structuré autour du pitch complet : besoin de santé, identification du problème, compréhension des utilisateurs, conception de la solution, démonstration et perspective entrepreneuriale.",
      stack: ['Concept', 'Design UX', 'Pitch']
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
  const projectModalRepoBlock = document.getElementById('projectModalRepoBlock');
  const projectModalRepoLink = document.getElementById('projectModalRepoLink');

  function openProjectModal(slug) {
    const data = projectDetails[slug];
    if (!data) return;
    const fr = projectDetailsFR[slug];
    const t = (I18N.get() === 'fr' && fr) ? fr : data;

    projectModalFilename.textContent = `${slug}.md`;
    projectModalTag.textContent = t.tag;
    projectModalName.textContent = t.name;
    projectModalDescription.textContent = t.description;

    projectModalStack.innerHTML = '';
    t.stack.forEach((item) => {
      const span = document.createElement('span');
      span.textContent = item;
      projectModalStack.appendChild(span);
    });

    projectModalVideoSource.src = data.videoSrc || '';
    projectModalVideo.load();

    if (data.repoUrl) {
      projectModalRepoBlock.style.display = '';
      projectModalRepoLink.href = data.repoUrl;
      projectModalRepoLink.textContent = data.repoUrl.replace('https://', '');
    } else {
      projectModalRepoBlock.style.display = 'none';
    }

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

  // The "open project" link on each visible project card now opens the
  // full detail modal (with the repo link inside it) instead of jumping
  // straight to GitHub — keeps the visitor on the page and gives them
  // the whole picture (description, stack, demo) before they leave.
  document.querySelectorAll('.project-link[data-project]').forEach((btn) => {
    btn.addEventListener('click', () => openProjectModal(btn.dataset.project));
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
    'stiet-internship': {
      role: 'Observation Internship',
      org: 'STIET (Philips Distributor, Tunisia)',
      orgUrl: 'https://stiet.com.tn/',
      date: 'July 2026',
      description: [
        "During my one-month internship at STIET Philips, I gained valuable knowledge and practical insight into the field of medical imaging.",
        "I learned about the principles, clinical applications, advantages, limitations, and radiation protection aspects of the main imaging modalities, including Radiography, Computed Tomography (CT), Magnetic Resonance Imaging (MRI), Ultrasound, and Nuclear Medicine. I also had the opportunity to discover the medical imaging systems commercialized by STIET Philips, such as Digital Radiography (DR) systems, mobile X-ray units and C-arms.",
        "This internship strengthened my technical knowledge, expanded my understanding of biomedical technologies, and gave me valuable exposure to their real-world clinical applications."
      ],
      skills: ['Radiography', 'CT', 'MRI', 'Ultrasound', 'Nuclear Medicine', 'Radiation Protection', 'Medical Imaging Systems'],
      certImage: 'assets/certs/experience/stiet-internship.png'
    },
    'clinical-internship': {
      role: 'Clinical Internship',
      org: 'Clinique Zaghouan',
      orgUrl: 'http://www.clinique-zaghouan.com/',
      date: 'June 2025',
      description: [
        "During my internship at Zaghouan Clinic, I gained hands-on experience in Computed Tomography (CT) imaging. I assisted with patient preparation and positioning, participated in CT image acquisition under the supervision of radiology professionals, and learned to apply imaging protocols while ensuring patient safety and radiation protection.",
        "This internship allowed me to strengthen my practical skills in medical imaging, improve my understanding of CT scanner operation and workflow, and gain valuable experience in interacting with patients in a clinical environment."
      ],
      skills: ['CT Imaging', 'Patient Positioning', 'Radiation Safety', 'Clinical Workflow', 'Patient Care'],
      certImage: 'assets/certs/experience/clinical-internship.png'
    },
    'sponsorship': {
      role: 'External Relations & Sponsorship Manager',
      org: 'Biomed Innov Club',
      orgUrl: 'https://www.instagram.com/club_biomed_innov/',
      date: 'Present',
      description: [
        "As Sponsorship and External Relations Manager at Biomed Innov Club, I contribute to building strategic partnerships and developing external collaborations to support the club's initiatives in biomedical engineering, technology, and innovation.",
        "I take part in organizing and coordinating a wide range of activities, including professional workshops and training sessions led by experts, engineering competitions, hackathons, and outreach programs. Through our initiatives, we promote biomedical engineering awareness among students, introduce young learners to robotics and technology through interactive workshops, and contribute to social actions such as volunteering at many hospitals and visiting isolated elementary schools.",
        "This experience has allowed me to strengthen my skills in communication, partnership management, event organization, teamwork, and leadership while creating meaningful educational and community-driven impact."
      ],
      skills: ['Partnership Management', 'Event Organization', 'Communication', 'Teamwork', 'Leadership', 'Community Outreach'],
      certImage: 'assets/certs/experience/sponsorship.png'
    },
    'notion-campus-leader': {
      role: 'Campus Leader',
      org: 'Notion',
      orgUrl: 'https://www.notion.so/',
      date: 'Present',
      description: "Representing Notion on campus, helping students and organizations adopt it for their workflows.",
      certImage: 'assets/certs/experience/notion-campus-leader.png'
    },
    'robotics-week': {
      role: 'Ambassador',
      org: 'National Robotics Weekend',
      orgUrl: 'https://nrw.ieee.tn/',
      date: '2026',
      description: "Promoting robotics engagement and outreach as part of National Robotics Weekend.",
      certImage: 'assets/certs/experience/robotics-week.png'
    }
  };

  // Same French copy already used on the visible experience/leadership cards,
  // extended with the fuller descriptions and skill tags for the modal.
  const experienceDetailsFR = {
    'stiet-internship': {
      role: "Stage d'observation",
      date: 'Juillet 2026',
      description: [
        "Durant mon stage d'un mois chez STIET Philips, j'ai acquis des connaissances précieuses et une compréhension pratique du domaine de l'imagerie médicale.",
        "J'ai appris les principes, les applications cliniques, les avantages, les limites et les aspects de radioprotection des principales modalités d'imagerie, notamment la radiographie, la tomodensitométrie (CT), l'imagerie par résonance magnétique (IRM), l'échographie et la médecine nucléaire. J'ai également eu l'occasion de découvrir les systèmes d'imagerie commercialisés par STIET Philips, tels que les systèmes de radiographie numérique (DR), les unités mobiles de radiographie et les arceaux mobiles (C-arms).",
        "Ce stage a renforcé mes connaissances techniques, élargi ma compréhension des technologies biomédicales et m'a donné une exposition précieuse à leurs applications cliniques réelles."
      ],
      skills: ['Radiographie', 'Scanner (CT)', 'IRM', 'Échographie', 'Médecine nucléaire', 'Radioprotection', "Systèmes d'imagerie médicale"]
    },
    'clinical-internship': {
      role: 'Stage clinique',
      date: 'Juin 2025',
      description: [
        "Durant mon stage à la Clinique de Zaghouan, j'ai acquis une expérience pratique en imagerie par tomodensitométrie (CT). J'ai participé à la préparation et au positionnement des patients, à l'acquisition d'images CT sous la supervision de professionnels en radiologie, et j'ai appris à appliquer les protocoles d'imagerie tout en assurant la sécurité des patients et la radioprotection.",
        "Ce stage m'a permis de renforcer mes compétences pratiques en imagerie médicale, d'améliorer ma compréhension du fonctionnement et du flux de travail du scanner CT, et d'acquérir une expérience précieuse dans l'interaction avec les patients en milieu clinique."
      ],
      skills: ['Imagerie CT', 'Positionnement des patients', 'Radioprotection', 'Flux de travail clinique', 'Soins aux patients']
    },
    'sponsorship': {
      role: 'Responsable relations extérieures & sponsoring',
      date: 'Actuel',
      description: [
        "En tant que Responsable Sponsoring et Relations Extérieures au Club Biomed Innov, je contribue à construire des partenariats stratégiques et à développer des collaborations externes pour soutenir les initiatives du club en génie biomédical, technologie et innovation.",
        "Je participe à l'organisation et à la coordination d'un large éventail d'activités, notamment des ateliers professionnels et des formations animées par des experts, des compétitions d'ingénierie, des hackathons et des programmes de sensibilisation. À travers nos initiatives, nous promouvons la sensibilisation au génie biomédical auprès des étudiants, initions les jeunes à la robotique et à la technologie via des ateliers interactifs, et contribuons à des actions sociales telles que le bénévolat dans plusieurs hôpitaux et des visites à des écoles primaires isolées.",
        "Cette expérience m'a permis de renforcer mes compétences en communication, gestion de partenariats, organisation d'événements, travail d'équipe et leadership, tout en créant un impact éducatif et communautaire significatif."
      ],
      skills: ['Gestion de partenariats', "Organisation d'événements", 'Communication', "Travail d'équipe", 'Leadership', 'Action communautaire']
    },
    'notion-campus-leader': {
      role: 'Ambassadrice de campus',
      date: 'Actuel',
      description: "Je représente Notion sur le campus, en aidant étudiants et organisations à l'adopter pour leurs flux de travail."
    },
    'robotics-week': {
      role: 'Ambassadrice',
      date: '2026',
      description: "Je fais la promotion de la robotique et de son rayonnement dans le cadre du National Robotics Weekend."
    }
  };

  const experienceModalOverlay = document.getElementById('experienceModalOverlay');
  const experienceModalCloseBtn = document.getElementById('experienceModalCloseBtn');
  const experienceModalFilename = document.getElementById('experienceModalFilename');
  const experienceModalRole = document.getElementById('experienceModalRole');
  const experienceModalOrg = document.getElementById('experienceModalOrg');
  const experienceModalDate = document.getElementById('experienceModalDate');
  const experienceModalDescription = document.getElementById('experienceModalDescription');
  const experienceModalSkillsBlock = document.getElementById('experienceModalSkillsBlock');
  const experienceModalSkills = document.getElementById('experienceModalSkills');
  const experienceModalCert = document.getElementById('experienceModalCert');
  const experienceModalCertBlock = document.getElementById('experienceModalCertBlock');

  function openExperienceModal(slug) {
    const data = experienceDetails[slug];
    if (!data) return;
    const fr = experienceDetailsFR[slug];
    const t = (I18N.get() === 'fr' && fr) ? fr : data;

    experienceModalFilename.textContent = `${slug}.md`;
    experienceModalRole.textContent = t.role;
    experienceModalOrg.textContent = data.org;
    experienceModalOrg.href = data.orgUrl || '#';
    experienceModalDate.textContent = t.date;

    // description can be a single string or an array of paragraphs —
    // render each paragraph as its own <p> either way.
    experienceModalDescription.innerHTML = '';
    const paragraphs = Array.isArray(t.description) ? t.description : [t.description];
    paragraphs.forEach((text) => {
      const p = document.createElement('p');
      p.textContent = text;
      experienceModalDescription.appendChild(p);
    });

    const skillList = (I18N.get() === 'fr' && fr && fr.skills) ? fr.skills : data.skills;
    experienceModalSkills.innerHTML = '';
    if (skillList && skillList.length) {
      experienceModalSkillsBlock.style.display = '';
      skillList.forEach((skill) => {
        const span = document.createElement('span');
        span.textContent = skill;
        experienceModalSkills.appendChild(span);
      });
    } else {
      experienceModalSkillsBlock.style.display = 'none';
    }

    if (data.certImage) {
      experienceModalCertBlock.style.display = '';
      experienceModalCert.src = data.certImage;
      experienceModalCert.alt = `${t.role} certificate`;
      experienceModalCert.onerror = () => {
        experienceModalCertBlock.style.display = 'none';
      };
    } else {
      experienceModalCertBlock.style.display = 'none';
    }

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

    const orgLink = card.querySelector('.timeline-org');
    if (orgLink) {
      orgLink.addEventListener('click', (e) => e.stopPropagation());
    }
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

  // ---- Award Detail Modal ----
  const awardDetails = {
    'mindhack': {
      title: 'MindHack 1.0 Hackathon',
      org: 'ieee.tn/event/mind-hack-1-0',
      orgUrl: 'https://ieee.tn/event/mind-hack-1-0/',
      date: '',
      description: 'Competed as a challenger, developing a project under hackathon time constraints.',
      certs: ['assets/certs/awards/award-mindhack.png'],
      video: null,
      relatedProject: 'biofarm'
    },
    'little-archaeologist': {
      title: 'First Place, "Little Archaeologist" Art Competition',
      org: "Hippo Museum (Musée d'Hippone), Annaba, Algeria",
      orgUrl: null,
      date: '2017',
      description: "Awarded first place in the \"Little Archaeologist\" art competition organized by the Hippo Museum in Annaba, Algeria. As a young participant, I created an artwork inspired by Annaba's archaeological heritage, featuring the Gorgon sculpture and the Basilica of Saint Augustine. The first-place prize included a personal computer.",
      // Two certificate images for this one — drop the second file in
      // alongside the first with this exact name and it'll show up here
      // automatically; until then it's simply skipped (same
      // fail-gracefully pattern used for every other cert image on the
      // site), same for the video below.
      certs: ['assets/certs/awards/award-little-archaeologist.jpg', 'assets/certs/awards/award-little-archaeologist-2.jpg'],
      video: 'assets/videos/award-little-archaeologist.mp4'
    },
    'robotics-week-ideathon': {
      title: 'Second Place, National Robotics Week 8.0 Biomed Day Ideathon',
      org: 'National Robotics Week 8.0 · Biomed Day',
      orgUrl: null,
      date: '2026',
      description: "Won second place at the Biomed Day Ideathon, part of National Robotics Week 8.0, held under the \"open biomedical innovation\" theme. Pitched an assistive robotics concept across the full ideathon structure: healthcare need, problem identification, user understanding, solution design, demonstration, and entrepreneurial perspective.",
      certs: ['assets/certs/awards/award-robotics-week-ideathon.png'],
      video: null,
      relatedProject: 'dyslexia-app'
    }
  };

  const awardDetailsFR = {
    'mindhack': {
      title: 'Hackathon MindHack 1.0',
      org: 'ieee.tn/event/mind-hack-1-0',
      date: '',
      description: "J'ai participé en tant que candidate, développant un projet dans les délais imposés par le hackathon."
    },
    'little-archaeologist': {
      title: '1ère place, Concours d\'art « Petit Archéologue »',
      org: "Musée d'Hippone, Annaba, Algérie",
      date: '2017',
      description: "1ère place au concours d'art « Petit Archéologue » organisé par le Musée d'Hippone à Annaba, en Algérie. En tant que jeune participante, j'ai réalisé une œuvre inspirée du patrimoine archéologique d'Annaba, mettant en scène la sculpture de la Gorgone et la basilique de Saint-Augustin. Le prix de la première place incluait un ordinateur personnel."
    },
    'robotics-week-ideathon': {
      title: 'Deuxième place, Ideathon Biomed Day, National Robotics Week 8.0',
      org: 'National Robotics Week 8.0 · Biomed Day',
      date: '2026',
      description: "2ème place à l'Ideathon Biomed Day, organisé dans le cadre du National Robotics Week 8.0, sous le thème « open biomedical innovation ». Présentation d'un concept de robotique assistive à travers toute la structure de l'ideathon : besoin de santé, identification du problème, compréhension des utilisateurs, conception de la solution, démonstration et perspective entrepreneuriale."
    }
  };

  const awardModalOverlay = document.getElementById('awardModalOverlay');
  const awardModalCloseBtn = document.getElementById('awardModalCloseBtn');
  const awardModalFilename = document.getElementById('awardModalFilename');
  const awardModalTitle = document.getElementById('awardModalTitle');
  const awardModalOrg = document.getElementById('awardModalOrg');
  const awardModalDate = document.getElementById('awardModalDate');
  const awardModalDescription = document.getElementById('awardModalDescription');
  const awardModalVideoBlock = document.getElementById('awardModalVideoBlock');
  const awardModalVideo = document.getElementById('awardModalVideo');
  const awardModalVideoSource = document.getElementById('awardModalVideoSource');
  const awardModalCertBlock = document.getElementById('awardModalCertBlock');
  const awardModalCertGallery = document.getElementById('awardModalCertGallery');
  const awardModalProjectBlock = document.getElementById('awardModalProjectBlock');
  const awardModalProjectLink = document.getElementById('awardModalProjectLink');

  function openAwardModal(slug) {
    const data = awardDetails[slug];
    if (!data) return;
    const fr = awardDetailsFR[slug];
    const t = (I18N.get() === 'fr' && fr) ? fr : data;

    awardModalFilename.textContent = `${slug}.md`;
    awardModalTitle.textContent = t.title;
    awardModalOrg.textContent = t.org;
    if (data.orgUrl) {
      awardModalOrg.href = data.orgUrl;
      awardModalOrg.setAttribute('target', '_blank');
    } else {
      awardModalOrg.href = '#';
      awardModalOrg.removeAttribute('target');
    }
    awardModalDate.textContent = t.date || '';
    awardModalDate.style.display = t.date ? '' : 'none';
    awardModalDescription.textContent = t.description;

    if (data.video) {
      awardModalVideoBlock.style.display = '';
      awardModalVideoSource.src = data.video;
      awardModalVideo.load();
      awardModalVideo.onerror = () => {
        awardModalVideoBlock.style.display = 'none';
      };
    } else {
      awardModalVideoBlock.style.display = 'none';
    }

    awardModalCertGallery.innerHTML = '';
    (data.certs || []).forEach((certSrc, i) => {
      const img = document.createElement('img');
      img.src = certSrc;
      img.alt = `${t.title} certificate ${i + 1}`;
      img.className = 'award-modal-cert-image';
      img.onerror = () => {
        img.remove();
        if (!awardModalCertGallery.children.length) {
          awardModalCertBlock.style.display = 'none';
        }
      };
      awardModalCertGallery.appendChild(img);
    });
    awardModalCertBlock.style.display = (data.certs && data.certs.length) ? '' : 'none';

    // Related project — jumps straight from the award to the project it
    // was built for, closing this modal and opening that one.
    const relatedProject = data.relatedProject && projectDetails[data.relatedProject];
    if (relatedProject) {
      awardModalProjectBlock.style.display = '';
      const relatedT = (I18N.get() === 'fr' && projectDetailsFR[data.relatedProject])
        ? projectDetailsFR[data.relatedProject]
        : relatedProject;
      awardModalProjectLink.textContent = relatedT.name;
      awardModalProjectLink.onclick = () => {
        closeAwardModal();
        openProjectModal(data.relatedProject);
      };
    } else {
      awardModalProjectBlock.style.display = 'none';
      awardModalProjectLink.onclick = null;
    }

    awardModalOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeAwardModal() {
    awardModalOverlay.classList.remove('active');
    awardModalVideo.pause();
    document.body.style.overflow = '';
  }

  document.querySelectorAll('.award-card[data-award]').forEach((card) => {
    card.addEventListener('click', () => openAwardModal(card.dataset.award));
    card.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openAwardModal(card.dataset.award);
      }
    });

    const orgLink = card.querySelector('.award-org-link');
    if (orgLink && orgLink.tagName === 'A') {
      orgLink.addEventListener('click', (e) => e.stopPropagation());
    }
  });

  awardModalCloseBtn.addEventListener('click', closeAwardModal);

  awardModalOverlay.addEventListener('click', (e) => {
    if (e.target === awardModalOverlay) closeAwardModal();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && awardModalOverlay.classList.contains('active')) {
      closeAwardModal();
    }
  });

  // Mobile hamburger nav
  const navbarEl = document.getElementById('navbar');
  const navHamburger = document.getElementById('navHamburger');
  const navLinksEl = document.getElementById('navLinks');
  const navOverlay = document.getElementById('navOverlay');

  function closeMobileNav() {
    navHamburger.classList.remove('open');
    navLinksEl.classList.remove('mobile-open');
    navOverlay.classList.remove('active');
    navbarEl.classList.remove('menu-open');
    navHamburger.setAttribute('aria-expanded', 'false');
    document.body.style.overflow = '';
  }

  function toggleMobileNav() {
    const isOpen = navLinksEl.classList.toggle('mobile-open');
    navHamburger.classList.toggle('open', isOpen);
    navOverlay.classList.toggle('active', isOpen);
    navbarEl.classList.toggle('menu-open', isOpen);
    navHamburger.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  }

  if (navHamburger) {
    navHamburger.addEventListener('click', toggleMobileNav);
    navOverlay.addEventListener('click', closeMobileNav);
    navLinksEl.querySelectorAll('a').forEach((link) => {
      link.addEventListener('click', closeMobileNav);
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') closeMobileNav();
    });
  }

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

  // Terminal Deck Scroll & Dock Animation
  // (Scroll-jacking removed — Skills is now a plain static list at every
  // width. Kept the function name and call sites below so the
  // scroll/resize listeners further down don't need to change; it just
  // makes sure no stray inline styles are left over from a card that was
  // mid-animation before a resize.)
  const cards = Array.from(document.querySelectorAll(".terminal-card"));

  function updateTerminals() {
    cards.forEach((card) => {
      const windowEl = card.querySelector(".terminal-window");
      windowEl.style.transform = '';
      windowEl.style.opacity = '';
      card.style.pointerEvents = '';
      card.style.zIndex = '';
    });
  }

  // Pinned Horizontal Gallery Scroll Handler
  // Reusable for both Experience and Leadership. `reverse: true` makes the
  // gallery reveal its cards in the opposite order/direction.
  // Pinned Horizontal Gallery Scroll Handler
  // (Scroll-jacking removed — Experience/Leadership are now plain static
  // stacks at every width, so this just clears any leftover inline
  // transform. Kept as a function returning an `update` callback so the
  // scroll/resize listeners further down don't need to change.)
  function createGalleryScroller(sectionSelector, trackSelector, cardSelector) {
    const track = document.querySelector(trackSelector);
    if (!track) return () => {};

    return function update() {
      track.style.transform = '';
    };
  }

  const updateExperienceScroll = createGalleryScroller(
    ".experience-section", ".experience-gallery-track", ".experience-card:not(.leadership-card)"
  );
  const updateLeadershipScroll = createGalleryScroller(
    ".leadership-section", ".leadership-gallery-track", ".leadership-card"
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

  // ---- Lazy-play project/TV videos ----
  // These autoplay-loop-muted videos are decorative and heavy: only play
  // them once they're actually visible (pausing again once scrolled out),
  // and skip autoplay entirely for visitors who prefer reduced motion —
  // they'll still see the first frame once it loads, just not moving.
  const lazyVideos = document.querySelectorAll('video.lazy-video');
  if (lazyVideos.length && !prefersReducedMotion) {
    if ('IntersectionObserver' in window) {
      const videoObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            video.play().catch(() => { /* autoplay can be blocked — ignore */ });
          } else {
            video.pause();
          }
        });
      }, { threshold: 0.25 });
      lazyVideos.forEach((video) => videoObserver.observe(video));
    } else {
      // No IntersectionObserver support — fall back to normal autoplay.
      lazyVideos.forEach((video) => video.play().catch(() => {}));
    }
  }

  // ---- Scroll reveal: sections/cards fade + rise into place as they
  // enter the viewport, so scrolling feels less like flipping static
  // pages and more like the page is responding to you. Reuses the
  // prefersReducedMotion flag already declared above (used for the
  // mascot/video behavior).
  if (!prefersReducedMotion && 'IntersectionObserver' in window) {
    // Repeating card groups get a small stagger so they settle in one
    // after another rather than all landing on the same frame.
    const revealGroups = [
      { container: '.experience-gallery-track', items: '.timeline-item' },
      { container: '.leadership-gallery-track', items: '.leadership-card' },
      { container: '.awards-grid', items: '.award-card' },
      { container: '.projects-container', items: '.project-row' },
      { container: '.faq-container', items: '.faq-item' },
      { container: '.terminal-deck', items: '.terminal-card' },
    ];

    revealGroups.forEach(({ container, items }) => {
      const parent = document.querySelector(container);
      if (!parent) return;
      Array.from(parent.querySelectorAll(items)).forEach((el, i) => {
        el.classList.add('js-reveal');
        el.style.transitionDelay = `${Math.min(i * 0.1, 0.4)}s`;
      });
    });

    // One-off blocks and section titles — a plain fade + rise, no stagger.
    document
      .querySelectorAll(
        '.about-title, .exp-title-centered, .leadership-title-centered, ' +
          '.faq-heading, .contact-card, ' +
          '.section-title-dark:not(.skills-fixed-title)'
      )
      .forEach((el) => el.classList.add('js-reveal'));

    // Toggling is-visible both ways (instead of adding it once and
    // unobserving) makes every reveal replay each time its element
    // re-enters the viewport — scroll back up past something, then
    // back down, and it fades/rises in again rather than just sitting
    // there already visible.
    const revealObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          entry.target.classList.toggle('is-visible', entry.isIntersecting);
        });
      },
      { threshold: 0.15, rootMargin: '0px 0px -8% 0px' }
    );

    // Double rAF before observing: elements already inside the
    // viewport at page load (which, depending on section heights and
    // scroll-restore-on-refresh, can include the skills terminal cards)
    // otherwise get their very first IntersectionObserver notification
    // before the browser has painted the initial hidden state even
    // once — the two states collapse into a single paint and the
    // "animation" never actually renders. Waiting two frames guarantees
    // the hidden state has been on screen at least once first.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        document
          .querySelectorAll('.js-reveal')
          .forEach((el) => revealObserver.observe(el));
      });
    });
  }
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
// ---- Cursor-following bee ----
(function initCursorBee() {
  const bee = document.getElementById('cursorBee');
  const bubble = document.getElementById('beeSpeechBubble');
  const beeBody = bee ? bee.querySelector('.bee-body') : null;
  if (!bee) return;
  if (window.matchMedia && window.matchMedia('(hover: none)').matches) return;

  let targetX = window.innerWidth / 2;
  let targetY = window.innerHeight / 2;
  let beeX = targetX;
  let beeY = targetY;
  let prevX = beeX;
  let prevY = beeY;
  let hasMoved = false;

  // Offset so the bee sits a comfortable distance from the cursor, tucked
  // to its bottom-right.
  const OFFSET_X = 42;
  const OFFSET_Y = 46;
  const HALF_SIZE = 18; // half of #cursorBee's 36px box

  function onPointerMove(e) {
    targetX = e.clientX;
    targetY = e.clientY;
    if (!hasMoved) {
      hasMoved = true;
      beeX = targetX;
      beeY = targetY;
      bee.classList.add('bee-active');
    }
  }

  window.addEventListener('mousemove', onPointerMove, { passive: true });
  window.addEventListener('mouseleave', () => bee.classList.remove('bee-active'));
  window.addEventListener('mouseenter', () => {
    if (hasMoved) bee.classList.add('bee-active');
  });

  const EASE = 0.22;
  // Gentle, slow idle wander — kept small and slow on purpose so it reads
  // as a soft, calm hover rather than a jitter.
  const IDLE_AMPLITUDE = 3;
  let idleAngle = Math.random() * Math.PI * 2;

  function tick() {
    if (hasMoved) {
      const dx = (targetX + OFFSET_X) - beeX;
      const dy = (targetY + OFFSET_Y) - beeY;
      const dist = Math.hypot(dx, dy);

      // Bee never fully stops: it keeps a tiny restless wander around its
      // resting spot even while the cursor is still, so it always reads
      // as alive rather than frozen.
      idleAngle += 0.025;
      const idleX = Math.cos(idleAngle) * IDLE_AMPLITUDE;
      const idleY = Math.sin(idleAngle * 1.7) * IDLE_AMPLITUDE * 0.6;

      const goalX = targetX + OFFSET_X + (dist < 3 ? idleX : 0);
      const goalY = targetY + OFFSET_Y + (dist < 3 ? idleY : 0);

      beeX += (goalX - beeX) * EASE;
      beeY += (goalY - beeY) * EASE;

      const moveX = beeX - prevX;
      const moveY = beeY - prevY;
      const speed = Math.hypot(moveX, moveY);

      let angle = 0;
      if (speed > 0.4) {
        angle = Math.atan2(moveY, moveX) * (180 / Math.PI) * 0.18;
        angle = Math.max(-18, Math.min(18, angle));
      }

      const wobble = Math.sin(idleAngle * 2) * 1.2;

      // Position lives on #cursorBee itself; the tilt/wobble rotation is
      // applied only to the inner .bee-body wrapper. The speech bubble is
      // a sibling of .bee-body (not a child), so it glides smoothly with
      // the bee's position without ever inheriting its rotation — that
      // rotation-on-a-shared-element was what made the bubble look like
      // it was glitching in place while idle.
      bee.style.transform = `translate(${beeX - HALF_SIZE}px, ${beeY - HALF_SIZE}px)`;
      if (beeBody) {
        beeBody.style.transform = `rotate(${angle + wobble}deg)`;
      }

      prevX = beeX;
      prevY = beeY;
    }
    requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);

  // ---- Hover tooltip: the bee "speaks" about whatever is clickable ----
  if (!bubble) return;

  const skillMessages = {
    'html-css': 'discover my HTML & CSS skills!',
    'javascript': 'see my JavaScript projects!',
    'typescript': 'check out my TypeScript work!',
    'python': 'discover my Python skill!',
    'cpp': 'peek at my C++ experience!',
    'unity': 'see what I built in Unity!',
    'react-native': 'explore my React Native apps!',
    'nodejs': 'check my Node.js work!',
    'postgresql': 'see my PostgreSQL projects!',
    'notion': 'discover how I use Notion!',
    'arduino': 'see my Arduino builds!',
    'esp32': 'check out my ESP32 projects!',
    'sensor': 'discover my sensor work!',
    'circuit': 'see my circuit design skills!',
    'embedded': 'explore my embedded systems work!',
    'imaging': 'discover my medical imaging knowledge!',
    'biomedical': 'see my biomedical engineering skills!',
    'clinical': 'check out my clinical experience!',
    'healthcare': 'discover my healthcare know-how!',
    'english': 'see my English proficiency!',
    'french': 'découvrez mon français!',
    'arabic': 'discover my Arabic fluency!',
  };

  const cardMessages = {
    'stiet-internship': 'explore my STIET internship!',
    'clinical-internship': 'discover my clinical internship!',
    'sponsorship': 'see how I led sponsorships!',
    'notion-campus-leader': 'discover my Notion Campus Leader role!',
    'robotics-week': 'explore National Robotics Weekend!',
  };

  const projectMessages = {
    'radconnect': 'explore RadConnect!',
    'homeostasis': 'discover the Homeostasis tool!',
    'biofarm': 'check out BioFarm!',
  };

  const filterMessages = {
    main: 'see my main projects!',
    software: 'browse my software projects!',
    hardware: 'browse my hardware projects!',
  };

  const sectionMessages = {
    home: 'back to the top!',
    about: 'learn more about me!',
    'skills-terminal': 'check out my skills!',
    experience: 'see my experience!',
    leadership: 'discover my leadership roles!',
    awards: 'see my awards!',
    projects: 'browse my projects!',
    contact: "let's get in touch!",
  };

  function messageFor(el) {
    const custom = el.closest('[data-bee-msg]');
    if (custom) return custom.dataset.beeMsg;

    const skillEl = el.closest('[data-skill]');
    if (skillEl) return skillMessages[skillEl.dataset.skill] || 'discover this skill!';

    const cardEl = el.closest('[data-card]');
    if (cardEl) return cardMessages[cardEl.dataset.card] || 'see more about this!';

    const projBtn = el.closest('[data-project]');
    if (projBtn) return projectMessages[projBtn.dataset.project] || 'explore this project!';

    const projLink = el.closest('.project-link');
    if (projLink) {
      const row = projLink.closest('.project-row');
      const id = row && row.id ? row.id.replace('project-', '') : '';
      return projectMessages[id] || 'explore this project!';
    }

    const filterBtn = el.closest('[data-filter]');
    if (filterBtn) return filterMessages[filterBtn.dataset.filter] || 'filter projects!';

    const navLink = el.closest('[data-section]');
    if (navLink) return sectionMessages[navLink.dataset.section] || 'go there!';

    if (el.closest('#cvWidgetBtn')) return 'check out my CV!';
    if (el.closest('.cv-download-btn')) return 'download my CV!';
    if (el.closest('#projectsAllBtn')) return 'see all my projects!';
    if (el.closest('.faq-question')) return 'curious? click to find out!';
    if (el.closest('.award-card')) return 'see my hackathon award!';
    if (el.closest('.contact-link-linkedin')) return 'connect with me on LinkedIn!';
    if (el.closest('.contact-link-github')) return 'check out my GitHub!';
    if (el.closest('.contact-link-instagram')) return 'see my Instagram!';
    if (el.closest('a[href^="mailto:"]')) return 'send me an email!';
    if (el.closest('a[href^="https://wa.me"]')) return 'message me on WhatsApp!';
    if (el.closest('.terminal-dot-close')) return 'close this!';
    if (el.closest('.nav-hamburger')) return 'open the menu!';
    if (el.closest('.timeline-org')) return 'visit this organization!';

    return null;
  }

  const HOVER_SELECTOR =
    'a, button, [role="button"], .skill-chip, .experience-card, [data-bee-msg]';

  let currentTarget = null;

  document.addEventListener('mouseover', (e) => {
    const clickable = e.target.closest(HOVER_SELECTOR);
    if (!clickable || currentTarget === clickable) return;
    const msg = messageFor(clickable);
    if (!msg) return;
    currentTarget = clickable;
    bubble.textContent = msg;
    bubble.classList.add('bee-bubble-visible');
  });

  document.addEventListener('mouseout', (e) => {
    if (!currentTarget) return;
    if (currentTarget.contains(e.relatedTarget)) return;
    currentTarget = null;
    bubble.classList.remove('bee-bubble-visible');
  });
})();