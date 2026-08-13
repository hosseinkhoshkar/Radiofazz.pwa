// Purely decorative loading shape — aria-hidden individually; wrap a group
// of these in a single role="status" (see HomeHero.tsx's hero skeleton) so
// screen readers get one "loading" announcement, not one per shape.
export default function Skeleton({
  className,
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return <div aria-hidden="true" style={style} className={`skeleton rounded-xl ${className ?? ""}`} />;
}
