import { HeroSection } from '@/components/marketing/hero-section';
import { CategoriesSection } from '@/components/marketing/categories-section';
import { TrustSection } from '@/components/marketing/trust-section';
import { PrivateAreaCTA } from '@/components/marketing/private-area-cta';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <CategoriesSection />
      <TrustSection />
      <PrivateAreaCTA />
    </main>
  );
}
