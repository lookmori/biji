import { HomeHeader } from "@/components/home/HomeHeader";
import { HeroSection } from "@/components/home/HeroSection";
import { FeatureCards } from "@/components/home/FeatureCards";
import { CTASection } from "@/components/home/CTASection";
import { Footer } from "@/components/home/Footer";

export default function HomePage() {
  return (
    <>
      <HomeHeader />
      <main>
        <HeroSection />
        <FeatureCards />
        <CTASection />
      </main>
      <Footer />
    </>
  );
}
