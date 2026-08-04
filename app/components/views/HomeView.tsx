import Player from "../Player";

export default function HomeView() {
  return (
    <div className="flex h-full w-full flex-col items-center justify-center overflow-hidden px-[clamp(1rem,3vw,2.5rem)] py-[clamp(0.25rem,1vh,0.75rem)]">
      <Player />
    </div>
  );
}
