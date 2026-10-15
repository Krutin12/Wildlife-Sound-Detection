import React from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  ArrowRight,
  Compass,
  Play,
  Volume2,
  CheckCircle2,
  Activity,
  Feather,
  ShieldCheck,
  TreePine,
} from 'lucide-react';

interface HeroSectionProps {
  onIdentifyClick: () => void;
  onExploreClick: () => void;
}

export const HeroSection: React.FC<HeroSectionProps> = ({
  onIdentifyClick,
  onExploreClick,
}) => {
  return (
    <section
      id="hero"
      className="relative min-h-[92vh] pt-32 pb-20 overflow-hidden flex items-center bg-gradient-to-b from-emerald-50/60 via-mint-50/40 to-white"
    >
      {/* Decorative Nature & Light Gradients */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Soft Sun Glow */}
        <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[720px] h-[720px] bg-gradient-to-b from-emerald-200/40 via-teal-100/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-1/4 -left-48 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/3 -right-48 w-96 h-96 bg-sky-200/30 rounded-full blur-3xl" />

        {/* Scenic Mountain & Forest Silhouette SVG */}
        <svg
          className="absolute bottom-0 left-0 right-0 w-full h-48 md:h-64 opacity-[0.14] text-emerald-950"
          preserveAspectRatio="none"
          viewBox="0 0 1440 320"
        >
          {/* Distant Mountains */}
          <path
            fill="currentColor"
            d="M0,224L60,208C120,192,240,160,360,165.3C480,171,600,213,720,208C840,203,960,149,1080,144C1200,139,1320,181,1380,202.7L1440,224L1440,320L1380,320C1320,320,1200,320,1080,320C960,320,840,320,720,320C600,320,480,320,360,320C240,320,120,320,60,320L0,320Z"
          />
          {/* Middle Ridges */}
          <path
            fill="currentColor"
            opacity="0.6"
            d="M0,256L80,240C160,224,320,192,480,202.7C640,213,800,267,960,261.3C1120,256,1280,192,1360,160L1440,128L1440,320L1360,320C1280,320,1120,320,960,320C800,320,640,320,480,320C320,320,160,320,80,320L0,320Z"
          />
        </svg>

        {/* Flying Birds Silhouettes */}
        <div className="absolute top-24 left-[15%] opacity-40">
          <svg className="w-8 h-8 text-emerald-800" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C8 8 4 7 1 8c3-4 7-6 11-3.5 4-2.5 8-.5 11 3.5-3-1-7 0-11-3.5z" />
          </svg>
        </div>
        <div className="absolute top-20 left-[20%] opacity-25">
          <svg className="w-5 h-5 text-emerald-800" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C8 8 4 7 1 8c3-4 7-6 11-3.5 4-2.5 8-.5 11 3.5-3-1-7 0-11-3.5z" />
          </svg>
        </div>
        <div className="absolute top-36 right-[22%] opacity-35">
          <svg className="w-6 h-6 text-teal-800" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4.5C8 8 4 7 1 8c3-4 7-6 11-3.5 4-2.5 8-.5 11 3.5-3-1-7 0-11-3.5z" />
          </svg>
        </div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full z-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & Call to Actions */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            className="lg:col-span-7 text-center lg:text-left space-y-7"
          >
            {/* Pill Banner */}
            <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/90 border border-emerald-200/90 shadow-sm shadow-emerald-900/5 text-emerald-900 text-xs sm:text-sm font-semibold tracking-wide">
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-emerald-700 font-bold">ListenLeaf Bioacoustic AI</span>
              <span className="text-slate-300">•</span>
              <span className="text-slate-600">EfficientNet-B3 Neural Classifier</span>
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
              Listen to Nature.{' '}
              <span className="block mt-1 bg-gradient-to-r from-emerald-700 via-teal-700 to-emerald-600 bg-clip-text text-transparent">
                Discover Wildlife.
              </span>
            </h1>

            {/* Subtitle */}
            <p className="text-base sm:text-lg lg:text-xl text-slate-600 max-w-2xl mx-auto lg:mx-0 font-normal leading-relaxed">
              Identify wildlife species through the power of AI. Upload an audio recording,
              discover species, and contribute to biodiversity conservation with non-invasive
              bioacoustic intelligence.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2">
              <button
                onClick={onIdentifyClick}
                className="w-full sm:w-auto px-7 py-3.5 text-base font-bold text-white bg-gradient-to-r from-emerald-600 via-emerald-700 to-teal-700 hover:from-emerald-700 hover:to-teal-800 rounded-2xl shadow-lg shadow-emerald-700/25 hover:shadow-xl hover:shadow-emerald-700/35 transition-all duration-200 flex items-center justify-center gap-3 group hover:-translate-y-0.5"
              >
                <Sparkles className="w-5 h-5 text-emerald-200 group-hover:rotate-12 transition-transform" />
                <span>Identify Wildlife</span>
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <button
                onClick={onExploreClick}
                className="w-full sm:w-auto px-6 py-3.5 text-base font-semibold text-slate-700 hover:text-emerald-800 bg-white/80 hover:bg-white border border-slate-200/90 hover:border-emerald-300 rounded-2xl shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-2.5"
              >
                <Compass className="w-5 h-5 text-emerald-600" />
                <span>Explore Species</span>
              </button>
            </div>

            {/* Trust & Metric Badges */}
            <div className="pt-4 border-t border-emerald-900/10 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-xs text-slate-600 font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>94.8% Detection Precision</span>
              </div>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-teal-600" />
                <span>128-Band Mel Spectrograms</span>
              </div>
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Non-Invasive Monitoring</span>
              </div>
            </div>
          </motion.div>

          {/* Right Column: Floating AI Audio Detection Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.15, ease: 'easeOut' }}
            className="lg:col-span-5 relative"
          >
            {/* Ambient Background Glow behind card */}
            <div className="absolute -inset-2 bg-gradient-to-r from-emerald-500/20 via-teal-500/20 to-sky-500/20 rounded-3xl blur-2xl opacity-75" />

            {/* Main Floating Glass Card */}
            <div className="relative bg-white/90 backdrop-blur-xl border border-white/80 rounded-3xl p-6 sm:p-7 shadow-2xl shadow-emerald-950/10 space-y-5">
              {/* Card Header with Demo Badge */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-3 w-3 rounded-full bg-emerald-500 animate-ping" />
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-800">
                    Live Bioacoustic Analysis
                  </span>
                </div>
                <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-2.5 py-0.5 rounded-full">
                  Sample Demo
                </span>
              </div>

              {/* Species Identification Badge */}
              <div className="flex items-center gap-4 bg-gradient-to-r from-emerald-50/70 to-teal-50/70 p-4 rounded-2xl border border-emerald-100">
                <div className="w-14 h-14 rounded-2xl overflow-hidden shadow-inner flex-shrink-0 border border-emerald-200">
                  <img
                    src="/species/common_nightingale.jpg"
                    alt="Common Nightingale"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-semibold text-emerald-700">Identified Species</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-bold">Top #1</span>
                  </div>
                  <h4 className="text-base font-bold text-slate-900 truncate">
                    Common Nightingale
                  </h4>
                  <p className="text-xs text-slate-500 italic truncate">
                    Luscinia megarhynchos
                  </p>
                </div>

                {/* Circular Confidence Gauge */}
                <div className="text-right flex-shrink-0">
                  <div className="text-xl font-extrabold text-emerald-700 leading-none">
                    98.7%
                  </div>
                  <span className="text-[10px] font-medium text-slate-500 block mt-0.5">
                    Confidence
                  </span>
                </div>
              </div>

              {/* Animated Audio Waveform Visualization */}
              <div className="bg-slate-900 text-white p-4 rounded-2xl space-y-3 shadow-inner">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400 animate-pulse" />
                    <span className="font-mono text-emerald-300">audio_sample_01.wav</span>
                  </div>
                  <span className="font-mono text-slate-400">00:04.8 / 32kHz</span>
                </div>

                {/* Sound wave bars */}
                <div className="h-14 flex items-end justify-between gap-1 px-1">
                  {[40, 65, 85, 45, 95, 75, 55, 90, 100, 70, 45, 30, 60, 85, 95, 65, 50, 75, 90, 60, 40, 70, 85, 50, 30].map(
                    (height, idx) => (
                      <motion.div
                        key={idx}
                        className="flex-1 bg-gradient-to-t from-emerald-500 to-teal-300 rounded-full"
                        style={{ height: `${height}%` }}
                        animate={{
                          height: [
                            `${height}%`,
                            `${Math.max(15, (height * 1.3) % 100)}%`,
                            `${Math.max(20, (height * 0.7) % 95)}%`,
                            `${height}%`,
                          ],
                        }}
                        transition={{
                          repeat: Infinity,
                          duration: 1.8,
                          delay: idx * 0.06,
                          ease: 'easeInOut',
                        }}
                      />
                    )
                  )}
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-1 border-t border-slate-800">
                  <span>Dom. Freq: <strong className="text-emerald-400">3,420 Hz</strong></span>
                  <span>SNR: <strong className="text-teal-400">22.4 dB</strong></span>
                  <span>Model: <strong className="text-sky-300">EfficientNet-B3</strong></span>
                </div>
              </div>

              {/* Key Bioacoustic Insights */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Habitat Match</span>
                  <span className="font-semibold text-slate-700 truncate block">Dense Riverine Scrub</span>
                </div>
                <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100">
                  <span className="text-slate-400 block text-[10px]">Call Characteristic</span>
                  <span className="font-semibold text-slate-700 truncate block">Nocturnal Flute Whistle</span>
                </div>
              </div>

              {/* Floating micro badges around card */}
              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [-4, 4, -4] }}
                transition={{ repeat: Infinity, duration: 4, ease: 'easeInOut' }}
                className="absolute -bottom-4 -left-4 bg-white/95 backdrop-blur-md border border-emerald-200 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold text-emerald-900"
              >
                <TreePine className="w-4 h-4 text-emerald-600" />
                <span>Biodiversity Impact: Active</span>
              </motion.div>

              <motion.div
                initial={{ y: 0 }}
                animate={{ y: [4, -4, 4] }}
                transition={{ repeat: Infinity, duration: 4.5, ease: 'easeInOut' }}
                className="absolute -top-3 -right-3 bg-white/95 backdrop-blur-md border border-teal-200 px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-2 text-xs font-semibold text-teal-900"
              >
                <Feather className="w-4 h-4 text-teal-600" />
                <span>FastAPI Backend Ready</span>
              </motion.div>
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
};
