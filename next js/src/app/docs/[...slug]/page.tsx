"use client";

// Catch-all route for /docs/* paths - redirects to main docs page
// This ensures all /docs/* routes show the documentation page
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DocsCatchAll() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirect to main docs page for any /docs/* route
    router.replace("/docs");
  }, [router]);

  return null;
}

