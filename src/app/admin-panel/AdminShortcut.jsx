"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function AdminShortcut() {
  const router = useRouter();

  useEffect(() => {
    const handleKeyDown = (e) => {
      // Check if Alt, Shift, and 'A' are pressed together
      if (e.altKey && e.shiftKey && e.code === "KeyA") {
        e.preventDefault(); // Prevent default browser behavior
        router.push("/admin-panel");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [router]);

  return null;
}