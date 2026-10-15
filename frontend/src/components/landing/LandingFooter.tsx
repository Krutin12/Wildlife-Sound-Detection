import React from 'react';
import {
  TreePine,
  Github,
  Mail,
  Shield,
  FileText,
  Heart,
  ArrowUp,
  Volume2,
} from 'lucide-react';
import { LISTENLEAF_LOGO_URL } from '../../assets/logoData';

interface LandingFooterProps {
  onScrollToSection: (sectionId: string) => void;
  onOpenLogin: () => void;
  onLaunchApp: () => void;
}

export const LandingFooter: React.FC<LandingFooterProps> = ({
  onScrollToSection,
  onOpenLogin,
  onLaunchApp,
}) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="relative bg-slate-900 text-slate-300 overflow-hidden pt-16 pb-12 border-t border-slate-800">
      {/* Mountain & Forest Silhouette SVG Artwork */}
      <div className="absolute top-0 left-0 right-0 w-full overflow-hidden leading-none pointer-events-none opacity-20">
        <svg
          className="relative block w-full h-16 text-emerald-500"
          viewBox="0 0 1200 120"
          preserveAspectRatio="none"
        >
          <path
            d="M0,0 C150,90 350,-40 500,60 C650,140 900,10 1200,40 L1200,0 L0,0 Z"
            fill="currentColor"
          />
        </svg>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 p-0.5 shadow-md flex-shrink-0">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center p-1 overflow-hidden">
                  <img
                    src={LISTENLEAF_LOGO_URL}
                    alt="ListenLeaf Logo"
                    className="w-full h-full object-contain"
                  />
                </div>
              </div>

              <div>
                <span className="font-extrabold text-lg text-white tracking-tight">
                  ListenLeaf AI
                </span>
                <span className="block text-[11px] text-emerald-400 font-medium">
                  Bioacoustic Wildlife Intelligence
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed max-w-sm">
              Empowering global ecological conservation through deep learning sound classification.
              Non-invasively monitoring vulnerable birds, mammals, and amphibians worldwide.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-800/80 text-[11px] text-emerald-300 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>EfficientNet-B3 Engine v2.0</span>
              </div>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Platform</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onScrollToSection('hero')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Home
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection('how-it-works')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection('features')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Core Features
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection('preview')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Interactive AI Detector
                </button>
              </li>
              <li>
                <button
                  onClick={() => onLaunchApp()}
                  className="text-emerald-400 font-bold hover:underline text-left block"
                >
                  Launch App Dashboard &rarr;
                </button>
              </li>
            </ul>
          </div>

          {/* Species & Bioacoustics */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Taxonomy</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={() => onScrollToSection('species')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Species Library
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection('technology')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Mel Spectrogram Guide
                </button>
              </li>
              <li>
                <button
                  onClick={() => onScrollToSection('impact')}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Conservation Impact
                </button>
              </li>
              <li>
                <span className="text-slate-500 cursor-not-allowed">
                  Audio Dataset Archives
                </span>
              </li>
            </ul>
          </div>

          {/* Support & Legal */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-white">Account & Trust</h4>
            <ul className="space-y-2 text-xs">
              <li>
                <button
                  onClick={onOpenLogin}
                  className="hover:text-emerald-400 transition-colors text-left"
                >
                  Researcher Sign In
                </button>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">
                  Privacy Policy
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">
                  Terms of Use
                </span>
              </li>
              <li>
                <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">
                  FastAPI OpenAPI Docs
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span>© {new Date().getFullYear()} ListenLeaf Bioacoustic AI. Dedicated to wildlife conservation.</span>
          </div>

          <button
            onClick={scrollToTop}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold transition-colors"
          >
            <span>Back to top</span>
            <ArrowUp className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
};
