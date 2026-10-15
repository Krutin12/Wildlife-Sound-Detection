import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Search,
  Volume2,
  VolumeX,
  Play,
  Pause,
  MapPin,
  Compass,
  Radio,
  Tag,
  Sparkles,
} from 'lucide-react';
import { FEATURED_WILDLIFE, WildlifeSpecies } from './wildlifeData';

export const ExploreWildlifeSection: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [playingId, setPlayingId] = useState<string | null>(null);

  const categories = [
    { id: 'all', label: 'All Species' },
    { id: 'birds', label: 'Birds' },
    { id: 'mammals', label: 'Mammals' },
    { id: 'amphibians', label: 'Amphibians' },
    { id: 'insects', label: 'Insects' },
  ];

  const filteredSpecies = FEATURED_WILDLIFE.filter((item) => {
    const matchesCategory =
      selectedCategory === 'all' || item.category === selectedCategory;
    const matchesQuery =
      item.commonName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.scientificName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.habitat.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesQuery;
  });

  const togglePlayAudio = (id: string) => {
    if (playingId === id) {
      setPlayingId(null);
    } else {
      setPlayingId(id);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Endangered':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'Vulnerable':
        return 'bg-amber-50 text-amber-800 border-amber-200';
      case 'Near Threatened':
        return 'bg-yellow-50 text-yellow-800 border-yellow-200';
      default:
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
    }
  };

  return (
    <section id="species" className="py-24 bg-slate-50/60 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100/70 text-emerald-900 text-xs font-bold uppercase tracking-wider border border-emerald-200">
            <Compass className="w-3.5 h-3.5 text-emerald-700" />
            <span>Bioacoustic Taxonomy</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Explore Wildlife Sound Catalog
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Discover verified vocalization profiles across bird, mammal, amphibian, and insect
            species captured in protected wildlife habitats worldwide.
          </p>
        </div>

        {/* Search & Category Filter Controls */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 mb-10 max-w-5xl mx-auto">
          {/* Search Field */}
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by common or scientific name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white border border-slate-200 rounded-2xl text-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 shadow-sm transition-all"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 sm:pb-0 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all duration-200 ${
                  selectedCategory === cat.id
                    ? 'bg-emerald-700 text-white shadow-md shadow-emerald-900/10'
                    : 'bg-white hover:bg-slate-100 text-slate-600 border border-slate-200/80'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>
        </div>

        {/* Species Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredSpecies.map((species, idx) => {
              const isAudioActive = playingId === species.id;
              return (
                <motion.div
                  key={species.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.35, delay: idx * 0.05 }}
                  className="group bg-white rounded-3xl overflow-hidden border border-slate-200/90 hover:border-emerald-300 shadow-sm hover:shadow-xl hover:shadow-emerald-950/10 transition-all duration-300 flex flex-col justify-between"
                >
                  {/* Image & Badges */}
                  <div>
                    <div className="relative h-56 overflow-hidden bg-slate-100">
                      <img
                        src={species.imageUrl}
                        alt={species.commonName}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-transparent to-transparent" />

                      {/* Top Status & Category Badges */}
                      <div className="absolute top-4 left-4 right-4 flex items-center justify-between">
                        <span
                          className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border backdrop-blur-md ${getStatusBadge(
                            species.status
                          )}`}
                        >
                          {species.status}
                        </span>

                        <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-white/90 text-slate-800 backdrop-blur-md">
                          {species.categoryLabel}
                        </span>
                      </div>

                      {/* Bottom Name inside Image overlay */}
                      <div className="absolute bottom-3.5 left-4 right-4 text-white">
                        <h3 className="text-xl font-bold tracking-tight">
                          {species.commonName}
                        </h3>
                        <p className="text-xs text-emerald-200 italic font-mono">
                          {species.scientificName}
                        </p>
                      </div>
                    </div>

                    {/* Card Body */}
                    <div className="p-6 space-y-4">
                      <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
                        {species.description}
                      </p>

                      <div className="space-y-2 pt-1 border-t border-slate-100 text-xs">
                        <div className="flex items-center justify-between text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Habitat:</span>
                          </span>
                          <span className="font-semibold text-slate-800 text-right truncate max-w-[170px]">
                            {species.habitat}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-slate-500">
                          <span className="flex items-center gap-1.5">
                            <Radio className="w-3.5 h-3.5 text-teal-600" />
                            <span>Freq Range:</span>
                          </span>
                          <span className="font-mono font-semibold text-slate-800">
                            {species.frequencyRange}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Audio Preview Footer Bar */}
                  <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                    <button
                      onClick={() => togglePlayAudio(species.id)}
                      className={`flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                        isAudioActive
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-white hover:bg-emerald-50 text-slate-700 hover:text-emerald-800 border border-slate-200'
                      }`}
                    >
                      {isAudioActive ? (
                        <>
                          <Pause className="w-3.5 h-3.5" />
                          <span>Pause Call</span>
                        </>
                      ) : (
                        <>
                          <Play className="w-3.5 h-3.5 ml-0.5 text-emerald-600" />
                          <span>Sample Audio</span>
                        </>
                      )}
                    </button>

                    {/* Mini Waveform Display */}
                    <div className="flex items-end gap-0.5 h-5 px-2">
                      {species.waveformFrequencies.slice(0, 14).map((h, barIdx) => (
                        <div
                          key={barIdx}
                          className={`w-1 rounded-full transition-all ${
                            isAudioActive
                              ? 'bg-emerald-500 animate-pulse'
                              : 'bg-slate-300'
                          }`}
                          style={{ height: `${(h / 100) * 20}px` }}
                        />
                      ))}
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>

        {filteredSpecies.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 max-w-md mx-auto">
            <VolumeX className="w-10 h-10 text-slate-400 mx-auto mb-3" />
            <h4 className="text-base font-bold text-slate-800">No species match your query</h4>
            <p className="text-xs text-slate-500 mt-1">
              Try adjusting your search terms or selecting another category filter.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
