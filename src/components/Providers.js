"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

// Suppress the React 19 "Encountered a script tag" warning
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const orig = console.error;
  console.error = (...args) => {
    if (typeof args[0] === "string" && args[0].includes("Encountered a script tag")) {
      return;
    }
    orig.apply(console, args);
  };
}

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <SessionProvider>{children}</SessionProvider>
    </ThemeProvider>
  );
}
