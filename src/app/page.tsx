import Header from "@/components/Header";
import TransferDashboard from "@/components/TransferDashboard";
import Ticker from "@/components/Ticker";
import WhyRelay from "@/components/WhyRelay";
import Features from "@/components/Features";
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
      </main>
      <Footer />
    </>
  );
}