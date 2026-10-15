import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  Sparkles,
  LogIn,
  ArrowRight,
  Radio,
  Compass,
  Layers,
  HeartHandshake
} from 'lucide-react';
import { LISTENLEAF_LOGO_URL } from '../../assets/logoData';

interface LandingNavbarProps {
  onOpenLogin: () => void;
  onLaunchApp: () => void;
  onScrollToSection: (sectionId: string) => void;
}

export const LandingNavbar: React.FC<LandingNavbarProps> = ({
  onOpenLogin,
  onLaunchApp,
  onScrollToSection,
}) => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Home', target: 'hero' },
    { label: 'How It Works', target: 'how-it-works' },
    { label: 'Features', target: 'features' },
    { label: 'Try AI Detector', target: 'preview', highlight: true },
    { label: 'Explore Species', target: 'species' },
    { label: 'Technology', target: 'technology' },
    { label: 'Conservation', target: 'impact' },
  ];

  const handleLinkClick = (target: string) => {
    onScrollToSection(target);
    setMobileMenuOpen(false);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled
          ? 'bg-white/85 backdrop-blur-md shadow-sm border-b border-emerald-900/10 py-3'
          : 'bg-transparent py-5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          {/* Logo with ListenLeaf Stag + Brand Text */}
          <button
            onClick={() => handleLinkClick('hero')}
            className="flex items-center gap-3 text-left group focus:outline-none flex-shrink-0"
          >
            <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-600 to-emerald-400 p-0.5 shadow-md shadow-emerald-700/20 group-hover:scale-105 transition-transform flex-shrink-0">
              <div className="w-full h-full bg-white rounded-[10px] flex items-center justify-center overflow-hidden p-1">
                <img
                  src={LISTENLEAF_LOGO_URL}
                  alt="ListenLeaf Logo"
                  className="w-full h-full object-contain"
                />
              </div>
              <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
            </div>

            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight text-slate-900 group-hover:text-emerald-800 transition-colors">
                  ListenLeaf
                </span>
                <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full border border-emerald-300">
                  AI
                </span>
              </div>
              <span className="text-[11px] font-medium text-emerald-700 block leading-tight tracking-wide whitespace-nowrap">
                Intelligent Wildlife Conservation
              </span>
            </div>
          </button>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 xl:gap-2">
            {navLinks.map((link) => (
              <button
                key={link.target}
                onClick={() => handleLinkClick(link.target)}
                className={`px-3 py-2 text-sm font-semibold rounded-lg transition-colors duration-200 ${
                  link.highlight
                    ? 'text-emerald-800 bg-emerald-50/80 hover:bg-emerald-100/90 border border-emerald-200/80'
                    : 'text-slate-600 hover:text-emerald-900 hover:bg-emerald-50/50'
                }`}
              >
                {link.label}
              </button>
            ))}
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenLogin}
              className="flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-slate-700 hover:text-emerald-800 hover:bg-slate-100/80 rounded-xl transition-all"
            >
              <LogIn className="w-4 h-4 text-emerald-700" />
              <span>Log In</span>
            </button>

            <button
              onClick={onLaunchApp}
              className="group relative inline-flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 rounded-xl shadow-md shadow-emerald-700/25 hover:shadow-lg hover:shadow-emerald-700/35 transition-all duration-200 hover:-translate-y-0.5"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onLaunchApp}
              className="px-3 py-1.5 text-xs font-bold text-white bg-emerald-600 rounded-lg shadow-sm"
            >
              Launch
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-slate-700 hover:text-emerald-700 hover:bg-emerald-50 rounded-lg transition-colors"
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Dropdown Menu */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden bg-white/95 backdrop-blur-lg border-b border-emerald-900/10 shadow-lg px-4 pt-3 pb-6"
          >
            <div className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <button
                  key={link.target}
                  onClick={() => handleLinkClick(link.target)}
                  className="flex items-center justify-between px-3 py-2.5 text-sm font-semibold text-slate-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg text-left"
                >
                  <span>{link.label}</span>
                  {link.highlight && (
                    <span className="text-[10px] font-bold bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full">
                      Live
                    </span>
                  )}
                </button>
              ))}

              <div className="pt-4 mt-2 border-t border-slate-200/80 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onOpenLogin();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-slate-700 border border-slate-200 rounded-xl hover:bg-slate-50"
                >
                  <LogIn className="w-4 h-4 text-emerald-700" />
                  <span>Log In to Account</span>
                </button>

                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    onLaunchApp();
                  }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-white bg-gradient-to-r from-emerald-600 to-teal-600 rounded-xl shadow-md"
                >
                  <span>Get Started Free</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
};
