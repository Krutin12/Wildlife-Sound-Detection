export interface WildlifeSpecies {
  id: string;
  commonName: string;
  scientificName: string;
  category: 'birds' | 'mammals' | 'amphibians' | 'insects';
  categoryLabel: string;
  status: 'Least Concern' | 'Near Threatened' | 'Vulnerable' | 'Endangered';
  habitat: string;
  distribution: string;
  callType: string;
  frequencyRange: string;
  description: string;
  imageUrl: string;
  audioDuration: string;
  sampleAudioUrl?: string;
  waveformFrequencies: number[];
}

export interface DemoAudioSample {
  id: string;
  title: string;
  subtitle: string;
  species: string;
  scientificName: string;
  confidence: number;
  family: string;
  habitat: string;
  frequencyHz: number;
  snrDb: number;
  durationSec: number;
  vocalizationType: string;
  conservationStatus: string;
  spectrogramTheme: string;
  notes: string;
}

export const DEMO_AUDIO_SAMPLES: DemoAudioSample[] = [
  {
    id: 'sample-nightingale',
    title: 'Common Nightingale Song',
    subtitle: 'Nocturnal territorial mating call',
    species: 'Common Nightingale',
    scientificName: 'Luscinia megarhynchos',
    confidence: 98.7,
    family: 'Muscicapidae',
    habitat: 'Dense riverine scrub & deciduous woodlands',
    frequencyHz: 3420,
    snrDb: 22.4,
    durationSec: 4.8,
    vocalizationType: 'Rich whistling crescendo with fluted notes',
    conservationStatus: 'Least Concern',
    spectrogramTheme: 'emerald',
    notes: 'Identified with exceptional signal clarity. Strong harmonic intervals between 2.8 kHz and 5.2 kHz.'
  },
  {
    id: 'sample-barn-owl',
    title: 'Barn Owl Screech Call',
    subtitle: 'Nocturnal flight vocalization',
    species: 'Barn Owl',
    scientificName: 'Tyto alba',
    confidence: 96.4,
    family: 'Tytonidae',
    habitat: 'Open grasslands, farmland & forest margins',
    frequencyHz: 2150,
    snrDb: 18.9,
    durationSec: 3.2,
    vocalizationType: 'Piercing raspy screech with broad bandwidth',
    conservationStatus: 'Least Concern',
    spectrogramTheme: 'teal',
    notes: 'Characteristic broad-spectrum screech detected across 1.8 kHz to 3.5 kHz acoustic band.'
  },
  {
    id: 'sample-red-crossbill',
    title: 'Red Crossbill Flight Call',
    subtitle: 'Coniferous canopy flocking call',
    species: 'Red Crossbill',
    scientificName: 'Loxia curvirostra',
    confidence: 94.2,
    family: 'Fringillidae',
    habitat: 'Boreal & temperate coniferous pine forests',
    frequencyHz: 4100,
    snrDb: 19.8,
    durationSec: 3.9,
    vocalizationType: 'Sharp metallic "kip-kip" chirp bursts',
    conservationStatus: 'Least Concern',
    spectrogramTheme: 'sky',
    notes: 'Distinctive crossbill vocal type. Mel spectrogram matches Type 2 ponderosa specialist.'
  },
  {
    id: 'sample-cicada',
    title: 'Forest Cicada Chorus',
    subtitle: 'Canopy acoustic vibration chorus',
    species: 'Emerald Cicada',
    scientificName: 'Zammara smaragdina',
    confidence: 92.8,
    family: 'Cicadidae',
    habitat: 'Tropical rainforest lower and middle canopy',
    frequencyHz: 7800,
    snrDb: 26.1,
    durationSec: 5.4,
    vocalizationType: 'High-frequency rhythmic tymbal percussion',
    conservationStatus: 'Least Concern',
    spectrogramTheme: 'amber',
    notes: 'High acoustic density observed in the ultrasonic threshold (6.5 kHz - 9.0 kHz).'
  }
];

export const FEATURED_WILDLIFE: WildlifeSpecies[] = [
  {
    id: 'sp-1',
    commonName: 'Common Nightingale',
    scientificName: 'Luscinia megarhynchos',
    category: 'birds',
    categoryLabel: 'Bird',
    status: 'Least Concern',
    habitat: 'Woodlands & dense scrub',
    distribution: 'Western Europe, Mediterranean, North Africa',
    callType: 'Melodic whistle & nocturnal song',
    frequencyRange: '2.0 – 6.5 kHz',
    description: 'Renowned for its powerful, fluted nocturnal song comprising over 200 distinct stanza types.',
    imageUrl: '/species/common_nightingale.jpg',
    audioDuration: '0:14',
    waveformFrequencies: [30, 45, 80, 65, 90, 75, 60, 85, 95, 70, 50, 40, 65, 85, 70, 45, 60, 80, 55, 35]
  },
  {
    id: 'sp-2',
    commonName: 'Barn Owl',
    scientificName: 'Tyto alba',
    category: 'birds',
    categoryLabel: 'Bird',
    status: 'Least Concern',
    habitat: 'Grasslands, agricultural fields & meadows',
    distribution: 'Cosmopolitan except polar and desert regions',
    callType: 'Raspy screech & hiss',
    frequencyRange: '1.5 – 4.0 kHz',
    description: 'Distinctive heart-shaped facial disc acts as an acoustic dish channeling nocturnal rodent rustles directly into asymmetrical ears.',
    imageUrl: '/species/barn_owl.jpg',
    audioDuration: '0:09',
    waveformFrequencies: [20, 35, 50, 70, 95, 85, 40, 25, 20, 45, 80, 90, 75, 40, 30, 55, 70, 40, 25, 15]
  },
  {
    id: 'sp-3',
    commonName: 'Scarlet Macaw',
    scientificName: 'Ara macao',
    category: 'birds',
    categoryLabel: 'Bird',
    status: 'Vulnerable',
    habitat: 'Neotropical humid rainforest canopy',
    distribution: 'Central & South America',
    callType: 'Loud throaty "raah" squawk',
    frequencyRange: '0.8 – 3.2 kHz',
    description: 'Vibrant flagship parrot whose loud, resonant vocalizations carry for miles across dense rainforest canopies to coordinate bonded pairs.',
    imageUrl: '/species/scarlet_macaw.jpg',
    audioDuration: '0:12',
    waveformFrequencies: [40, 60, 90, 100, 85, 70, 40, 30, 70, 95, 85, 60, 45, 80, 90, 65, 50, 40, 30, 20]
  },
  {
    id: 'sp-4',
    commonName: 'Red Fox',
    scientificName: 'Vulpes vulpes',
    category: 'mammals',
    categoryLabel: 'Mammal',
    status: 'Least Concern',
    habitat: 'Forest borders, chaparral & wetlands',
    distribution: 'Northern Hemisphere temperate zones',
    callType: 'Nocturnal "gekker" & contact bark',
    frequencyRange: '0.6 – 2.8 kHz',
    description: 'Canine with 28 identified vocalizations ranging from high-pitched territorial shrieks to soft maternal murmurs.',
    imageUrl: '/species/red_fox.jpg',
    audioDuration: '0:08',
    waveformFrequencies: [15, 30, 65, 80, 60, 40, 25, 35, 75, 85, 50, 30, 45, 70, 60, 35, 20, 40, 30, 15]
  },
  {
    id: 'sp-5',
    commonName: 'Red-Eyed Tree Frog',
    scientificName: 'Agalychnis callidryas',
    category: 'amphibians',
    categoryLabel: 'Amphibian',
    status: 'Least Concern',
    habitat: 'Lowland tropical rainforest foliage',
    distribution: 'Central America & Northern South America',
    callType: 'Repetitive "chack-chack" vibration',
    frequencyRange: '1.2 – 2.4 kHz',
    description: 'Arboreal hylid frog whose nocturnal breeding calls resonate across wet leaves near temporary forest pools.',
    imageUrl: '/species/red_eyed_frog.jpg',
    audioDuration: '0:06',
    waveformFrequencies: [25, 40, 75, 80, 50, 30, 60, 85, 90, 45, 25, 60, 75, 50, 30, 65, 80, 40, 20, 15]
  },
  {
    id: 'sp-6',
    commonName: 'Emerald Cicada',
    scientificName: 'Zammara smaragdina',
    category: 'insects',
    categoryLabel: 'Insect',
    status: 'Least Concern',
    habitat: 'Subtropical rainforest canopy',
    distribution: 'Amazonian basin & Central America',
    callType: 'High-frequency acoustic drone',
    frequencyRange: '6.0 – 9.5 kHz',
    description: 'Produces some of the loudest bioacoustic signals in the insect kingdom using abdominal tymbal organ vibrations.',
    imageUrl: '/species/emerald_cicada.jpg',
    audioDuration: '0:18',
    waveformFrequencies: [80, 95, 85, 90, 95, 90, 85, 100, 95, 85, 90, 95, 90, 85, 95, 90, 85, 90, 80, 75]
  }
];

export const CORE_FEATURES = [
  {
    id: 'feat-detection',
    title: 'AI Wildlife Sound Detection',
    subtitle: 'Bioacoustic Neural Classification',
    description: 'Proprietary EfficientNet-B3 deep learning engine classifies complex avian, mammalian, and amphibian calls with millisecond latency.',
    icon: 'Radio',
    tag: 'Deep Learning',
    gradient: 'from-emerald-500/10 to-teal-500/10',
    accentColor: 'text-emerald-700',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  {
    id: 'feat-library',
    title: 'Species Taxonomic Library',
    subtitle: 'Comprehensive Bioacoustic Catalog',
    description: 'Explore extensive biological profiles, vocalization patterns, frequency ranges, and geographic ranges across hundreds of monitored species.',
    icon: 'BookOpen',
    tag: 'Taxonomy',
    gradient: 'from-teal-500/10 to-sky-500/10',
    accentColor: 'text-teal-700',
    badgeColor: 'bg-teal-50 text-teal-800 border-teal-200'
  },
  {
    id: 'feat-history',
    title: 'Verifiable Detection History',
    subtitle: 'Auditable Observation Records',
    description: 'Track, filter, and export historical bioacoustic observations with audio waveforms, timestamps, and model prediction confidence scores.',
    icon: 'Clock',
    tag: 'Audit Trail',
    gradient: 'from-sky-500/10 to-blue-500/10',
    accentColor: 'text-sky-700',
    badgeColor: 'bg-sky-50 text-sky-800 border-sky-200'
  },
  {
    id: 'feat-location',
    title: 'Location-Based Observations',
    subtitle: 'Geospatial Biodiversity Mapping',
    description: 'Correlate sound recordings with geospatial coordinates on interactive topographic maps to trace migration corridors and habitat density.',
    icon: 'MapPin',
    tag: 'Geospatial GIS',
    gradient: 'from-emerald-500/10 to-lime-500/10',
    accentColor: 'text-emerald-700',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  },
  {
    id: 'feat-articles',
    title: 'Wildlife Articles & Field Guides',
    subtitle: 'Educational Ecological Insights',
    description: 'Access peer-reviewed articles, sound identification tips, and bioacoustic methodologies written by ornithologists and field biologists.',
    icon: 'GraduationCap',
    tag: 'Education',
    gradient: 'from-amber-500/10 to-emerald-500/10',
    accentColor: 'text-amber-800',
    badgeColor: 'bg-amber-50 text-amber-800 border-amber-200'
  },
  {
    id: 'feat-analytics',
    title: 'Bioacoustic Analytics Dashboard',
    subtitle: 'Ecosystem Health Metrics',
    description: 'Visualize acoustic diversity indices, diurnal calling activity curves, dominant frequency spreads, and classification reliability in real-time.',
    icon: 'BarChart3',
    tag: 'Analytics',
    gradient: 'from-emerald-500/10 to-cyan-500/10',
    accentColor: 'text-emerald-700',
    badgeColor: 'bg-emerald-50 text-emerald-800 border-emerald-200'
  }
];

export const WORKFLOW_STEPS = [
  {
    step: '01',
    title: 'Upload or Record Audio',
    description: 'Drop field audio files (WAV, MP3, FLAC) captured via smartphones, soundscape recorders, or directional parabolas.',
    icon: 'UploadCloud',
    badge: 'Raw Input',
    metric: 'Any Audio Format'
  },
  {
    step: '02',
    title: 'AI Processes the Sound',
    description: 'Librosa transforms the audio into 128-band Mel Spectrograms, applying noise filtering and vocal segmentation.',
    icon: 'Cpu',
    badge: 'Mel Spectrogram',
    metric: '128 Mel Filterbanks'
  },
  {
    step: '03',
    title: 'Identify Wildlife Species',
    description: 'The pre-trained EfficientNet-B3 neural network evaluates time-frequency patterns to predict exact species with confidence rankings.',
    icon: 'Sparkles',
    badge: 'Neural Inference',
    metric: '94.8% Field Precision'
  },
  {
    step: '04',
    title: 'Explore & Save Observation',
    description: 'Inspect taxonomic profiles, vocalization patterns, GPS coordinates, and permanently log detections for biodiversity studies.',
    icon: 'Compass',
    badge: 'Bio Intelligence',
    metric: 'Instant Export'
  }
];

export const TECH_PIPELINE = [
  {
    stage: 'Acoustic Ingestion',
    tech: 'Librosa & Soundfile',
    detail: '32 kHz audio resampling, silences trimmed, and high-pass filtering applied to remove field wind noise.',
    icon: 'Mic'
  },
  {
    stage: 'Feature Extraction',
    tech: 'Mel-Frequency Spectrogram',
    detail: 'Log-scaled time-frequency representations capturing harmonic call fundamentals and overtone structures.',
    icon: 'Activity'
  },
  {
    stage: 'Deep Neural Classifier',
    stageHighlight: 'EfficientNet-B3 CNN',
    tech: 'PyTorch & TorchAudio',
    detail: 'Compound scaled architecture extracting 1,536 spatial feature channels optimized for acoustic spectrogram patterns.',
    icon: 'Layers'
  },
  {
    stage: 'API & Mobile Ecosystem',
    tech: 'FastAPI & Flutter',
    detail: 'High-throughput asynchronous inference backend paired with modern web and mobile apps for field naturalists.',
    icon: 'Zap'
  }
];
