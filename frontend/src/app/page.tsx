import Hero from "@/features/home/components/Hero";
import RevolvingSection from "@/features/Works/components/RevolvingSection";
import Footer from "@/features/home/components/Footer";
import ReachUs from "@/features/contact/components/ReachUs";

export default function Home() {
  return (
    <div className="font-sans flex overflow-x-hidden flex-col">
      <div className="flex items-center justify-center min-h-screen">
        <Hero />
      </div>
      <RevolvingSection />
      <ReachUs />
      <Footer />
    </div>
  );
}
