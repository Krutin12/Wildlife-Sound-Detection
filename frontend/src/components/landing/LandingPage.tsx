import React from 'react';
import { LandingNavbar } from './LandingNavbar';
import { HeroSection } from './HeroSection';
import { HowItWorksSection } from './HowItWorksSection';
import { FeaturesSection } from './FeaturesSection';
import { AudioDetectionPreview } from './AudioDetectionPreview';
import { ExploreWildlifeSection } from './ExploreWildlifeSection';
import { TechnologySection } from './TechnologySection';
import { ConservationImpactSection } from './ConservationImpactSection';
import { LandingFooter } from './LandingFooter';

interface LandingPageProps {
  onOpenLogin: () => void;
  onLaunchApp: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({
  onOpenLogin,
  onLaunchApp,
}) => {
  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-sans antialiased selection:bg-emerald-100 selection:text-emerald-900 overflow-x-hidden">
      {/* Sticky Frosted-Glass Navbar */}
      <LandingNavbar
        onOpenLogin={onOpenLogin}
        onLaunchApp={onLaunchApp}
        onScrollToSection={scrollToSection}
      />

      {/* Hero Section */}
      <HeroSection
        onIdentifyClick={() => scrollToSection('preview')}
        onExploreClick={() => scrollToSection('species')}
      />

      {/* How It Works (4-Step Connected Workflow) */}
      <HowItWorksSection onTryNowClick={() => scrollToSection('preview')} />

      {/* Core Features (6 Interactive Cards) */}
      <FeaturesSection onSelectFeature={() => scrollToSection('preview')} />

      {/* Interactive Audio Detection Preview with Demo Presets & Real API */}
      <AudioDetectionPreview />

      {/* Explore Wildlife Gallery & Taxonomy */}
      <ExploreWildlifeSection />

      {/* Technology & AI Architecture (EfficientNet-B3 + Mel Spectrogram) */}
      <TechnologySection />

      {/* Conservation Impact */}
      <ConservationImpactSection onJoinClick={onLaunchApp} />

      {/* Footer */}
      <LandingFooter
        onScrollToSection={scrollToSection}
        onOpenLogin={onOpenLogin}
        onLaunchApp={onLaunchApp}
      />
    </div>
  );
};

export default LandingPage;
