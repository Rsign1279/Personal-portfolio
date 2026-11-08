// All site copy lives here. Edit this file to update the portfolio.

export const profile = {
  name: 'Rahul Viswanath',
  first: 'Rahul',
  email: 'rahul.n.viswanath@gmail.com',
  linkedin: 'https://www.linkedin.com/in/rahulviswanath1279',
  location: 'Bentonville, AR',
};

export const heroStats = [
  { value: '10th', label: 'Nationally · SkillsUSA NLSC 2026' },
  { value: '2.5ms', label: 'YOLO inference at 97%+ accuracy' },
  { value: '750+', label: 'People reached live at AIMFest' },
];

export const heroCards = [
  { tag: 'Wearable · ML', title: 'PATHOS', tint: '#f5c84b' },
  { tag: 'Vision · YOLO', title: 'EverGreen', tint: '#7cd4a0' },
  { tag: 'Search · MCP', title: 'Thorbole', tint: '#8fa8ff' },
];

// Globe pins. lat/lon in degrees. `side` picks which way the label sits.
export const globePins = [
  {
    id: 'bentonville', lat: 36.37, lon: -94.21, side: 'left',
    kicker: 'Home base · Bentonville, AR',
    title: 'Building AI that ships',
    body: 'PATHOS, EverGreen and infrastructure engineering at Thorbole Simulation Technologies.',
  },
  {
    id: 'atlanta', lat: 33.75, lon: -84.39, side: 'right',
    kicker: 'Atlanta, GA · 2026',
    title: '10th place nationally',
    body: 'Community Action Project, SkillsUSA National Leadership & Skills Conference.',
  },
  {
    id: 'dallas', lat: 32.78, lon: -96.80, side: 'left',
    kicker: 'EarthX e-Capital Summit',
    title: 'International qualifier',
    body: 'EverGreen: AI waste sorting for a cleaner planet.',
  },
  {
    id: 'waterloo', lat: 43.46, lon: -80.52, side: 'right',
    kicker: 'Vision board · Next stop',
    title: 'University of Waterloo',
    body: 'Where I am headed: engineering and AI at Waterloo.',
  },
];

// Extra arcs from home base out to the world (unlabelled signal lines).
export const globeReach = [
  [51.5, -0.12], [12.97, 77.59], [35.68, 139.69], [-23.55, -46.63],
  [48.85, 2.35], [1.35, 103.82], [-33.87, 151.21], [37.77, -122.42], [6.52, 3.37],
];

export const globeFeed = [
  { label: 'PATHOS stress-awareness wearable', meta: '865 windows · 15 participants · ~77% LOSO' },
  { label: '@autism_feed feature', meta: '13.6K+ likes · 4,389 saves · 1,009 reposts' },
  { label: 'Autism Involves Me validation', meta: 'Nonprofit serving 2,000+ people' },
];

// Mind map. x/y are percentages of the map area (desktop layout).
export const mapNodes = [
  { id: 'me', type: 'core', x: 45, y: 50, title: 'Rahul Viswanath', sub: 'AI · Hardware · Impact' },

  // Projects
  { id: 'pathos', type: 'project', x: 13, y: 12, icon: 'pulse', color: '#f5c84b', title: 'PATHOS', sub: 'Founder & Tech Lead', body: 'Stress-awareness wearable for autistic & nonverbal people. EDA + skin temp → 43 features → ensemble → live dashboard.' },
  { id: 'evergreen', type: 'project', x: 12, y: 50, icon: 'leaf', color: '#7cd4a0', title: 'EverGreen', sub: 'Former Chief AI Officer', body: 'Custom YOLO vision for smart waste sorting: 2.5 ms inference, 97%+ PET & aluminum accuracy.' },
  { id: 'library', type: 'project', x: 38, y: 10, icon: 'search', color: '#8fa8ff', title: 'Hybrid-Search Library', sub: 'Thorbole Simulation', body: 'PyMuPDF + Tesseract OCR + sentence-transformers + Qdrant + Meilisearch over the company archive.' },
  { id: 'mcp', type: 'project', x: 13, y: 88, icon: 'plug', color: '#111111', title: 'Dropbox MCP', sub: 'Thorbole Simulation', body: 'Model Context Protocol server so AI assistants can search, read and work with company files.' },
  { id: 'vision', type: 'project', x: 38, y: 90, icon: 'eye', color: '#b28dff', title: 'Crash-Image AI', sub: 'Claude Vision API', body: 'Automated crash-image analysis & descriptions to cut repetitive manual review.' },
  { id: 'rig', type: 'project', x: 63, y: 88, icon: 'chip', color: '#111111', title: 'RTX 5090 Workstation', sub: 'Designed & built', body: '32 GB GDDR7, 128 GB DDR5-6400 for simulation, 8K rendering and large-model inference.' },
  { id: 'wit', type: 'project', x: 63, y: 12, icon: 'spark', color: '#ff7ab8', title: 'Women+ In Tech', sub: 'Marketing Intern & Tech Lead', body: 'AI/ML and engineering workshops for Girls+ in Tech; seven-month social campaign.' },

  // Goals
  { id: 'waterloo', type: 'goal', x: 87, y: 38, icon: 'flag', color: '#f5c84b', title: 'University of Waterloo', sub: 'Vision board', body: 'Study engineering & AI at Waterloo.' },
  { id: 'access', type: 'goal', x: 87, y: 62, icon: 'heart', color: '#ff7ab8', title: 'AI for accessibility', sub: 'Goal', body: 'Take PATHOS from prototype to people who need it.' },
  { id: 'planet', type: 'goal', x: 87, y: 86, icon: 'globe', color: '#7cd4a0', title: 'AI for the planet', sub: 'Goal', body: 'Sustainability tech that scales beyond one city.' },
  { id: 'infra', type: 'goal', x: 87, y: 14, icon: 'bolt', color: '#8fa8ff', title: 'Change the world with AI', sub: 'North star', body: 'Build infrastructure that makes AI useful for real teams.' },
];

export const mapEdges = [
  ['me', 'pathos'], ['me', 'evergreen'], ['me', 'library'], ['me', 'mcp'], ['me', 'vision'],
  ['me', 'rig'], ['me', 'wit'], ['me', 'infra'], ['me', 'waterloo'], ['me', 'access'], ['me', 'planet'],
  ['pathos', 'access'], ['evergreen', 'planet'], ['wit', 'access'], ['library', 'infra'],
  ['rig', 'infra'], ['vision', 'infra'], ['mcp', 'library'], ['infra', 'waterloo'],
];

export const experience = [
  { when: 'Jun 2026 – Now', role: 'Computer Infrastructure Engineering Intern', org: 'Thorbole Simulation Technologies' },
  { when: 'Sep 2025 – Now', role: 'Founder & Technical Lead', org: 'PATHOS' },
  { when: 'Sep 2025 – Aug 2026', role: 'Chief AI Officer', org: 'EverGreen' },
  { when: 'Jan 2026 – Now', role: 'Marketing Intern & Tech Lead', org: 'Women+ In Tech (WIT+)' },
];

export const skills = [
  'Python', 'C++', 'Java', 'JavaScript', 'React', 'PyTorch', 'TensorFlow', 'scikit-learn', 'XGBoost',
  'Computer Vision', 'LLMs', 'Embeddings', 'Qdrant', 'Meilisearch', 'MCP', 'Claude Vision API',
  'CUDA', 'Streamlit', 'ESP32', 'Arduino', 'Raspberry Pi', 'Linux',
];
