import Player from "../Player";
import AdBanner from "../AdBanner";
import UpcomingEventsCard from "../UpcomingEventsCard";

export default function HomeView() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center gap-[clamp(0.75rem,2.5vh,2rem)] overflow-hidden px-[clamp(1rem,3vw,2.5rem)] py-[clamp(0.75rem,2.5vh,2rem)]">
      <div className="flex min-h-0 shrink flex-col items-center gap-[clamp(0.75rem,2.5vh,2rem)] md:flex-row md:items-start md:justify-center">
        <Player />
        <div className="hidden md:block">
          <UpcomingEventsCard />
        </div>
      </div>
      <AdBanner />
    </div>
  );
}
