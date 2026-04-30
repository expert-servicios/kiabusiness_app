import { HeroSection } from '@/components/site/hero-section';
import { TrustBar } from '@/components/site/trust-bar';
import { ServiceCategories } from '@/components/site/service-categories';
import { FeaturedServices } from '@/components/site/featured-services';
import { HowItWorks } from '@/components/site/how-it-works';
import { ReviewsPreview } from '@/components/site/reviews-preview';
import { PrivateAreaCTA } from '@/components/site/private-area-cta';
import { AccreditationsStrip } from '@/components/site/accreditations-strip';

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      <TrustBar />
      <ServiceCategories />
      <FeaturedServices />
      <HowItWorks />
      <ReviewsPreview />
      <PrivateAreaCTA />
      <AccreditationsStrip />
    </main>
  );
}
