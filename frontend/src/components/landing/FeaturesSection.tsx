import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Radio,
  BookOpen,
  Clock,
  MapPin,
  GraduationCap,
  BarChart3,
  ArrowUpRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { CORE_FEATURES } from './wildlifeData';

interface FeaturesSectionProps {
  onSelectFeature?: (featureId: string) => void;
}

export const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onSelectFeature }) => {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const getFeatureIcon = (iconName: string) => {
    switch (iconName) {
      case 'Radio':
        return <Radio className="w-6 h-6 text-emerald-700" />;
      case 'BookOpen':
        return <BookOpen className="w-6 h-6 text-teal-700" />;
      case 'Clock':
        return <Clock className="w-6 h-6 text-sky-700" />;
      case 'MapPin':
        return <MapPin className="w-6 h-6 text-emerald-700" />;
      case 'GraduationCap':
        return <GraduationCap className="w-6 h-6 text-amber-700" />;
      case 'BarChart3':
        return <BarChart3 className="w-6 h-6 text-teal-700" />;
      default:
        return <Sparkles className="w-6 h-6 text-emerald-700" />;
    }
  };

  return (
    <section
      id="features"
      className="py-24 bg-gradient-to-b from-white via-emerald-50/30 to-mint-50/20 relative"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100/70 text-teal-900 text-xs font-bold uppercase tracking-wider border border-teal-200">
            <span>Modular Bioacoustic Capabilities</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Designed for Researchers, Rangers, and Naturalists
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            Everything needed to monitor biodiversity non-invasively, analyze acoustic patterns, and preserve vulnerable ecosystems in one modern intelligence platform.
          </p>
        </div>

        {/* 6 Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {CORE_FEATURES.map((feature, idx) => (
            <motion.div
              key={feature.id}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: '-30px' }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              onMouseEnter={() => setHoveredCard(feature.id)}
              onMouseLeave={() => setHoveredCard(null)}
              onClick={() => onSelectFeature && onSelectFeature(feature.id)}
              className="group relative bg-white/85 backdrop-blur-md border border-slate-200/90 hover:border-emerald-300/80 rounded-3xl p-7 shadow-sm hover:shadow-xl hover:shadow-emerald-950/10 transition-all duration-300 flex flex-col justify-between cursor-pointer overflow-hidden"
            >
              {/* Subtle Ambient Hover Glow */}
              <div
                className={`absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br ${feature.gradient} rounded-full blur-2xl transition-opacity duration-300 ${
                  hoveredCard === feature.id ? 'opacity-100' : 'opacity-0'
                }`}
              />

              <div className="relative z-10 space-y-4">
                {/* Header Icon + Tag */}
                <div className="flex items-center justify-between">
                  <div className="w-13 h-13 p-3.5 rounded-2xl bg-slate-50 border border-slate-200/80 group-hover:scale-105 group-hover:bg-emerald-50 group-hover:border-emerald-200 transition-all duration-300 shadow-inner">
                    {getFeatureIcon(feature.icon)}
                  </div>
                  <span
                    className={`text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${feature.badgeColor}`}
                  >
                    {feature.tag}
                  </span>
                </div>

                <div>
                  <h3 className="text-lg font-bold text-slate-900 group-hover:text-emerald-800 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-xs font-semibold text-emerald-700/80 mt-0.5">
                    {feature.subtitle}
                  </p>
                </div>

                <p className="text-sm text-slate-600 leading-relaxed">
                  {feature.description}
                </p>
              </div>

              {/* Bottom Interactive Arrow */}
              <div className="relative z-10 mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-500 group-hover:text-emerald-700 transition-colors">
                <span>Explore capability</span>
                <div className="w-7 h-7 rounded-full bg-slate-100 group-hover:bg-emerald-100 flex items-center justify-center transition-colors">
                  <ArrowUpRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
