export function Footer() {
  return (
    <footer className="border-t py-4 mt-8">
      <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} AB‑Network. All rights reserved.</p>
      </div>
    </footer>
  );
}
