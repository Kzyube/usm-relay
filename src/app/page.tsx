import Header from "@/components/Header";
import TransferDashboard from "@/components/TransferDashboard";
import Ticker from "@/components/Ticker";
import WhyRelay from "@/components/WhyRelay";
import Features from "@/components/Features";
import FAQ from "@/components/FAQ";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <Header />
      <main>
        <TransferDashboard />
        <Ticker />
        <WhyRelay />
        <Features />
        <FAQ />
      </main>
      <Footer />
    </>
  );
}