import React from 'react';
import { motion } from 'framer-motion';
import {
  UploadCloud,
  Cpu,
  Sparkles,
  Compass,
  ArrowRight,
  Activity,
  CheckCircle,
  FileAudio,
} from 'lucide-react';
import { WORKFLOW_STEPS } from './wildlifeData';

interface HowItWorksSectionProps {
  onTryNowClick: () => void;
}

export const HowItWorksSection: React.FC<HowItWorksSectionProps> = ({ onTryNowClick }) => {
  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'UploadCloud':
        return <UploadCloud className="w-6 h-6 text-emerald-700" />;
      case 'Cpu':
        return <Cpu className="w-6 h-6 text-teal-700" />;
      case 'Sparkles':
        return <Sparkles className="w-6 h-6 text-emerald-700" />;
      case 'Compass':
        return <Compass className="w-6 h-6 text-sky-700" />;
      default:
        return <FileAudio className="w-6 h-6 text-emerald-700" />;
    }
  };

  return (
    <section id="how-it-works" className="py-24 bg-white relative overflow-hidden">
      {/* Subtle background nature glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[500px] bg-gradient-to-tr from-emerald-50/50 via-teal-50/30 to-transparent rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-bold uppercase tracking-wider border border-emerald-200">
            <span>Seamless 4-Step Pipeline</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How Bioacoustic AI Works
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            From the forest canopy to your screen: discover how raw soundscapes are transformed into
            actionable ecological intelligence in seconds.
          </p>
        </div>

        {/* 4-Step Connected Workflow Grid */}
        <div className="relative">
          {/* Desktop Connecting Line behind cards */}
          <div className="hidden lg:block absolute top-1/2 left-12 right-12 h-1 bg-gradient-to-r from-emerald-200 via-teal-200 to-sky-200 -translate-y-1/2 z-0" />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 relative z-10">
            {WORKFLOW_STEPS.map((step, idx) => (
              <motion.div
                key={step.step}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-40px' }}
                transition={{ duration: 0.5, delay: idx * 0.12 }}
                className="group relative bg-white/90 backdrop-blur-sm border border-slate-200/80 hover:border-emerald-300 rounded-3xl p-7 shadow-sm hover:shadow-xl hover:shadow-emerald-900/10 transition-all duration-300 flex flex-col justify-between"
              >
                {/* Top Badge and Number */}
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-100/60 border border-emerald-200/70 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform duration-300">
                      {getIcon(step.icon)}
                    </div>
                    <span className="text-3xl font-extrabold text-slate-200 group-hover:text-emerald-300 transition-colors">
                      {step.step}
                    </span>
                  </div>

                  <span className="inline-block text-[11px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 rounded-full mb-3">
                    {step.badge}
                  </span>

                  <h3 className="text-lg font-bold text-slate-900 mb-2.5 group-hover:text-emerald-800 transition-colors">
                    {step.title}
                  </h3>

                  <p className="text-sm text-slate-600 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Bottom Micro Metric */}
                <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Capability</span>
                  <span className="font-semibold text-emerald-700">{step.metric}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Action Callout */}
        <div className="mt-14 text-center">
          <button
            onClick={onTryNowClick}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-2xl bg-slate-900 text-white font-bold text-sm hover:bg-emerald-800 transition-colors shadow-md group"
          >
            <span>Test the Audio Classifier Below</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </section>
  );
};
