import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Trees, Compass, ChevronRight, ChevronDown, Globe, Navigation, Sparkles, RefreshCw, Filter, X } from 'lucide-react';
import { searchWikipediaSpecies, WikiResult } from '../api/wikipedia';

interface ForestLocation {
  name: string;
  region: string;
  country: string;
  lat: number;
  lng: number;
}

interface AnimalData {
  id: string;
  name: string;
  emoji: string;
  continent: 'Africa' | 'Americas' | 'Asia' | 'Oceania' | 'Polar' | 'Oceans' | 'Global';
  image: string;
  forests: ForestLocation[];
  isLive?: boolean;
}

// Global Habitat Knowledge Base for Automatic Geocoding of Any World Species
const REGIONAL_HABITAT_MAP: Record<string, ForestLocation[]> = {
  dog: [
    { name: 'Worldwide Urban & Rural Habitats', region: 'Global Domestic Range', country: 'Worldwide, All Continents', lat: 40.7128, lng: -74.0060 },
    { name: 'Eurasian Forest & Grassland Range', region: 'Central Europe & Asia', country: 'Eurasia', lat: 48.8566, lng: 2.3522 },
    { name: 'North American Nature & Domestic Range', region: 'North America', country: 'United States & Canada', lat: 37.7749, lng: -122.4194 },
  ],
  india: [
    { name: 'Gir National Park & Wildlife Sanctuary', region: 'Gujarat', country: 'India, Asia', lat: 21.1245, lng: 70.8242 },
    { name: 'Jim Corbett National Park', region: 'Uttarakhand', country: 'India, Asia', lat: 29.5300, lng: 78.7747 },
    { name: 'Kaziranga National Park Forest', region: 'Assam', country: 'India, Asia', lat: 26.5775, lng: 93.1711 },
    { name: 'Sundarbans Mangrove Forest', region: 'West Bengal', country: 'India, Asia', lat: 21.9497, lng: 89.1833 },
  ],
  australia: [
    { name: 'Daintree Rainforest National Park', region: 'Queensland', country: 'Australia, Oceania', lat: -16.2833, lng: 145.4000 },
    { name: 'Great Otway Forest Reserve', region: 'Victoria', country: 'Australia, Oceania', lat: -38.7500, lng: 143.5833 },
    { name: 'Rottnest Island Nature Reserve', region: 'Western Australia', country: 'Australia, Oceania', lat: -32.0062, lng: 115.5122 },
  ],
  mexico: [
    { name: 'Xochimilco Wetlands & Reserve', region: 'Mexico City', country: 'Mexico, North America', lat: 19.2946, lng: -99.1039 },
    { name: 'Calakmul Biosphere Reserve Rainforest', region: 'Campeche', country: 'Mexico, North America', lat: 18.1167, lng: -89.8000 },
  ],
  congo: [
    { name: 'Ituri Rainforest & Okapi Wildlife Reserve', region: 'Haut-Uélé', country: 'DR Congo, Africa', lat: 1.4167, lng: 28.5833 },
    { name: 'Salonga National Park Forest', region: 'Tshuapa', country: 'DR Congo, Africa', lat: -2.0000, lng: 21.0000 },
  ],
  madagascar: [
    { name: 'Andasibe-Mantadia National Park', region: 'Alaotra-Mangoro', country: 'Madagascar, Africa', lat: -18.9333, lng: 48.4167 },
    { name: 'Ranomafana Rainforest Reserve', region: 'Vatovavy', country: 'Madagascar, Africa', lat: -21.2500, lng: 47.4500 },
  ],
  amazon: [
    { name: 'Central Amazon Rainforest Reserve', region: 'Amazonas', country: 'Brazil, South America', lat: -3.4653, lng: -62.2159 },
    { name: 'Manu National Park Cloud Forest', region: 'Madre de Dios', country: 'Peru, South America', lat: -12.2500, lng: -71.5000 },
    { name: 'Yasuní National Park Rainforest', region: 'Orellana', country: 'Ecuador, South America', lat: -0.6667, lng: -76.4000 },
  ],
  arctic: [
    { name: 'Svalbard Arctic Tundra Reserve', region: 'Spitsbergen', country: 'Norway, Arctic', lat: 78.2232, lng: 15.6267 },
    { name: 'Wapusk National Park & Tundra', region: 'Manitoba', country: 'Canada, North America', lat: 57.7667, lng: -93.6667 },
  ],
  antarctica: [
    { name: 'Ross Sea Wildlife Sanctuary', region: 'Ross Dependency', country: 'Antarctica', lat: -77.5000, lng: 166.0000 },
    { name: 'Weddell Sea Coast Sanctuary', region: 'Weddell Sea', country: 'Antarctica', lat: -64.4667, lng: -57.2000 },
  ],
  new_zealand: [
    { name: 'Fiordland National Park Rainforest', region: 'South Island', country: 'New Zealand, Oceania', lat: -45.4167, lng: 167.7167 },
    { name: 'Rakiura National Forest', region: 'Stewart Island', country: 'New Zealand, Oceania', lat: -46.9000, lng: 167.8333 },
  ],
  china: [
    { name: 'Wolong National Nature Reserve', region: 'Sichuan', country: 'China, Asia', lat: 31.0500, lng: 103.1833 },
    { name: 'Foping Nature Reserve Forest', region: 'Shaanxi', country: 'China, Asia', lat: 33.5500, lng: 107.8000 },
  ],
  indonesia: [
    { name: 'Tanjung Puting National Park Rainforest', region: 'Kalimantan', country: 'Indonesia, Asia', lat: -2.8833, lng: 111.9167 },
    { name: 'Komodo National Park Sanctuary', region: 'East Nusa Tenggara', country: 'Indonesia, Asia', lat: -8.5439, lng: 119.4892 },
  ],
  sahara: [
    { name: 'Ahaggar National Park Desert Habitat', region: 'Tamanrasset', country: 'Algeria, Africa', lat: 23.2833, lng: 5.5167 },
    { name: 'Kgalagadi Transfrontier Park', region: 'Northern Cape', country: 'South Africa, Africa', lat: -25.7667, lng: 20.3833 },
  ],
  north_america: [
    { name: 'Yellowstone National Park Forest', region: 'Wyoming', country: 'United States, North America', lat: 44.4280, lng: -110.5885 },
    { name: 'Banff National Park Forest', region: 'Alberta', country: 'Canada, North America', lat: 51.4968, lng: -115.9281 },
  ],
  europe: [
    { name: 'Białowieża Primeval Forest', region: 'Podlaskie', country: 'Poland & Belarus, Europe', lat: 52.7333, lng: 23.8667 },
    { name: 'Black Forest National Park', region: 'Baden-Württemberg', country: 'Germany, Europe', lat: 48.5667, lng: 8.2167 },
  ],
  oceans: [
    { name: 'Great Barrier Reef Marine Sanctuary', region: 'Queensland', country: 'Australia, Pacific Ocean', lat: -18.2871, lng: 147.6992 },
    { name: 'Monterey Bay National Marine Sanctuary', region: 'California', country: 'United States, Pacific Ocean', lat: 36.8000, lng: -121.9000 },
    { name: 'Galápagos Marine Reserve', region: 'Galápagos Islands', country: 'Ecuador, Pacific Ocean', lat: -0.6333, lng: -90.3667 },
  ],
  global_default: [
    { name: 'Serengeti Wildlife Ecosystem', region: 'Mara', country: 'Tanzania, Africa', lat: -2.3333, lng: 34.8333 },
    { name: 'Amazon Biosphere Sanctuary', region: 'Amazonas', country: 'Brazil, South America', lat: -3.4653, lng: -62.2159 },
    { name: 'Gir Forest National Park', region: 'Gujarat', country: 'India, Asia', lat: 21.1245, lng: 70.8242 },
  ],
};

const GLOBAL_ANIMALS_DATA: AnimalData[] = [
  // ─── AFRICA ───
  {
    id: 'lion',
    name: 'Lion',
    emoji: '🦁',
    continent: 'Africa',
    image: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Serengeti National Park', region: 'Mara Region', country: 'Tanzania, Africa', lat: -2.3333, lng: 34.8333 },
      { name: 'Maasai Mara National Reserve', region: 'Narok County', country: 'Kenya, Africa', lat: -1.5021, lng: 35.1439 },
      { name: 'Kruger National Park', region: 'Mpumalanga', country: 'South Africa', lat: -23.9884, lng: 31.5547 },
      { name: 'Gir National Park', region: 'Gujarat', country: 'India, Asia', lat: 21.1245, lng: 70.8242 },
    ],
  },
  {
    id: 'giraffe',
    name: 'Giraffe',
    emoji: '🦒',
    continent: 'Africa',
    image: 'https://images.unsplash.com/photo-1547721064-da6cfb341d50?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Serengeti National Park', region: 'Mara', country: 'Tanzania, Africa', lat: -2.3333, lng: 34.8333 },
      { name: 'Etosha National Park', region: 'Kunene', country: 'Namibia, Africa', lat: -19.1667, lng: 15.9167 },
      { name: 'Murchison Falls National Park', region: 'Buliisa', country: 'Uganda, Africa', lat: 2.2500, lng: 31.8000 },
      { name: 'Chobe National Park', region: 'North-West', country: 'Botswana, Africa', lat: -18.6667, lng: 24.5000 },
    ],
  },
  {
    id: 'gorilla',
    name: 'Mountain Gorilla',
    emoji: '🦍',
    continent: 'Africa',
    image: 'https://images.unsplash.com/photo-1581888227599-779811939961?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Bwindi Impenetrable National Park', region: 'Kanungu', country: 'Uganda, Africa', lat: -1.0500, lng: 29.6167 },
      { name: 'Volcanoes National Park', region: 'Northern Province', country: 'Rwanda, Africa', lat: -1.4833, lng: 29.5333 },
      { name: 'Virunga National Park', region: 'North Kivu', country: 'DR Congo, Africa', lat: -0.0667, lng: 29.5000 },
    ],
  },
  {
    id: 'cheetah',
    name: 'Cheetah',
    emoji: '🐆',
    continent: 'Africa',
    image: 'https://images.unsplash.com/photo-1541781774459-bb2af2f05b55?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Maasai Mara Reserve', region: 'Narok', country: 'Kenya, Africa', lat: -1.5021, lng: 35.1439 },
      { name: 'Serengeti National Park', region: 'Mara', country: 'Tanzania, Africa', lat: -2.3333, lng: 34.8333 },
      { name: 'Central Kalahari Game Reserve', region: 'Ghanzi', country: 'Botswana, Africa', lat: -21.8833, lng: 23.7500 },
    ],
  },
  {
    id: 'hippo',
    name: 'Hippopotamus',
    emoji: '🦛',
    continent: 'Africa',
    image: 'https://images.unsplash.com/photo-1534567153574-2b12153a87f0?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Okavango Delta Wetlands', region: 'Ngamiland', country: 'Botswana, Africa', lat: -19.2833, lng: 22.9000 },
      { name: 'South Luangwa National Park', region: 'Eastern Province', country: 'Zambia, Africa', lat: -13.0833, lng: 31.7500 },
      { name: 'Queen Elizabeth National Park', region: 'Kasese', country: 'Uganda, Africa', lat: -0.2000, lng: 30.0000 },
    ],
  },
  {
    id: 'zebra',
    name: 'Zebra',
    emoji: '🦓',
    continent: 'Africa',
    image: 'https://images.unsplash.com/photo-1526095179574-46e275109230?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Serengeti National Park', region: 'Mara', country: 'Tanzania, Africa', lat: -2.3333, lng: 34.8333 },
      { name: 'Ngorongoro Conservation Area', region: 'Arusha', country: 'Tanzania, Africa', lat: -3.2000, lng: 35.5000 },
      { name: 'Etosha National Park', region: 'Kunene', country: 'Namibia, Africa', lat: -19.1667, lng: 15.9167 },
    ],
  },
  {
    id: 'african_elephant',
    name: 'African Bush Elephant',
    emoji: '🐘',
    continent: 'Africa',
    image: 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Amboseli National Park', region: 'Kajiado', country: 'Kenya, Africa', lat: -2.6527, lng: 37.2606 },
      { name: 'Chobe National Park', region: 'Chobe District', country: 'Botswana, Africa', lat: -18.6667, lng: 24.5000 },
      { name: 'Hwange National Park', region: 'Matabeleland North', country: 'Zimbabwe, Africa', lat: -19.0000, lng: 26.5000 },
      { name: 'Kruger National Park', region: 'Limpopo', country: 'South Africa', lat: -23.9884, lng: 31.5547 },
    ],
  },
  {
    id: 'meerkat',
    name: 'Meerkat',
    emoji: '🐾',
    continent: 'Africa',
    image: 'https://images.unsplash.com/photo-1574870111867-089730e5a72b?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Kgalagadi Transfrontier Park', region: 'Northern Cape', country: 'South Africa', lat: -25.7667, lng: 20.3833 },
      { name: 'Makgadikgadi Pans National Park', region: 'Central District', country: 'Botswana, Africa', lat: -20.5833, lng: 24.8333 },
    ],
  },
  {
    id: 'lemur',
    name: 'Ring-tailed Lemur',
    emoji: '🐒',
    continent: 'Africa',
    image: 'https://images.unsplash.com/photo-1579202673506-ca3ce28943ef?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Andasibe-Mantadia National Park', region: 'Alaotra-Mangoro', country: 'Madagascar, Africa', lat: -18.9333, lng: 48.4167 },
      { name: 'Ranomafana Rainforest', region: 'Vatovavy', country: 'Madagascar, Africa', lat: -21.2500, lng: 47.4500 },
      { name: 'Berenty Reserve Forest', region: 'Anosy', country: 'Madagascar, Africa', lat: -25.0167, lng: 46.3000 },
    ],
  },

  // ─── AMERICAS ───
  {
    id: 'jaguar',
    name: 'Jaguar',
    emoji: '🐆',
    continent: 'Americas',
    image: 'https://images.unsplash.com/photo-1549480017-d76466a4b7e8?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Pantanal Matogrossense Park', region: 'Mato Grosso', country: 'Brazil, South America', lat: -17.5000, lng: -56.5000 },
      { name: 'Amazon Rainforest Reserve', region: 'Amazonas', country: 'Brazil, South America', lat: -3.4653, lng: -62.2159 },
      { name: 'Manu National Park Rainforest', region: 'Madre de Dios', country: 'Peru, South America', lat: -12.2500, lng: -71.5000 },
      { name: 'Corcovado National Park', region: 'Osa Peninsula', country: 'Costa Rica, Central America', lat: 8.5333, lng: -83.5667 },
    ],
  },
  {
    id: 'sloth',
    name: 'Three-toed Sloth',
    emoji: '🦥',
    continent: 'Americas',
    image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Manuel Antonio National Park', region: 'Puntarenas', country: 'Costa Rica, Central America', lat: 9.3833, lng: -84.1333 },
      { name: 'Amazon Rainforest Reserve', region: 'Amazonas', country: 'Brazil, South America', lat: -3.4653, lng: -62.2159 },
      { name: 'Tortuguero Rainforest', region: 'Limón', country: 'Costa Rica, Central America', lat: 10.5333, lng: -83.5000 },
    ],
  },
  {
    id: 'capybara',
    name: 'Capybara',
    emoji: '🦫',
    continent: 'Americas',
    image: 'https://images.unsplash.com/photo-1618281377501-8fac262489e2?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'The Pantanal Wetlands', region: 'Mato Grosso do Sul', country: 'Brazil, South America', lat: -19.0000, lng: -56.0000 },
      { name: 'Esteros del Iberá Wetlands', region: 'Corrientes', country: 'Argentina, South America', lat: -28.5000, lng: -57.5000 },
      { name: 'Llanos Grasslands Reserve', region: 'Casanare', country: 'Colombia, South America', lat: 5.5000, lng: -71.5000 },
    ],
  },
  {
    id: 'macaw',
    name: 'Scarlet Macaw',
    emoji: '🦜',
    continent: 'Americas',
    image: 'https://images.unsplash.com/photo-1550853024-fae8cd4be47f?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Amazon Rainforest', region: 'Madre de Dios', country: 'Peru, South America', lat: -12.8333, lng: -69.3333 },
      { name: 'Corcovado Rainforest', region: 'Puntarenas', country: 'Costa Rica, Central America', lat: 8.5333, lng: -83.5667 },
      { name: 'Tambopata National Reserve', region: 'Madre de Dios', country: 'Peru, South America', lat: -13.0000, lng: -69.5000 },
    ],
  },
  {
    id: 'grizzly',
    name: 'Grizzly Bear',
    emoji: '🐻',
    continent: 'Americas',
    image: 'https://images.unsplash.com/photo-1530595467537-0b5996c41f2d?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Yellowstone National Park', region: 'Wyoming', country: 'United States, North America', lat: 44.4280, lng: -110.5885 },
      { name: 'Banff National Park Forest', region: 'Alberta', country: 'Canada, North America', lat: 51.4968, lng: -115.9281 },
      { name: 'Denali National Park', region: 'Alaska', country: 'United States, North America', lat: 63.1148, lng: -151.1926 },
      { name: 'Glacier National Park', region: 'Montana', country: 'United States, North America', lat: 48.7596, lng: -113.7870 },
    ],
  },
  {
    id: 'bald_eagle',
    name: 'Bald Eagle',
    emoji: '🦅',
    continent: 'Americas',
    image: 'https://images.unsplash.com/photo-1611689342806-0863700ce1e4?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Chilkat Bald Eagle Preserve', region: 'Haines, Alaska', country: 'United States, North America', lat: 59.3833, lng: -135.8500 },
      { name: 'Olympic National Forest', region: 'Washington', country: 'United States, North America', lat: 47.8021, lng: -123.6044 },
      { name: 'Pacific Rim National Park', region: 'British Columbia', country: 'Canada, North America', lat: 48.9833, lng: -125.5500 },
    ],
  },

  // ─── ASIA ───
  {
    id: 'tiger',
    name: 'Bengal Tiger',
    emoji: '🐯',
    continent: 'Asia',
    image: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Ranthambore National Park', region: 'Rajasthan', country: 'India, Asia', lat: 26.0173, lng: 76.5026 },
      { name: 'Jim Corbett National Park', region: 'Uttarakhand', country: 'India, Asia', lat: 29.5300, lng: 78.7747 },
      { name: 'Sundarbans Mangrove Forest', region: 'West Bengal', country: 'India & Bangladesh, Asia', lat: 21.9497, lng: 89.1833 },
      { name: 'Chitwan National Park', region: 'Bagmati', country: 'Nepal, Asia', lat: 27.5333, lng: 84.4500 },
    ],
  },
  {
    id: 'giant_panda',
    name: 'Giant Panda',
    emoji: '🐼',
    continent: 'Asia',
    image: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef6?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Wolong National Nature Reserve', region: 'Sichuan', country: 'China, Asia', lat: 31.0500, lng: 103.1833 },
      { name: 'Chengdu Giant Panda Sanctuary', region: 'Sichuan', country: 'China, Asia', lat: 30.7333, lng: 104.1500 },
      { name: 'Foping Nature Reserve Bamboo Forest', region: 'Shaanxi', country: 'China, Asia', lat: 33.5500, lng: 107.8000 },
    ],
  },
  {
    id: 'orangutan',
    name: 'Bornean Orangutan',
    emoji: '🦧',
    continent: 'Asia',
    image: 'https://images.unsplash.com/photo-1570288685369-f7305163d0e3?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Tanjung Puting National Park Rainforest', region: 'Central Kalimantan', country: 'Indonesia, Asia', lat: -2.8833, lng: 111.9167 },
      { name: 'Gunung Leuser Rainforest', region: 'Sumatra', country: 'Indonesia, Asia', lat: 3.5000, lng: 97.5000 },
    ],
  },
  {
    id: 'komodo',
    name: 'Komodo Dragon',
    emoji: '🦎',
    continent: 'Asia',
    image: 'https://images.unsplash.com/photo-1544979590-37e9b47eb705?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Komodo National Park Island', region: 'East Nusa Tenggara', country: 'Indonesia, Asia', lat: -8.5439, lng: 119.4892 },
      { name: 'Rinca Island Wilderness', region: 'Flores', country: 'Indonesia, Asia', lat: -8.6667, lng: 119.6833 },
    ],
  },
  {
    id: 'snow_leopard',
    name: 'Snow Leopard',
    emoji: '🐆',
    continent: 'Asia',
    image: 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Hemis National Park', region: 'Ladakh', country: 'India, Asia', lat: 33.9167, lng: 77.5833 },
      { name: 'Altai Tavan Bogd National Park', region: 'Bayan-Ölgii', country: 'Mongolia, Asia', lat: 48.5500, lng: 88.0833 },
    ],
  },

  // ─── AUSTRALIA & OCEANIA ───
  {
    id: 'kangaroo',
    name: 'Red Kangaroo',
    emoji: '🦘',
    continent: 'Oceania',
    image: 'https://images.unsplash.com/photo-1563281577-a7be47e20db9?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Flinders Ranges National Park', region: 'South Australia', country: 'Australia, Oceania', lat: -31.4167, lng: 138.7000 },
      { name: 'Kangaroo Island Wilderness', region: 'South Australia', country: 'Australia, Oceania', lat: -35.8333, lng: 137.3333 },
      { name: 'Daintree Rainforest Edge', region: 'Queensland', country: 'Australia, Oceania', lat: -16.2833, lng: 145.4000 },
    ],
  },
  {
    id: 'koala',
    name: 'Koala',
    emoji: '🐨',
    continent: 'Oceania',
    image: 'https://images.unsplash.com/photo-1579762715118-a6f1d4b934f1?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Great Otway Eucalyptus Forest', region: 'Victoria', country: 'Australia, Oceania', lat: -38.7500, lng: 143.5833 },
      { name: 'Blue Mountains National Park Forest', region: 'New South Wales', country: 'Australia, Oceania', lat: -33.7167, lng: 150.3167 },
    ],
  },

  // ─── POLAR REGIONS ───
  {
    id: 'polar_bear',
    name: 'Polar Bear',
    emoji: '🐻‍❄️',
    continent: 'Polar',
    image: 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Wapusk National Park & Tundra', region: 'Churchill, Manitoba', country: 'Canada, North America', lat: 57.7667, lng: -93.6667 },
      { name: 'Svalbard Arctic Archipelago', region: 'Spitsbergen', country: 'Norway, Arctic', lat: 78.2232, lng: 15.6267 },
    ],
  },
  {
    id: 'emperor_penguin',
    name: 'Emperor Penguin',
    emoji: '🐧',
    continent: 'Polar',
    image: 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?auto=format&fit=crop&w=900&q=80',
    forests: [
      { name: 'Ross Sea Coastal Colony', region: 'Ross Dependency', country: 'Antarctica', lat: -77.5000, lng: 166.0000 },
      { name: 'Snow Hill Island Sanctuary', region: 'Weddell Sea', country: 'Antarctica', lat: -64.4667, lng: -57.2000 },
    ],
  },
];

// Curated High-Resolution Fallback Images for common search terms when Wikipedia thumb is unavailable
const HIGH_RES_FALLBACK_IMAGES: Record<string, string> = {
  dog: 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80',
  'domestic dog': 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80',
  'bush dog': 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1200&q=80',
  'african wild dog': 'https://images.unsplash.com/photo-1575550959106-5a7defe28b56?auto=format&fit=crop&w=1200&q=80',
  'japanese raccoon dog': 'https://images.unsplash.com/photo-1604186838347-9faaf0dc6596?auto=format&fit=crop&w=1200&q=80',
  'common raccoon dog': 'https://images.unsplash.com/photo-1604186838347-9faaf0dc6596?auto=format&fit=crop&w=1200&q=80',
  wolf: 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=1200&q=80',
  cat: 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=80',
  lion: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1200&q=80',
  tiger: 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1200&q=80',
};

const getSpeciesPhoto = (title: string, wikiThumb?: string): string => {
  const cleanTitle = title.toLowerCase().trim();

  // 1. If valid Wikipedia thumbnail is available and not an SVG diagram, use authentic species photo directly
  if (wikiThumb && !wikiThumb.includes('.svg')) {
    return wikiThumb;
  }

  // 2. Exact fallback matches when Wikipedia thumbnail is missing
  if (HIGH_RES_FALLBACK_IMAGES[cleanTitle]) {
    return HIGH_RES_FALLBACK_IMAGES[cleanTitle];
  }

  // 3. Smart category fallback
  if (cleanTitle === 'dog' || cleanTitle === 'domestic dog' || cleanTitle === 'puppy') {
    return 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('leopard') && cleanTitle.includes('cat')) {
    return 'https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('leopard') || cleanTitle.includes('cheetah') || cleanTitle.includes('jaguar') || cleanTitle.includes('panther')) {
    return 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('cat') || cleanTitle.includes('kitten') || cleanTitle.includes('feline') || cleanTitle.includes('lynx') || cleanTitle.includes('ocelot')) {
    return 'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('dog') || cleanTitle.includes('canine') || cleanTitle.includes('hound')) {
    return 'https://images.unsplash.com/photo-1543466835-00a7907e9de1?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('wolf')) {
    return 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('panda')) {
    return 'https://images.unsplash.com/photo-1564349683136-77e08dba1ef7?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('bear')) {
    return 'https://images.unsplash.com/photo-1589656966895-2f33e7653819?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('lion')) {
    return 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('tiger')) {
    return 'https://images.unsplash.com/photo-1561731216-c3a4d99437d5?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('fox')) {
    return 'https://images.unsplash.com/photo-1516934024742-b461fba47600?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('parrot') || cleanTitle.includes('macaw') || cleanTitle.includes('cockatoo') || cleanTitle.includes('lorikeet')) {
    return 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('eagle') || cleanTitle.includes('hawk') || cleanTitle.includes('falcon')) {
    return 'https://images.unsplash.com/photo-1611689342806-0863700ce1e4?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('owl')) {
    return 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('bird')) {
    return 'https://images.unsplash.com/photo-1552728089-57bdde30beb3?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('elephant')) {
    return 'https://images.unsplash.com/photo-1557050543-4d5f4e07ef46?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('penguin')) {
    return 'https://images.unsplash.com/photo-1598439210625-5067c578f3f6?auto=format&fit=crop&w=1200&q=80';
  }
  if (cleanTitle.includes('dolphin') || cleanTitle.includes('whale')) {
    return 'https://images.unsplash.com/photo-1570481662006-a3a1374699e8?auto=format&fit=crop&w=1200&q=80';
  }

  return 'https://images.unsplash.com/photo-1534188753412-3e26d0d618d6?auto=format&fit=crop&w=1000&q=80';
};

// Helper to determine best animal emoji using whole-word boundary matching
const detectEmoji = (name: string, extract: string): string => {
  const text = `${name} ${extract}`.toLowerCase();
  const test = (regex: RegExp) => regex.test(text);

  // 1. Birds & Specific Avian Species
  if (test(/\b(parrot|parrots|macaw|macaws|cockatoo|cockatoos|budgerigar|parakeet|lorikeet)\b/)) return '🦜';
  if (test(/\b(penguin|penguins)\b/)) return '🐧';
  if (test(/\b(eagle|eagles|hawk|hawks|falcon|falcons|vulture|vultures)\b/)) return '🦅';
  if (test(/\b(owl|owls)\b/)) return '🦉';
  if (test(/\b(flamingo|flamingos)\b/)) return '🦩';
  if (test(/\b(peacock|peacocks)\b/)) return '🦚';
  if (test(/\b(swan|swans|duck|ducks|goose|geese)\b/)) return '🦆';
  if (test(/\b(bird|birds|avian|toucan|puffin|cassowary|ostrich|emu|stork|heron)\b/)) return '🦤';

  // 2. Dogs & Canines
  if (test(/\b(dog|dogs|canine|canines|puppy|puppies|dingo|jackal|coyote|hound|retriever|shepherd|husky|bulldog|poodle|terrier|dhole|raccoon dog)\b/)) {
    return '🐕';
  }

  // 3. Wolves & Foxes
  if (test(/\b(wolf|wolves)\b/)) return '🐺';
  if (test(/\b(fox|foxes|vulpine)\b/)) return '🦊';

  // 4. Big Cats & Felines (using strict whole-word boundaries to avoid matching "location", "category", etc.)
  if (test(/\b(lion|lions)\b/)) return '🦁';
  if (test(/\b(tiger|tigers)\b/)) return '🐅';
  if (test(/\b(leopard|leopards|cheetah|cheetahs|jaguar|jaguars|panther|panthers|serval|caracal)\b/)) return '🐆';
  if (test(/\b(cat|cats|feline|felines|kitten|kittens|lynx|ocelot|cougar|puma)\b/)) return '🐱';

  // 5. Bears & Pandas
  if (test(/\b(polar bear)\b/)) return '🐻‍❄️';
  if (test(/\b(panda|pandas|giant panda|red panda)\b/)) return '🐼';
  if (test(/\b(bear|bears|grizzly|wolverine)\b/)) return '🐻';

  // 6. Primates
  if (test(/\b(gorilla|gorillas)\b/)) return '🦍';
  if (test(/\b(orangutan|orangutans)\b/)) return '🦧';
  if (test(/\b(monkey|monkeys|primate|primates|lemur|lemurs|chimp|chimpanzee|baboon|macaque|tamarin|gibbon)\b/)) return '🐒';

  // 7. Marine & Aquatic
  if (test(/\b(whale|whales|orca|narwhal|beluga)\b/)) return '🐋';
  if (test(/\b(dolphin|dolphins|porpoise)\b/)) return '🐬';
  if (test(/\b(seal|seals|sea lion|walrus|manatee|dugong)\b/)) return '🦭';
  if (test(/\b(shark|sharks)\b/)) return '🦈';
  if (test(/\b(octopus|squid|cuttlefish)\b/)) return '🐙';
  if (test(/\b(crab|crabs|lobster|lobsters)\b/)) return '🦀';
  if (test(/\b(fish|fishes|trout|salmon|tuna|clownfish)\b/)) return '🐟';

  // 8. Reptiles & Amphibians
  if (test(/\b(snake|snakes|anaconda|python|viper|cobra|mamba|rattlesnake)\b/)) return '🐍';
  if (test(/\b(crocodile|alligator|caiman)\b/)) return '🐊';
  if (test(/\b(turtle|turtles|tortoise|tortoises)\b/)) return '🐢';
  if (test(/\b(lizard|lizards|chameleon|dragon|gecko|iguana|komodo)\b/)) return '🦎';
  if (test(/\b(frog|frogs|toad|toads|amphibian|axolotl|salamander|newt)\b/)) return '🐸';

  // 9. Ungulates & Herbivores
  if (test(/\b(elephant|elephants)\b/)) return '🐘';
  if (test(/\b(rhino|rhinos|rhinoceros)\b/)) return '🦏';
  if (test(/\b(hippo|hippos|hippopotamus)\b/)) return '🦛';
  if (test(/\b(giraffe|giraffes)\b/)) return '🦒';
  if (test(/\b(zebra|zebras)\b/)) return '🦓';
  if (test(/\b(horse|horses|stallion|pony|equine)\b/)) return '🐎';
  if (test(/\b(donkey|donkeys|mule)\b/)) return '🫏';
  if (test(/\b(deer|deers|antelope|gazelle|okapi|ibex|moose|elk|reindeer|caribou|impala|kudu)\b/)) return '🦌';
  if (test(/\b(camel|camels|dromedary|llama|alpaca)\b/)) return '🐪';
  if (test(/\b(bison|buffalo|bull|ox|yak|cow)\b/)) return '🐂';
  if (test(/\b(sheep|ram|lamb|mouflon)\b/)) return '🐑';
  if (test(/\b(goat|goats)\b/)) return '🐐';
  if (test(/\b(pig|pigs|boar|warthog|swine)\b/)) return '🐗';

  // 10. Marsupials & Others
  if (test(/\b(kangaroo|kangaroos|wallaby|quokka|pademelon)\b/)) return '🦘';
  if (test(/\b(koala|koalas)\b/)) return '🐨';
  if (test(/\b(sloth|sloths)\b/)) return '🦥';
  if (test(/\b(otter|otters)\b/)) return '🦦';
  if (test(/\b(skunk|skunks)\b/)) return '🦨';
  if (test(/\b(badger|badgers)\b/)) return '🦡';
  if (test(/\b(hedgehog|hedgehogs|pangolin|echidna|porcupine|armadillo)\b/)) return '🦔';
  if (test(/\b(rabbit|rabbits|hare|bunny)\b/)) return '🐇';
  if (test(/\b(beaver|beavers|capybara)\b/)) return '🦫';
  if (test(/\b(squirrel|squirrels|chipmunk)\b/)) return '🐿️';
  if (test(/\b(rat|rats|mouse|mice|rodent|hamster|gerbil)\b/)) return '🐭';
  if (test(/\b(bat|bats|flying fox)\b/)) return '🦇';
  if (test(/\b(butterfly|moth)\b/)) return '🦋';
  if (test(/\b(bee|wasp)\b/)) return '🐝';

  return '🐾';
};

// Helper to derive global forest habitats for any world species
const deriveGlobalHabitats = (wikiTitle: string, extract: string): ForestLocation[] => {
  const text = `${wikiTitle} ${extract}`.toLowerCase();

  if (text.includes('dog') || text.includes('domestic dog') || text.includes('puppy') || text.includes('canine') || text.includes('hound')) {
    return REGIONAL_HABITAT_MAP.dog;
  }
  if (text.includes('australia') || text.includes('tasmania') || text.includes('rottnest') || text.includes('queensland')) {
    return REGIONAL_HABITAT_MAP.australia;
  }
  if (text.includes('mexico') || text.includes('xochimilco') || text.includes('mesoamerica')) {
    return REGIONAL_HABITAT_MAP.mexico;
  }
  if (text.includes('madagascar') || text.includes('malagasy')) {
    return REGIONAL_HABITAT_MAP.madagascar;
  }
  if (text.includes('congo') || text.includes('ituri') || text.includes('central africa') || text.includes('uganda') || text.includes('rwanda')) {
    return REGIONAL_HABITAT_MAP.congo;
  }
  if (text.includes('amazon') || text.includes('brazil') || text.includes('peru') || text.includes('colombia') || text.includes('ecuador') || text.includes('south america') || text.includes('pantanal')) {
    return REGIONAL_HABITAT_MAP.amazon;
  }
  if (text.includes('arctic') || text.includes('svalbard') || text.includes('greenland') || text.includes('norway') || text.includes('iceland') || text.includes('tundra')) {
    return REGIONAL_HABITAT_MAP.arctic;
  }
  if (text.includes('antarctica') || text.includes('antarctic') || text.includes('subantarctic')) {
    return REGIONAL_HABITAT_MAP.antarctica;
  }
  if (text.includes('new zealand') || text.includes('maori')) {
    return REGIONAL_HABITAT_MAP.new_zealand;
  }
  if (text.includes('china') || text.includes('sichuan') || text.includes('tibetan') || text.includes('himalaya') || text.includes('nepal')) {
    return REGIONAL_HABITAT_MAP.china;
  }
  if (text.includes('indonesia') || text.includes('borneo') || text.includes('sumatra') || text.includes('malaysia') || text.includes('komodo') || text.includes('southeast asia')) {
    return REGIONAL_HABITAT_MAP.indonesia;
  }
  if (text.includes('sahara') || text.includes('kalahari') || text.includes('namib') || text.includes('algeria') || text.includes('desert')) {
    return REGIONAL_HABITAT_MAP.sahara;
  }
  if (text.includes('north america') || text.includes('united states') || text.includes('canada') || text.includes('alaska') || text.includes('rocky mountain') || text.includes('california')) {
    return REGIONAL_HABITAT_MAP.north_america;
  }
  if (text.includes('europe') || text.includes('spain') || text.includes('germany') || text.includes('poland') || text.includes('scotland') || text.includes('france') || text.includes('italy')) {
    return REGIONAL_HABITAT_MAP.europe;
  }
  if (text.includes('ocean') || text.includes('pacific') || text.includes('atlantic') || text.includes('indian ocean') || text.includes('marine') || text.includes('sea')) {
    return REGIONAL_HABITAT_MAP.oceans;
  }
  if (text.includes('india') || text.includes('bengal') || text.includes('sundarbans') || text.includes('gir') || text.includes('kaziranga') || text.includes('western ghats')) {
    return REGIONAL_HABITAT_MAP.india;
  }

  // Default global wildlife reserve
  return REGIONAL_HABITAT_MAP.global_default;
};

export const AnimalLocation: React.FC = () => {
  const [selectedAnimal, setSelectedAnimal] = useState<AnimalData>(GLOBAL_ANIMALS_DATA[0]);
  const [selectedForest, setSelectedForest] = useState<ForestLocation | null>(GLOBAL_ANIMALS_DATA[0].forests[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedContinent, setSelectedContinent] = useState('All');
  const [liveResults, setLiveResults] = useState<AnimalData[]>([]);
  const [isSearchingOnline, setIsSearchingOnline] = useState(false);

  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersGroupRef = useRef<any>(null);

  // Dynamic Live Global Species Lookup
  useEffect(() => {
    const q = searchQuery.trim();
    if (q.length < 2) {
      setLiveResults([]);
      setIsSearchingOnline(false);
      return;
    }

    // Check if query exists in local built-in list
    const localMatch = GLOBAL_ANIMALS_DATA.some(
      (a) => a.name.toLowerCase().includes(q.toLowerCase())
    );

    const timer = setTimeout(async () => {
      setIsSearchingOnline(true);
      try {
        const wikiSpecies = await searchWikipediaSpecies(q);
        if (wikiSpecies && wikiSpecies.length > 0) {
          const dynamicAnimals: AnimalData[] = wikiSpecies.map((ws, index) => {
            const habitats = deriveGlobalHabitats(ws.title, ws.extract || '');
            const emoji = detectEmoji(ws.title, ws.extract || '');
            const photo = getSpeciesPhoto(ws.title, ws.thumbnail?.source);

            return {
              id: `live_${ws.title.toLowerCase().replace(/\s+/g, '_')}_${index}`,
              name: ws.title,
              emoji: emoji,
              continent: 'Global',
              image: photo,
              forests: habitats,
              isLive: true,
            };
          });

          setLiveResults(dynamicAnimals);

          // If no local match, auto-select the first live global species
          if (!localMatch && dynamicAnimals.length > 0) {
            setSelectedAnimal(dynamicAnimals[0]);
            setSelectedForest(dynamicAnimals[0].forests[0] || null);
          }
        } else {
          setLiveResults([]);
        }
      } catch (err) {
        console.error('Live global search error:', err);
      } finally {
        setIsSearchingOnline(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Combine built-in with live search results
  const allAvailableAnimals = [...liveResults, ...GLOBAL_ANIMALS_DATA];

  const filteredAnimals = allAvailableAnimals.filter((animal) => {
    const matchesContinent = selectedContinent === 'All' || animal.continent === selectedContinent || animal.continent === 'Global';
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesContinent;

    const matchName = animal.name.toLowerCase().includes(q);
    const matchForest = animal.forests.some(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.region.toLowerCase().includes(q) ||
        f.country.toLowerCase().includes(q)
    );

    return matchesContinent && (matchName || matchForest);
  });

  // Handle Animal Selection
  const handleSelectAnimal = (animal: AnimalData) => {
    setSelectedAnimal(animal);
    setSelectedForest(animal.forests[0] || null);
  };

  // Initialize and update Leaflet Map
  useEffect(() => {
    const L = (window as any).L;
    if (!L || !mapContainerRef.current) return;

    if (!mapInstanceRef.current) {
      const map = L.map(mapContainerRef.current, {
        center: [20, 0],
        zoom: 2,
        minZoom: 1,
        maxZoom: 18,
        zoomControl: true,
        scrollWheelZoom: true,
        worldCopyJump: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 18,
      }).addTo(map);

      mapInstanceRef.current = map;
      markersGroupRef.current = L.layerGroup().addTo(map);
    }

    const map = mapInstanceRef.current;
    const markersGroup = markersGroupRef.current;
    if (!map || !markersGroup) return;

    markersGroup.clearLayers();

    const bounds: [number, number][] = [];

    selectedAnimal.forests.forEach((forest) => {
      bounds.push([forest.lat, forest.lng]);

      const customIcon = L.divIcon({
        className: 'custom-wildlife-marker',
        html: `
          <div style="
            position: relative;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 44px;
            height: 44px;
            cursor: pointer;
          ">
            <div style="
              position: absolute;
              width: 44px;
              height: 44px;
              border-radius: 50%;
              background: rgba(61, 107, 79, 0.28);
              animation: pulseGlow 2s infinite ease-in-out;
            "></div>
            <div style="
              width: 36px;
              height: 36px;
              border-radius: 50%;
              background: #ffffff;
              border: 2.5px solid #2d5a3a;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 18px;
              box-shadow: 0 4px 14px rgba(0,0,0,0.28);
              transform: translateY(-2px);
              transition: transform 0.2s ease;
            ">
              ${selectedAnimal.emoji}
            </div>
            <div style="
              position: absolute;
              bottom: 0;
              width: 8px;
              height: 8px;
              border-radius: 50%;
              background: #2d5a3a;
              box-shadow: 0 2px 4px rgba(0,0,0,0.3);
            "></div>
          </div>
        `,
        iconSize: [44, 44],
        iconAnchor: [22, 42],
        popupAnchor: [0, -40],
      });

      const marker = L.marker([forest.lat, forest.lng], { icon: customIcon });

      const popupContent = `
        <div style="
          font-family: var(--font-sans, -apple-system, sans-serif);
          padding: 8px 10px;
          min-width: 190px;
          text-align: left;
        ">
          <div style="
            display: flex;
            align-items: center;
            gap: 6px;
            font-size: 15px;
            font-weight: 800;
            color: #1a2e1f;
            margin-bottom: 4px;
          ">
            <span>${selectedAnimal.emoji}</span>
            <span>${selectedAnimal.name}</span>
          </div>
          <div style="
            font-size: 12.5px;
            font-weight: 600;
            color: #2d5a3a;
            display: flex;
            align-items: center;
            gap: 4px;
          ">
            <span>Forest:</span>
            <strong style="color: #1a1a1a;">${forest.name}</strong>
          </div>
          <div style="
            font-size: 11px;
            color: #7a8b7e;
            margin-top: 2px;
          ">
            ${forest.country}
          </div>
        </div>
      `;

      marker.bindPopup(popupContent);
      marker.on('click', () => {
        setSelectedForest(forest);
      });

      markersGroup.addLayer(marker);
    });

    if (bounds.length > 1) {
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 6 });
    } else if (bounds.length === 1) {
      map.setView(bounds[0], 5, { animate: true });
    }

    // Invalidate map size to adapt to container width
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 200);
  }, [selectedAnimal]);

  // Handle window resizing for responsive Leaflet map
  useEffect(() => {
    const handleResize = () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleForestClick = (forest: ForestLocation) => {
    setSelectedForest(forest);
    const L = (window as any).L;
    if (mapInstanceRef.current && L) {
      mapInstanceRef.current.flyTo([forest.lat, forest.lng], 6, {
        duration: 1.4,
      });

      if (markersGroupRef.current) {
        markersGroupRef.current.eachLayer((layer: any) => {
          const pos = layer.getLatLng();
          if (Math.abs(pos.lat - forest.lat) < 0.01 && Math.abs(pos.lng - forest.lng) < 0.01) {
            layer.openPopup();
          }
        });
      }
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.2rem', width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>

      {/* ─── CLEAN HEADER & FILTER TOOLBAR ─── */}
      <div className="glass-card anim-1 animal-location-header" style={{ padding: '1.2rem 1.4rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.6rem' }}>
          <div>
            <h1 style={{
              fontSize: '1.45rem', fontWeight: 900, color: 'var(--text-dark)',
              letterSpacing: '-0.02em', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem',
            }}>
              <Globe style={{ width: '22px', height: '22px', color: 'var(--forest)', flexShrink: 0 }} />
              Universal Animal Location & Habitats
            </h1>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0' }}>
              Search ANY wildlife species in the world to discover its global forest habitats.
            </p>
          </div>

          <div className="badge-forest" style={{ padding: '0.35rem 0.75rem', flexShrink: 0, fontSize: '0.78rem' }}>
            <Compass style={{ width: '13px', height: '13px', color: 'var(--forest)' }} />
            <span>Worldwide Coverage</span>
          </div>
        </div>

        {/* ─── STREAMLINED SEARCH & FILTER TOOLBAR ─── */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          marginTop: '1.1rem',
          flexWrap: 'wrap',
          width: '100%',
        }}>

          {/* Live Search Input */}
          <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
            <input
              type="text"
              placeholder="Search any animal worldwide (e.g. Dog, Wolf, Lion, Panda, Koala...)"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-glass"
              style={{
                paddingLeft: '2.5rem',
                paddingRight: isSearchingOnline ? '7.5rem' : (searchQuery ? '2.5rem' : '1rem'),
                fontSize: '0.92rem',
                borderRadius: 'var(--radius-lg)',
                height: '44px',
                width: '100%',
                boxSizing: 'border-box',
              }}
            />
            <Search style={{
              width: '18px', height: '18px', color: 'var(--text-muted)',
              position: 'absolute', left: '0.95rem', top: '50%', transform: 'translateY(-50%)',
            }} />

            {searchQuery && !isSearchingOnline && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)',
                  background: 'rgba(0,0,0,0.08)', border: 'none', borderRadius: '50%', width: '22px', height: '22px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-dark)',
                }}
                title="Clear Search"
              >
                <X style={{ width: '12px', height: '12px' }} />
              </button>
            )}

            {isSearchingOnline && (
              <div style={{
                position: 'absolute', right: '0.8rem', top: '50%', transform: 'translateY(-50%)',
                display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.74rem', color: 'var(--forest)', fontWeight: 600,
              }}>
                <RefreshCw style={{ width: '12px', height: '12px' }} className="loading-spinner" />
                <span>Searching DB...</span>
              </div>
            )}
          </div>

          {/* Clean Continent Filter Option Dropdown */}
          <div className="map-widget-solid" style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0 2.2rem 0 0.85rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--mint-border)',
            height: '44px',
            boxSizing: 'border-box',
            flexShrink: 0,
          }}>
            <Filter style={{ width: '14px', height: '14px', color: 'var(--forest)', flexShrink: 0 }} />
            <select
              value={selectedContinent}
              onChange={(e) => setSelectedContinent(e.target.value)}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '0.84rem',
                fontWeight: 600,
                color: 'var(--text-dark)',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
              }}
            >
              <option value="All">🌍 All Continents</option>
              <option value="Africa">🌍 Africa</option>
              <option value="Americas">🌎 Americas</option>
              <option value="Asia">🌏 Asia</option>
              <option value="Oceania">🌏 Oceania</option>
              <option value="Polar">❄️ Polar Regions</option>
              <option value="Oceans">🌊 Oceans</option>
            </select>
            <ChevronDown style={{
              width: '13px',
              height: '13px',
              color: 'var(--forest)',
              position: 'absolute',
              right: '0.75rem',
              pointerEvents: 'none',
            }} />
          </div>

          {/* Quick Species Select Dropdown */}
          <div className="map-widget-solid" style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0 2.2rem 0 0.85rem',
            borderRadius: 'var(--radius-lg)',
            border: '1px solid var(--mint-border)',
            height: '44px',
            boxSizing: 'border-box',
            flexShrink: 0,
            maxWidth: '280px',
          }}>
            <span style={{ fontSize: '1.1rem', flexShrink: 0, lineHeight: 1 }}>{selectedAnimal.emoji}</span>
            <select
              value={selectedAnimal.id}
              onChange={(e) => {
                const found = allAvailableAnimals.find(a => a.id === e.target.value);
                if (found) handleSelectAnimal(found);
              }}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '0.84rem',
                fontWeight: 700,
                color: 'var(--text-dark)',
                cursor: 'pointer',
                outline: 'none',
                appearance: 'none',
                WebkitAppearance: 'none',
                MozAppearance: 'none',
                textOverflow: 'ellipsis',
                maxWidth: '190px',
              }}
            >
              {filteredAnimals.map((animal) => (
                <option key={animal.id} value={animal.id} style={{ background: '#ffffff', color: '#1a1a1a' }}>
                  {animal.emoji} {animal.name} {animal.isLive ? '• Live' : ''}
                </option>
              ))}
            </select>
            <ChevronDown style={{
              width: '13px',
              height: '13px',
              color: 'var(--forest)',
              position: 'absolute',
              right: '0.75rem',
              pointerEvents: 'none',
            }} />
          </div>

        </div>
      </div>

      {/* ─── MAIN TWO-COLUMN VIEW: ANIMAL CARD & INTERACTIVE WORLD MAP ─── */}
      <div className="animal-location-grid">

        {/* ─── LEFT: ANIMAL CARD ─── */}
        <div className="glass-card anim-2 animal-card-col" style={{
          padding: '1.3rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          gap: '1.1rem',
        }}>
          <div>
            {/* Animal Photo */}
            <div className="animal-card-image" style={{
              position: 'relative',
              width: '100%',
              height: '220px',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              boxShadow: '0 4px 16px rgba(0,0,0,0.12)',
              marginBottom: '1rem',
              background: '#1a2e1f',
            }}>
              <img
                src={selectedAnimal.image}
                alt={selectedAnimal.name}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                  transition: 'transform 0.3s ease',
                }}
                onError={(e: any) => {
                  e.target.onerror = null;
                  e.target.src = getSpeciesPhoto(selectedAnimal.name);
                }}
              />
              <div style={{
                position: 'absolute',
                inset: 0,
                background: 'linear-gradient(to top, rgba(0,0,0,0.72) 0%, transparent 60%)',
              }} />

              <div style={{
                position: 'absolute',
                bottom: '0.85rem',
                left: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.55rem',
              }}>
                <span style={{
                  fontSize: '1.85rem',
                  filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.5))',
                }}>
                  {selectedAnimal.emoji}
                </span>
                <div>
                  <h3 style={{
                    fontSize: '1.35rem',
                    fontWeight: 900,
                    color: '#ffffff',
                    margin: 0,
                    lineHeight: 1.1,
                    textShadow: '0 2px 8px rgba(0,0,0,0.6)',
                  }}>
                    {selectedAnimal.name}
                  </h3>
                  {selectedAnimal.isLive && (
                    <span style={{
                      fontSize: '0.66rem',
                      color: 'rgba(255,255,255,0.85)',
                      fontWeight: 700,
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.25rem',
                      marginTop: '0.15rem',
                    }}>
                      <Sparkles style={{ width: '10px', height: '10px', color: '#34d399' }} />
                      Live Global Discovery
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Forest Locations List Across the World */}
            <div>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                marginBottom: '0.6rem',
              }}>
                <Trees style={{ width: '15px', height: '15px', color: 'var(--forest)' }} />
                <span style={{ fontSize: '0.84rem', fontWeight: 800, color: 'var(--text-dark)' }}>
                  Worldwide Habitats ({selectedAnimal.forests.length})
                </span>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem', maxHeight: '250px', overflowY: 'auto' }}>
                {selectedAnimal.forests.map((forest, idx) => {
                  const isForestActive = selectedForest?.name === forest.name;
                  return (
                    <div
                      key={idx}
                      onClick={() => handleForestClick(forest)}
                      className="chip-solid"
                      style={{
                        padding: '0.7rem 0.85rem',
                        borderRadius: 'var(--radius-md)',
                        background: isForestActive ? 'var(--mint-bg)' : undefined,
                        border: isForestActive ? '1.5px solid var(--forest)' : '1px solid var(--mint-border)',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                        <div style={{
                          width: '26px',
                          height: '26px',
                          borderRadius: '8px',
                          background: isForestActive ? 'var(--forest)' : 'rgba(61,107,79,0.12)',
                          color: isForestActive ? '#ffffff' : 'var(--forest)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <MapPin style={{ width: '13px', height: '13px' }} />
                        </div>
                        <div style={{ minWidth: 0, overflow: 'hidden' }}>
                          <h4 style={{
                            fontSize: '0.84rem',
                            fontWeight: 800,
                            color: 'var(--text-dark)',
                            margin: 0,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}>
                            {forest.name}
                          </h4>
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {forest.country}
                          </span>
                        </div>
                      </div>

                      <ChevronRight style={{
                        width: '15px',
                        height: '15px',
                        color: isForestActive ? 'var(--forest)' : 'var(--text-light)',
                        flexShrink: 0,
                      }} />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Helper hint */}
          <div style={{
            padding: '0.65rem 0.85rem',
            background: 'rgba(61, 107, 79, 0.06)',
            borderRadius: 'var(--radius-md)',
            border: '1px solid var(--mint-border)',
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            fontSize: '0.74rem',
            color: 'var(--forest)',
          }}>
            <Navigation style={{ width: '13px', height: '13px', flexShrink: 0 }} />
            <span>Click any forest or map marker to fly to location.</span>
          </div>
        </div>

        {/* ─── RIGHT: INTERACTIVE WORLD MAP ─── */}
        <div className="glass-card anim-3 animal-map-col" style={{
          padding: '1.1rem',
          display: 'flex',
          flexDirection: 'column',
          minHeight: '480px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: '0.75rem',
            flexWrap: 'wrap',
            gap: '0.4rem',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
              <span style={{ fontSize: '1.15rem' }}>{selectedAnimal.emoji}</span>
              <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--text-dark)', margin: 0 }}>
                {selectedAnimal.name} Worldwide Habitat Map
              </h3>
            </div>

            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', fontWeight: 600 }}>
              {selectedAnimal.forests.length} Location{selectedAnimal.forests.length > 1 ? 's' : ''}
            </div>
          </div>

          {/* Leaflet World Map Container */}
          <div
            ref={mapContainerRef}
            style={{
              width: '100%',
              flex: 1,
              minHeight: '400px',
              borderRadius: 'var(--radius-lg)',
              overflow: 'hidden',
              border: '1px solid var(--mint-border)',
              zIndex: 1,
              boxSizing: 'border-box',
            }}
          />
        </div>

      </div>

    </div>
  );
};
