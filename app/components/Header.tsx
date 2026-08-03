import Link from "next/link";

const navItems = [
  { href: "/", label: "خانه" },
  { href: "#", label: "برنامه‌ها" },
  { href: "#", label: "اطلاعیه‌ها" },
  { href: "/contact", label: "تماس با ما" },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-neon-purple/20 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link
          href="/"
          className="bg-gradient-to-l from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-2xl font-bold tracking-wide text-transparent"
        >
          رادیو فاز
        </Link>

        <nav>
          <ul className="flex items-center gap-8 text-sm font-medium text-foreground/80">
            {navItems.map((item) => (
              <li key={item.label}>
                <Link
                  href={item.href}
                  className="transition-colors hover:text-neon-cyan"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </header>
  );
}
