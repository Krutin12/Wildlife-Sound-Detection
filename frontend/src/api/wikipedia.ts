export interface WikiResult {
  title: string;
  displaytitle?: string;
  description?: string;
  extract: string;
  thumbnail?: {
    source: string;
    width: number;
    height: number;
  };
  content_urls?: {
    desktop?: {
      page: string;
    };
  };
}

const isBiologicalSpecies = (summary: WikiResult): boolean => {
  if (!summary || !summary.extract) return false;
  const titleLower = summary.title.toLowerCase();
  const descLower = (summary.description || '').toLowerCase();
  const text = `${titleLower} ${descLower} ${summary.extract}`.toLowerCase();

  // Exclude list / meta / non-species titles
  if (
    titleLower.startsWith('list of') ||
    titleLower.startsWith('index of') ||
    titleLower.startsWith('comparison of') ||
    titleLower.startsWith('glossary of') ||
    titleLower.startsWith('timeline of') ||
    titleLower.startsWith('taxonomy of') ||
    titleLower.startsWith('evolution of') ||
    descLower.includes('list article') ||
    descLower.includes('wikimedia list')
  ) {
    return false;
  }

  // Exclude non-species / disambiguation keywords
  const excludeKeywords = [
    'disambiguation', 'company', 'retailer', 'brand', 'clothing', 'album',
    'song', 'film', 'movie', 'city in', 'town in', 'village in', 'country in',
    'football club', 'video game', 'software', 'corporation', 'business'
  ];
  if (excludeKeywords.some(kw => text.includes(kw))) return false;

  // Require biological organism / species keywords
  const speciesKeywords = [
    'species', 'genus', 'family', 'subspecies', 'taxon', 'taxonomic', 'organism',
    'bird', 'parrot', 'mammal', 'reptile', 'amphibian', 'insect', 'fish', 'animal', 'plant',
    'tree', 'fungus', 'fauna', 'flora', 'passerine', 'raptor', 'carnivore', 'herbivore',
    'primate', 'rodent', 'cetacean', 'mollusc', 'crustacean', 'suborder', 'order of',
    'canine', 'feline', 'wildlife', 'domesticated'
  ];

  return speciesKeywords.some(kw => text.includes(kw));
};

export const fetchWikipediaSummary = async (title: string): Promise<WikiResult | null> => {
  try {
    const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error('Wikipedia summary error:', err);
    return null;
  }
};

export const searchWikipediaSpecies = async (query: string): Promise<WikiResult[]> => {
  if (!query || query.trim().length < 2) return [];
  const cleanQuery = query.trim();

  try {
    const resultsMap = new Map<string, WikiResult>();

    // 1. First, attempt direct exact title lookup (e.g. "Parrot", "Dog", "Axolotl", "Okapi")
    const directSummary = await fetchWikipediaSummary(cleanQuery);
    if (directSummary && isBiologicalSpecies(directSummary)) {
      resultsMap.set(directSummary.title, directSummary);
    }

    // 2. Search with biological species queries
    const searchQueries = [
      `${cleanQuery} species`,
      `${cleanQuery} animal`,
      cleanQuery
    ];

    for (const sq of searchQueries) {
      if (resultsMap.size >= 6) break;

      const searchUrl = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(sq)}&format=json&origin=*&srlimit=8`;
      const searchRes = await fetch(searchUrl);
      if (!searchRes.ok) continue;
      const searchData = await searchRes.json();
      const searchItems = searchData.query?.search || [];

      for (const item of searchItems) {
        if (resultsMap.has(item.title)) continue;
        if (item.title.toLowerCase().startsWith('list of')) continue;

        const summary = await fetchWikipediaSummary(item.title);
        if (summary && isBiologicalSpecies(summary)) {
          resultsMap.set(item.title, summary);
        }
        if (resultsMap.size >= 6) break;
      }
    }

    return Array.from(resultsMap.values());
  } catch (err) {
    console.error('Wikipedia search error:', err);
    return [];
  }
};
