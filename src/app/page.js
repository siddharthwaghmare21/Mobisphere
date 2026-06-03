
import BackgroundHomeImage from "./components/home-components/BackgroundHomeImage";
import BannerSection from "./components/home-components/BannerSection";
import PricingSection from "./components/home-components/PricingSection";
import LatestProduct from "./components/home-components/LatestProduct";
import OtherFacilities from "./components/home-components/OtherFacilities";
import EnquiryForm from "./components/home-components/EnquiryForm";

export default function Home() {
  return (
    <>
      <BackgroundHomeImage />
      <BannerSection />
      
      <EnquiryForm />
      <LatestProduct />
      <PricingSection />
      <OtherFacilities />
    </>
  );
}






