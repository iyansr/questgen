import Header from '@/components/header';

import { BentoGridSection } from './components/bento-grid-section';
import { CtaSection } from './components/cta-section';
import { FaqSection } from './components/faq-section';
import { FeatureHighlightsSection } from './components/feature-highlights-section';
import { FooterSection } from './components/footer-section';
import { HeroSection } from './components/hero-section';
import { PlatformFeaturesSection } from './components/platform-features-section';
import { PricingSection } from './components/pricing-section';
import { SocialProofSection } from './components/social-proof-section';
import { TestimonialSection } from './components/testimonial-section';

export function LandingPage() {
  return (
    <div className="min-h-dvh bg-background text-foreground">
      <Header />

      <div className="mx-auto max-w-4xl border-border border-x">
        <HeroSection />
        <FeatureHighlightsSection />
        <SocialProofSection />
        <BentoGridSection />
        <PlatformFeaturesSection />
        <TestimonialSection />
        <PricingSection />
        <FaqSection />
        <CtaSection />
        <FooterSection />
      </div>
    </div>
  );
}
