"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { logoutAction } from "@/lib/actions";

export function UserDropdown({ username }: { username: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) {
      document.addEventListener("keydown", handleEscape);
      return () => document.removeEventListener("keydown", handleEscape);
    }
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-xs uppercase tracking-wider text-charcoal-muted hover:text-terracotta transition-colors hidden sm:inline-flex items-center gap-1"
      >
        {username}
        <svg
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-44 bg-cream border border-charcoal-muted/15 shadow-sm py-1 z-50">
          <Link
            href="/your-posts"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-xs uppercase tracking-wider text-charcoal-muted hover:text-terracotta hover:bg-charcoal-muted/5 transition-colors"
          >
            Your posts
          </Link>
          <Link
            href="/settings"
            onClick={() => setOpen(false)}
            className="block px-4 py-2 text-xs uppercase tracking-wider text-charcoal-muted hover:text-terracotta hover:bg-charcoal-muted/5 transition-colors"
          >
            Settings
          </Link>
          <div className="my-1 h-px bg-charcoal-muted/10" />
          <form action={logoutAction}>
            <button
              type="submit"
              className="w-full text-left px-4 py-2 text-xs uppercase tracking-wider text-charcoal-muted hover:text-terracotta hover:bg-charcoal-muted/5 transition-colors"
            >
              Sign out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
