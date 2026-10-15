import React, { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Cpu,
  Layers,
  Activity,
  Zap,
  CheckCircle,
  Code2,
  GitBranch,
  ShieldAlert,
  Sparkles,
  ArrowRight,
} from 'lucide-react';
import { TECH_PIPELINE } from './wildlifeData';

export const TechnologySection: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pipeline' | 'spectrogram' | 'stack'>('pipeline');

  const stackItems = [
    { name: 'Python 3.10+', role: 'Scientific Computing & Pipeline Core', category: 'Backend' },
    { name: 'PyTorch & TorchAudio', role: 'Deep Learning Training & Tensor Inference', category: 'AI Engine' },
    { name: 'EfficientNet-B3', role: 'Compound Scaled CNN Architecture', category: 'Model' },
    { name: 'Librosa', role: 'Mel-Frequency Bioacoustic Signal Processing', category: 'Acoustics' },
    { name: 'FastAPI', role: 'Asynchronous High-Throughput REST Gateway', category: 'API' },
    { name: 'Flutter & React', role: 'Cross-Platform Field & Desktop Applications', category: 'Client' },
  ];

  return (
    <section id="technology" className="py-24 bg-white relative overflow-hidden">
      {/* Decorative subtle background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#10b9810a_1px,transparent_1px),linear-gradient(to_bottom,#10b9810a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-teal-100/70 text-teal-900 text-xs font-bold uppercase tracking-wider border border-teal-200">
            <Cpu className="w-3.5 h-3.5 text-teal-700" />
            <span>AI Architecture & Innovation</span>
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            How Deep Learning Decodes Nature’s Calls
          </h2>

          <p className="text-base sm:text-lg text-slate-600 leading-relaxed font-normal">
            By transforming invisible sound vibrations into visual Mel spectrograms,
            our EfficientNet-B3 convolutional neural network identifies species with superhuman
            precision.
          </p>
        </div>

        {/* Feature Spotlight: EfficientNet-B3 & Mel Spectrogram */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center mb-16">
          {/* Left Column: Visual Spectrogram Representation */}
          <div className="lg:col-span-6 bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden border border-slate-800">
            <div className="flex items-center justify-between pb-4 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-emerald-400" />
                <span className="text-xs font-mono font-bold text-slate-200">
                  Mel Spectrogram (128 Bands / 32 kHz)
                </span>
              </div>
              <span className="text-[10px] font-mono bg-emerald-950 text-emerald-400 border border-emerald-800/80 px-2 py-0.5 rounded">
                Log-Power dB
              </span>
            </div>

            {/* Simulated Mel Spectrogram Heatmap */}
            <div className="py-6 space-y-2">
              <div className="h-44 rounded-2xl overflow-hidden relative border border-slate-700/80 bg-slate-950 p-2 flex flex-col justify-between">
                {/* Horizontal frequency bands with heat colors */}
                {[...Array(9)].map((_, i) => (
                  <div key={i} className="flex items-center gap-1.5 h-3 w-full">
                    <span className="text-[9px] font-mono text-slate-500 w-8 text-right">
                      {12 - i}k
                    </span>
                    <div className="flex-1 h-full rounded flex gap-1">
                      {[...Array(14)].map((_, j) => {
                        const intensity = ((i * 3 + j * 7) % 10) / 10;
                        const isHigh = (i === 4 || i === 5) && j > 3 && j < 11;
                        return (
                          <div
                            key={j}
                            className={`flex-1 rounded-sm transition-all ${
                              isHigh
                                ? 'bg-gradient-to-t from-emerald-400 to-teal-300 shadow-sm shadow-emerald-400/50'
                                : intensity > 0.5
                                ? 'bg-teal-700/50'
                                : 'bg-slate-800/70'
                            }`}
                          />
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 pt-2">
                <span>0.0s (Audio Start)</span>
                <span className="text-emerald-400 font-semibold">Harmonic Call Signature Detected</span>
                <span>5.0s</span>
              </div>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/80 pt-4">
              <strong>Mel Spectrogram Analysis:</strong> Instead of processing raw audio waveforms
              directly, the audio is mapped into human-like psychoacoustic frequency bands. The
              resulting visual "fingerprint" is fed into the CNN vision model for pattern detection.
            </p>
          </div>

          {/* Right Column: Why EfficientNet-B3 Matters */}
          <div className="lg:col-span-6 space-y-6">
            <div className="p-6 bg-emerald-50/60 rounded-3xl border border-emerald-100 space-y-3">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-200/60 text-emerald-900 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-emerald-800" />
                <span>Compound Scaling Architecture</span>
              </div>
              <h3 className="text-2xl font-bold text-slate-900">
                Why EfficientNet-B3?
              </h3>
              <p className="text-sm text-slate-600 leading-relaxed">
                Bioacoustic sound patterns feature both micro-temporal nuances (syllables) and wide
                frequency sweeps. EfficientNet-B3 balances network depth, width, and image resolution
                optimally—offering top-tier classification accuracy without demanding heavy GPU
                clusters.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
                <span className="text-2xl font-extrabold text-emerald-700 font-mono">12.2M</span>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Model Parameters
                </h4>
                <p className="text-xs text-slate-500">
                  Lightweight enough for edge servers & field microcontrollers.
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-sm space-y-1">
                <span className="text-2xl font-extrabold text-teal-700 font-mono">&lt; 140ms</span>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                  Inference Latency
                </h4>
                <p className="text-xs text-slate-500">
                  Real-time audio stream segmentation and classification.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 4-Stage Visual AI Processing Pipeline */}
        <div className="mb-16">
          <h3 className="text-xl font-bold text-slate-900 mb-6 text-center">
            End-to-End Bioacoustic Pipeline
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {TECH_PIPELINE.map((pipe, idx) => (
              <div
                key={pipe.stage}
                className="bg-white border border-slate-200/90 rounded-2xl p-6 shadow-sm hover:shadow-md transition-shadow space-y-3"
              >
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm">
                    0{idx + 1}
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-400">Step {idx + 1}</span>
                </div>

                <div>
                  <h4 className="text-base font-bold text-slate-900">{pipe.stage}</h4>
                  <span className="text-xs font-semibold text-emerald-700 block mt-0.5">
                    {pipe.tech}
                  </span>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">
                  {pipe.detail}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Tech Stack Pills Banner */}
        <div className="bg-slate-50 border border-slate-200/90 rounded-3xl p-8 max-w-5xl mx-auto">
          <h4 className="text-sm font-bold uppercase tracking-wider text-slate-400 mb-4 text-center">
            Engineering & Scientific Stack
          </h4>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {stackItems.map((item) => (
              <div
                key={item.name}
                className="bg-white p-3 rounded-2xl border border-slate-200 text-center shadow-sm hover:border-emerald-300 transition-colors"
              >
                <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide block">
                  {item.category}
                </span>
                <span className="text-xs font-bold text-slate-800 block mt-1 truncate">
                  {item.name}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
