import Player from "./components/Player";
import AdBanner from "./components/AdBanner";
import Events from "./components/Events";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col items-center gap-16 px-6 py-24">
      <Player />
      <AdBanner />
      <Events />
    </div>
  );
}
