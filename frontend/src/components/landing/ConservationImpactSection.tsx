import React from 'react';
import { motion } from 'framer-motion';
import {
  Heart,
  TreePine,
  ShieldCheck,
  Globe2,
  ArrowRight,
  Sparkles,
  Users,
  Compass,
} from 'lucide-react';

interface ConservationImpactSectionProps {
  onJoinClick: () => void;
}

export const ConservationImpactSection: React.FC<ConservationImpactSectionProps> = ({
  onJoinClick,
}) => {
  const impacts = [
    {
      title: 'Non-Invasive Habitat Monitoring',
      description: 'Passive acoustic sensors continuously survey canopies and wetlands 24/7 without disturbing wildlife or modifying animal behaviors.',
      icon: TreePine,
    },
    {
      title: 'Anti-Poaching & Threat Early Warning',
      description: 'Acoustic anomaly detection isolates sudden gunshot echoes, chainsaws, or distress warning calls for rapid ranger response.',
      icon: ShieldCheck,
    },
    {
      title: 'Empowering Field Naturalists',
      description: 'Equipping citizen scientists and ecological field researchers with instant, lab-grade taxonomic identification in remote territories.',
      icon: Users,
    },
  ];

  return (
    <section id="impact" className="py-24 bg-gradient-to-b from-slate-50 to-emerald-900/10 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Immersive Nature Banner Card */}
        <div className="relative rounded-3xl overflow-hidden shadow-2xl bg-slate-900 border border-emerald-800/40">
          {/* Forest Landscape Background Image with Overlay */}
          <div className="absolute inset-0 z-0">
            <img
              src="https://images.unsplash.com/photo-1448375240586-882707db888b?auto=format&fit=crop&w=1600&q=80"
              alt="Misty ancient rainforest canopy"
              className="w-full h-full object-cover opacity-35"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-900/90 to-emerald-950/80" />
          </div>

          <div className="relative z-10 p-8 sm:p-14 lg:p-16 max-w-4xl space-y-8">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold uppercase tracking-wider border border-emerald-500/30">
              <Heart className="w-3.5 h-3.5 text-emerald-400" />
              <span>Biodiversity Conservation Mission</span>
            </div>

            <div className="space-y-4">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
                "Every Sound Tells a Story.{' '}
                <span className="bg-gradient-to-r from-emerald-300 via-teal-200 to-sky-300 bg-clip-text text-transparent block sm:inline">
                  Every Species Matters."
                </span>
              </h2>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed font-normal max-w-2xl">
                Global biodiversity is declining at an unprecedented rate. By listening to acoustic
                signatures in forests, wetlands, and mountain passes, our platform converts raw audio
                into vital indicators of ecosystem vitality.
              </p>
            </div>

            {/* Impact Highlights Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-slate-800/80">
              {impacts.map((item) => (
                <div key={item.title} className="space-y-2">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <item.icon className="w-5 h-5 flex-shrink-0" />
                    <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  </div>
                  <p className="text-xs text-slate-400 leading-relaxed">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>

            {/* Impact Metric Numbers */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-6 border-t border-slate-800/80">
              <div>
                <span className="text-3xl font-black text-emerald-400 font-mono block">10,000+</span>
                <span className="text-xs text-slate-400 block mt-0.5">Audio Recordings Indexed</span>
              </div>
              <div>
                <span className="text-3xl font-black text-teal-300 font-mono block">94.8%</span>
                <span className="text-xs text-slate-400 block mt-0.5">Classification Precision</span>
              </div>
              <div>
                <span className="text-3xl font-black text-sky-300 font-mono block">120+</span>
                <span className="text-xs text-slate-400 block mt-0.5">Protected Species</span>
              </div>
              <div>
                <span className="text-3xl font-black text-emerald-300 font-mono block">45+</span>
                <span className="text-xs text-slate-400 block mt-0.5">Partner Reserves</span>
              </div>
            </div>

            {/* Call to Action Button */}
            <div className="pt-4">
              <button
                onClick={onJoinClick}
                className="group inline-flex items-center gap-3 px-8 py-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-extrabold text-sm sm:text-base shadow-xl shadow-emerald-500/20 hover:shadow-emerald-500/30 transition-all duration-200 hover:-translate-y-0.5"
              >
                <span>Launch Conservation Platform</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
