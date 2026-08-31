// ---- Sound effects (Web Audio API — synthesized, no external audio
// files needed) ----
const SoundFX = (function initSoundFX() {
  let ctx = null;
  let enabled = true;
  const STORAGE_KEY = 'siteSoundEnabled';

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored !== null) enabled = stored === 'true';
  } catch (e) { /* localStorage unavailable — default stays on */ }

  function getCtx() {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return null;
    if (!ctx) ctx = new AudioCtx();
    if (ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  // Soft, short blip for general UI clicks (buttons, links, chips...).
  function click() {
    if (!enabled) return;
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(680, t);
    osc.frequency.exponentialRampToValueAtTime(400, t + 0.06);
    gain.gain.setValueAtTime(0.07, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.08);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.09);
  }

  // Paper-rustle swish for a single page turn, built from filtered noise.
  function pageTurn() {
    if (!enabled) return;
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime;
    const duration = 0.38;
    const bufferSize = Math.floor(c.sampleRate * duration);
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      const progress = i / bufferSize;
      const envelope = Math.sin(progress * Math.PI);
      data[i] = (Math.random() * 2 - 1) * envelope;
    }
    const noise = c.createBufferSource();
    noise.buffer = buffer;
    const bandpass = c.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1700, t);
    bandpass.frequency.linearRampToValueAtTime(2500, t + duration);
    bandpass.Q.value = 0.65;
    const gain = c.createGain();
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.04);
    gain.gain.linearRampToValueAtTime(0.0001, t + duration);
    noise.connect(bandpass).connect(gain).connect(c.destination);
    noise.start(t);
    noise.stop(t + duration);
  }

  // A slightly richer swish + soft low thud for the cover opening/closing.
  function bookOpen() {
    if (!enabled) return;
    pageTurn();
    const c = getCtx();
    if (!c) return;
    const t = c.currentTime + 0.06;
    const osc = c.createOscillator();
    const gain = c.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(170, t);
    osc.frequency.exponentialRampToValueAtTime(85, t + 0.2);
    gain.gain.setValueAtTime(0.09, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + 0.22);
    osc.connect(gain).connect(c.destination);
    osc.start(t);
    osc.stop(t + 0.24);
  }

  function toggle() {
    enabled = !enabled;
    try { localStorage.setItem(STORAGE_KEY, String(enabled)); } catch (e) { /* ignore */ }
    return enabled;
  }

  function isEnabled() {
    return enabled;
  }

  // Browsers require a user gesture before audio can play — prime/resume
  // the context on the very first pointer or key interaction so the
  // first real sound effect isn't silently dropped.
  function primeOnFirstGesture() {
    const unlock = () => {
      getCtx();
      document.removeEventListener('pointerdown', unlock);
      document.removeEventListener('keydown', unlock);
    };
    document.addEventListener('pointerdown', unlock, { once: true });
    document.addEventListener('keydown', unlock, { once: true });
  }
  primeOnFirstGesture();

  return { click, pageTurn, bookOpen, toggle, isEnabled };
})();

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
    heroImg.src = 'hero-background.png';

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

  // ---- Sound effects toggle button ----
  const soundToggleBtn = document.getElementById('soundToggleBtn');
  if (soundToggleBtn) {
    const syncSoundBtn = () => {
      const muted = !SoundFX.isEnabled();
      soundToggleBtn.classList.toggle('muted', muted);
      soundToggleBtn.setAttribute('aria-pressed', String(muted));
      soundToggleBtn.setAttribute('aria-label', muted ? 'Unmute sound effects' : 'Mute sound effects');
    };
    syncSoundBtn();
    soundToggleBtn.addEventListener('click', () => {
      SoundFX.toggle();
      syncSoundBtn();
      // No explicit SoundFX.click() here — the delegated click-sound
      // listener further down (bound on document) will already fire
      // naturally as this event bubbles, and by then SoundFX.isEnabled()
      // reflects the new state, so unmuting gets its own audible
      // confirmation for free without double-firing the sound.
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

    cvWidgetContainer.classList.toggle('docked-bottom-right', !large);
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

  // French text for the modal content above — kept as a separate parallel
  // dictionary (rather than restructuring every field into {en, fr}
  // pairs) since only name/learned/used need a translation; icon paths,
  // emoji, and cert images stay the same regardless of language and are
  // read from skillDetails either way.
  const skillDetailsFR = {
    'html-css': {
      name: 'HTML / CSS',
      learned: "Appris en construisant et en itérant sur ce portfolio depuis zéro — en structurant les mises en page, puis en les affinant section par section.",
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
      used: "Central à BioFarm — lit les données cardiaques pour piloter le calcul du stress en jeu et déclencher des exercices de respiration."
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
      used: "A servi à construire le frontend de RadConnect — vues selon le rôle, messagerie en temps réel, localisation et notifications."
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
      used: "Guide mes choix de projets — de BioFarm à l'outil de diagnostic Homéostasie — ainsi que mon rôle de responsable des relations extérieures au Club Biomed Innov."
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
      orgUrl: 'https://www.instagram.com/club_biomed_innov/',
      date: 'Present',
      description: "Leading outreach and partnerships for the biomedical innovation club, connecting student projects with industry professionals and academic collaborators.",
      certImage: 'certs/external-relations.png'
    },
    'stiet-internship': {
      role: 'Observation Internship',
      org: 'STIET — Philips Distributor, Tunisia',
      orgUrl: 'https://stiet.com.tn/',
      date: 'July 2026',
      description: "Studied and reported on medical imaging equipment across conventional & interventional radiology, CT, ultrasound, MRI, and nuclear medicine.",
      certImage: 'certs/stiet-internship.png'
    },
    'clinical-internship': {
      role: 'Clinical Internship',
      org: 'Clinique Zaghouan',
      orgUrl: 'http://www.clinique-zaghouan.com/',
      date: 'Clinical Practice',
      description: "Observed clinical workflows and medical equipment in a hospital setting, building a practical understanding of patient care environments.",
      certImage: 'certs/clinical-internship.png'
    },
    'sponsorship': {
      role: 'External Relations & Sponsorship Manager',
      org: 'Biomed Innov Club',
      orgUrl: 'https://www.instagram.com/club_biomed_innov/',
      date: 'Present',
      description: "Building partnerships and securing sponsorships to support the club's biomedical engineering initiatives.",
      certImage: 'certs/sponsorship.png'
    },
    'notion-campus-leader': {
      role: 'Campus Leader',
      org: 'Notion',
      orgUrl: 'https://www.notion.so/',
      date: 'Present',
      description: "Representing Notion on campus, helping students and organizations adopt it for their workflows.",
      certImage: 'certs/notion-campus-leader.png'
    },
    'robotics-week': {
      role: 'Ambassador',
      org: 'National Robotics Weekend',
      orgUrl: 'https://nrw.ieee.tn/',
      date: '2026',
      description: "Promoting robotics engagement and outreach as part of National Robotics Weekend.",
      certImage: 'certs/robotics-week.png'
    }
  };

  // Same French copy already used on the visible experience/leadership cards.
  const experienceDetailsFR = {
    'external-relations': {
      role: 'Responsable des relations extérieures',
      date: 'Actuel',
      description: "Je pilote la prospection et les partenariats du club d'innovation biomédicale, en connectant les projets étudiants avec des professionnels du secteur et des collaborateurs académiques."
    },
    'stiet-internship': {
      role: "Stage d'observation",
      date: 'Juillet 2026',
      description: "J'ai étudié et documenté des équipements d'imagerie médicale en radiologie conventionnelle & interventionnelle, scanner, échographie, IRM et médecine nucléaire."
    },
    'clinical-internship': {
      role: 'Stage clinique',
      date: 'Pratique clinique',
      description: "J'ai observé les flux de travail cliniques et les équipements médicaux en milieu hospitalier, développant une compréhension concrète des environnements de soins."
    },
    'sponsorship': {
      role: 'Responsable relations extérieures & sponsoring',
      date: 'Actuel',
      description: "Je développe des partenariats et obtiens des sponsors pour soutenir les initiatives du club en génie biomédical."
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
    experienceModalDescription.textContent = t.description;

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
      pageIndicator.textContent = I18N.get() === 'fr' ? "Couverture" : "Cover";
    } else if (currentPageIndex === totalPagePairs) {
      pageIndicator.textContent = I18N.get() === 'fr' ? "Dernière page" : "Back Cover";
    } else {
      pageIndicator.textContent = `Page ${currentPageIndex * 2 - 1} - ${currentPageIndex * 2}`;
    }

    prevBtn.disabled = currentPageIndex === 0;
    nextBtn.disabled = currentPageIndex === totalPagePairs;
  }

  // Mobile: one readable page/face at a time (screen's too narrow for the
  // desktop two-page spread), but the transition between faces uses the
  // same notebook-style flip-up glide, not the desktop's side-flip — see
  // goToMobilePage() and the .mobile-flip-* rotateX keyframes in style.css.
  // DOM order of .page-front/.page-back across page0→page2 already gives
  // the correct linear reading sequence: cover, p1, p2, p3, p4, back cover.
  const allFaces = Array.from(book.querySelectorAll('.page-front, .page-back'));
  const mobileLabels = {
    en: ['Cover', 'Page 1', 'Page 2', 'Page 3', 'Page 4', 'Back Cover'],
    fr: ['Couverture', 'Page 1', 'Page 2', 'Page 3', 'Page 4', 'Dernière page'],
  };
  let mobilePageIndex = 0;
  let mobileBookInitialized = false;
  let isMobileFlipping = false;

  function setMobileFace(index) {
    allFaces.forEach((face, i) => {
      face.classList.toggle('mobile-active', i === index);
    });
    const labels = mobileLabels[I18N.get()] || mobileLabels.en;
    pageIndicator.textContent = labels[index] || '';
    prevBtn.disabled = index === 0;
    nextBtn.disabled = index === allFaces.length - 1;
  }

  function goToMobilePage(newIndex) {
    if (newIndex < 0 || newIndex >= allFaces.length || newIndex === mobilePageIndex) return;

    // Before the book has finished its first render, or during an
    // in-progress flip, just jump straight there — no animation to glide.
    if (!mobileBookInitialized) {
      mobilePageIndex = newIndex;
      setMobileFace(mobilePageIndex);
      return;
    }
    if (isMobileFlipping) return;

    const forward = newIndex > mobilePageIndex;
    const outgoing = allFaces[mobilePageIndex];
    const incoming = allFaces[newIndex];
    isMobileFlipping = true;

    // Lock the book's height for the duration of the flip: both faces sit
    // position:absolute mid-transition and don't contribute to the
    // container's normal-flow height, which would otherwise collapse it.
    const bookRect = book.getBoundingClientRect();
    book.style.height = `${bookRect.height}px`;

    // The very first flip off the cover reads as the book opening; every
    // other transition is a regular page turn.
    if (mobilePageIndex === 0 || newIndex === 0) {
      SoundFX.bookOpen();
    } else {
      SoundFX.pageTurn();
    }

    outgoing.classList.add(forward ? 'mobile-flip-out-forward' : 'mobile-flip-out-backward');
    incoming.classList.add('mobile-active', forward ? 'mobile-flip-in-forward' : 'mobile-flip-in-backward');

    let settled = false;
    const settle = () => {
      if (settled) return;
      settled = true;
      outgoing.classList.remove(
        'mobile-flip-out-forward', 'mobile-flip-out-backward', 'mobile-active'
      );
      incoming.classList.remove('mobile-flip-in-forward', 'mobile-flip-in-backward');
      book.style.height = '';
      mobilePageIndex = newIndex;
      setMobileFace(mobilePageIndex);
      isMobileFlipping = false;
    };

    outgoing.addEventListener('animationend', settle, { once: true });
    setTimeout(settle, 780); // safety net in case animationend doesn't fire
  }

  nextBtn.addEventListener('click', () => {
    if (isMobileLayout()) {
      goToMobilePage(mobilePageIndex + 1);
      return;
    }
    if (currentPageIndex < totalPagePairs) {
      SoundFX[currentPageIndex === 0 ? 'bookOpen' : 'pageTurn']();
      currentPageIndex++;
      updateBook();
    }
  });

  prevBtn.addEventListener('click', () => {
    if (isMobileLayout()) {
      goToMobilePage(mobilePageIndex - 1);
      return;
    }
    if (currentPageIndex > 0) {
      SoundFX[currentPageIndex === 1 ? 'bookOpen' : 'pageTurn']();
      currentPageIndex--;
      updateBook();
    }
  });

  pages.forEach((page, idx) => {
    page.addEventListener('click', () => {
      if (isMobileLayout()) return;
      if (idx === currentPageIndex) {
        SoundFX[currentPageIndex === 0 ? 'bookOpen' : 'pageTurn']();
        currentPageIndex++;
        updateBook();
      } else if (idx === currentPageIndex - 1) {
        SoundFX[currentPageIndex === 1 ? 'bookOpen' : 'pageTurn']();
        currentPageIndex--;
        updateBook();
      }
    });
  });

  // Mobile: tapping anywhere on the book advances to the next page/face,
  // the same way tapping a real book page turns it.
  book.addEventListener('click', () => {
    if (!isMobileLayout()) return;
    goToMobilePage(mobilePageIndex + 1);
  });

  updateBook();
  setMobileFace(mobilePageIndex);
  mobileBookInitialized = true;

  // Keep the book's page indicator ("Cover", "Page 1"...) in sync when
  // the language is switched — everything else with a data-en/data-fr
  // pair is handled generically by I18N.apply(), but this text is
  // generated by JS rather than sitting in the DOM already.
  document.addEventListener('languagechange', () => {
    if (isMobileLayout()) {
      setMobileFace(mobilePageIndex);
    } else {
      updateBook();
    }
  });

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
    if (isMobileLayout()) {
      dock.classList.remove("is-visible");
      cards.forEach((card) => {
        const windowEl = card.querySelector(".terminal-window");
        windowEl.style.transform = '';
        windowEl.style.opacity = '';
        card.style.pointerEvents = '';
        // The desktop stacking-deck illusion needs each card's z-index
        // set very high (98-100, from the one-time setup above) so they
        // layer correctly during the scroll-jacked flip animation. On
        // mobile the cards are just a plain static list, so that same
        // z-index instead outranks the fixed navbar (z-index: 100) and
        // its mobile dropdown menu (z-index: 95) — meaning the cards
        // rendered on top of the nav whenever it was open near the
        // Skills section, blocking clicks/reading. Clear it back to the
        // normal stacking order here.
        card.style.zIndex = '';
      });
      return;
    }

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
      if (isMobileLayout()) {
        track.style.transform = '';
        return;
      }

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
    updateBook();
    setMobileFace(mobilePageIndex);
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

  // ---- General click sound for ordinary interactive elements ----
  // The book handles its own richer page-turn/open sounds at the sites
  // where those transitions actually happen, so it's excluded here to
  // avoid layering two sounds on the same tap.
  document.addEventListener('click', (e) => {
    const bookRelated = e.target.closest(
      '#flipBook, .page, .page-front, .page-back, #nextPageBtn, #prevPageBtn'
    );
    if (bookRelated) return;

    const interactive = e.target.closest(
      'a, button, [role="button"], .skill-chip, .faq-question, .projects-tab, .contact-link, .terminal-dot-close'
    );
    if (interactive) {
      SoundFX.click();
    }
  });
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
    'external-relations': 'see more of my experience at Biomed Innov!',
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
    if (el.closest('#prevPageBtn')) return 'flip to the previous page!';
    if (el.closest('#nextPageBtn')) return 'turn the page!';
    if (el.closest('.book')) return 'open the book!';
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
    'a, button, [role="button"], .skill-chip, .experience-card, .book, [data-bee-msg]';

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