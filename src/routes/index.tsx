import { createFileRoute } from "@tanstack/react-router";
import { Navbar } from "@/components/landing/Navbar";
import { Hero } from "@/components/landing/Hero";
import { TrustedBy } from "@/components/landing/TrustedBy";
import { CaseStudies } from "@/components/landing/CaseStudies";
import { Features } from "@/components/landing/Features";
import { Transformation } from "@/components/landing/Transformation";
import { HowItWorks } from "@/components/landing/HowItWorks";
import { AIModels } from "@/components/landing/AIModels";
import { DashboardPreview } from "@/components/landing/DashboardPreview";
import { Pricing } from "@/components/landing/Pricing";
import { GEOExperiments } from "@/components/landing/GEOExperiments";
import { Testimonials } from "@/components/landing/Testimonials";
import { FAQ } from "@/components/landing/FAQ";
import { CTABand } from "@/components/landing/CTABand";
import { Footer } from "@/components/landing/Footer";

export const Route = createFileRoute("/")({
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-white">
      <Navbar />
      <Hero />
      <main>
        <TrustedBy />
        <CaseStudies />
        <Features />
        <Transformation />
        <HowItWorks />
        <AIModels />
        <DashboardPreview />
        <Pricing />
        <GEOExperiments />
        <Testimonials />
        <FAQ />
        <CTABand />
      </main>
      <Footer />
    </div>
  );
}
