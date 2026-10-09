"use client";

import { ConnectButton } from "@rainbow-me/rainbowkit";
import { useEffect, useState } from "react";

const GITHUB_REPO_URL = "https://github.com/omshukladev/erc20-batch-sender";

const iconButtonClass =
  "flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] border border-black/10 text-black/55 transition-all duration-200 hover:-translate-y-0.5 hover:border-black/25 hover:text-black hover:shadow-sm dark:border-white/10 dark:text-white/60 dark:hover:border-white/30 dark:hover:text-white";

function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
    setIsDark(next);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      title={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className={iconButtonClass}
    >
      {isDark ? (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          aria-hidden="true"
          className="h-[18px] w-[18px]"
        >
          <circle cx="12" cy="12" r="4" />
          <path d="M12 2v2m0 16v2M4.9 4.9l1.4 1.4m11.4 11.4 1.4 1.4M2 12h2m16 0h2M4.9 19.1l1.4-1.4m11.4-11.4 1.4-1.4" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
          className="h-[18px] w-[18px]"
        >
          <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />
        </svg>
      )}
    </button>
  );
}

export default function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-black/[0.06] bg-white/75 backdrop-blur-xl backdrop-saturate-150 dark:border-white/[0.08] dark:bg-[#0a0a0a]/75">
      <div className="flex h-14 w-full items-center justify-between gap-3 px-3 sm:h-16 sm:gap-4 sm:px-6 lg:px-8">
        <a href="/" className="group flex shrink-0 items-center gap-3">
          <span className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#0c0e10] text-lime-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] ring-1 ring-white/10 transition-transform duration-300 ease-out group-hover:-rotate-6 group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="h-[18px] w-[18px]"
            >
              <g
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
              >
                <path d="M5.5 12L18.5 5.25" />
                <path d="M5.5 12H18.5" />
                <path d="M5.5 12l13 6.75" />
              </g>
              <circle cx="5.5" cy="12" r="2.4" fill="currentColor" />
              <circle cx="18.5" cy="5.25" r="1.9" fill="currentColor" />
              <circle cx="18.5" cy="12" r="1.9" fill="currentColor" />
              <circle cx="18.5" cy="18.75" r="1.9" fill="currentColor" />
            </svg>
          </span>
          <span className="hidden items-center gap-2 min-[380px]:flex">
            <span className="text-base leading-none font-semibold tracking-tight sm:text-[17px]">
              TSender
            </span>
            <span className="hidden rounded-full border border-black/10 px-2 py-[3px] font-mono text-[10px] leading-none tracking-[0.16em] text-black/45 uppercase sm:inline-block dark:border-white/15 dark:text-white/45">
              ERC20
            </span>
          </span>
        </a>

        <div className="flex shrink-0 items-center gap-2 sm:gap-2.5">
          <a
            href={GITHUB_REPO_URL}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="View source on GitHub"
            title="View source on GitHub"
            className={iconButtonClass}
          >
            <svg
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
              className="h-[17px] w-[17px]"
            >
              <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12" />
            </svg>
          </a>

          <ThemeToggle />

          <ConnectButton
            showBalance={false}
            chainStatus={{ largeScreen: "full", smallScreen: "icon" }}
            accountStatus={{ largeScreen: "full", smallScreen: "avatar" }}
          />
        </div>
      </div>

      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 -bottom-px h-px bg-linear-to-r from-transparent via-lime-400/60 to-transparent"
      />
    </header>
  );
}
