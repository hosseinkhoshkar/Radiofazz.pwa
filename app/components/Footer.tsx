export default function Footer() {
  return (
    <footer className="border-t border-neon-purple/20 bg-background">
      <div className="mx-auto max-w-6xl px-6 py-6 text-center text-sm text-muted">
        <p>© {new Date().getFullYear()} رادیو فاز. تمامی حقوق محفوظ است.</p>
      </div>
    </footer>
  );
}