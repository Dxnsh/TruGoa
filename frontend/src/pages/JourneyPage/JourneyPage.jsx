import Hero from "../../components/Journey/Hero/Hero";
import ArrivalChapter from "../../components/Journey/ArrivalChapter/ArrivalChapter";
import StayChapter from "../../components/Journey/StayChapter/StayChapter";
import FirstDayChapter from "../../components/Journey/FirstDayChapter/FirstDayChapter";
import ExploreChapter from "../../components/Journey/ExploreChapter/ExploreChapter";
import ExperienceChapter from "../../components/Journey/ExperienceChapter/ExperienceChapter";
import NightChapter from "../../components/Journey/NightChapter/NightChapter";
import DepartureChapter from "../../components/Journey/DepartureChapter/DepartureChapter";
import JourneyFooter from "../../components/Journey/JourneyFooter/JourneyFooter";
import useIsMobile from "../../hooks/useIsMobile";
import SEO from "../../components/SEO/SEO";
export default function JourneyPage() {
  const isMobile = useIsMobile();

  return (
    <>
      <SEO
        path="/journey"
        title="Your Goa Journey"
        description="Follow a day-by-day Goa journey — arrival, stays, first day, exploring, nightlife and departure — planned the TruGoa way."
      />
      <Hero isMobile={isMobile} />

      
      <ArrivalChapter />

      <StayChapter />

      <FirstDayChapter />

      <ExploreChapter />

      <ExperienceChapter />

      <NightChapter />

      <DepartureChapter />

      <JourneyFooter />

  


    </>
  );
}