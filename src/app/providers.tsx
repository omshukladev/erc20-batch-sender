"use client";
import * as React from "react";
import { useState, useEffect } from "react";
import {
  RainbowKitProvider,
  darkTheme,
  lightTheme,
} from "@rainbow-me/rainbowkit";
import { WagmiProvider } from "wagmi";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import config from "@/rainbowKitConfig";
import "@rainbow-me/rainbowkit/styles.css";

const queryClient = new QueryClient();

const rainbowKitOptions = {
  accentColor: "#e0a53a",
  accentColorForeground: "#16181d",
  borderRadius: "small",
} as const;

const darkRainbowKitTheme = darkTheme({
  ...rainbowKitOptions,
  overlayBlur: "small",
});
const lightRainbowKitTheme = lightTheme(rainbowKitOptions);

export function Providers({ children }: { children: React.ReactNode }) {
  // Hydration safety check: only render on the client once mounted
  const [mounted, setMounted] = useState(false);
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    const sync = () =>
      setIsDark(document.documentElement.classList.contains("dark"));
    sync();
    setMounted(true);
    window.addEventListener("tsender:theme", sync);
    return () => window.removeEventListener("tsender:theme", sync);
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          theme={isDark ? darkRainbowKitTheme : lightRainbowKitTheme}
        >
          {mounted ? children : null}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
