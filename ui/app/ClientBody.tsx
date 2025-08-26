"use client";

import { useEffect } from "react";

export default function ClientBody({
  children,
}: {
  children: React.ReactNode;
}) {
  // Remove any extension-added classes during hydration
  useEffect(() => {
    // This runs only on the client after hydration
    // Preserve the Tailwind CSS classes while removing extension classes
    document.body.className = "antialiased bg-background text-foreground";
  }, []);

  return <div className="antialiased bg-background text-foreground">{children}</div>;
}
