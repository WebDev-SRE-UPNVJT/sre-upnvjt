"use client";

import { SessionProvider } from "next-auth/react";
import { ThemeProvider } from "next-themes";

// Suppress React 19 / transient NextAuth dev warnings
if (typeof window !== "undefined" && process.env.NODE_ENV === "development") {
  const orig = console.error;
  console.error = (...args) => {
    if (
      typeof args[0] === "string" &&
      (args[0].includes("Encountered a script tag") ||
        args[0].includes("CLIENT_FETCH_ERROR"))
    ) {
      return;
    }
    orig.apply(console, args);
  };
}

export function Providers({ children }) {
  return (
    <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
      <SessionProvider refetchOnWindowFocus={false} refetchWhenOffline={false}>
        {children}
      </SessionProvider>
    </ThemeProvider>
  );
}
