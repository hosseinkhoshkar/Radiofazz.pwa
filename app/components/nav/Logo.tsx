// Single source of truth for the "RADIO FAAZ" wordmark + red LIVE tag —
// Sidebar.tsx (desktop) and MobileMenu.tsx (mobile drawer) used to each
// hand-roll an identical copy of this markup, and the LIVE tag went missing
// from the mobile copy more than once when only one of the two got updated.
// Both now render this component instead, so a future change here reaches
// both automatically. textClassName lets each call site keep its own size
// (desktop's 27px was specifically tuned to fit the LIVE tag on one line in
// the 240px sidebar; the drawer has more room and uses a different size).
export default function Logo({ textClassName = "text-2xl" }: { textClassName?: string }) {
  return (
    <span className="flex flex-wrap items-center gap-1.5">
      <span className={`logo-shine font-bold leading-none tracking-tight uppercase ${textClassName}`}>
        RADIO FAAZ
      </span>
      <span className="shrink-0 rounded border border-danger/30 bg-danger/15 px-1 text-[10px] font-bold uppercase tracking-wide text-danger">
        LIVE
      </span>
    </span>
  );
}
