import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import {
  ChevronLeft,
  ChevronRight,
  FileQuestion,
  Layers3,
  LibraryBig,
  Link2,
  ListChecks,
  Map,
  NotebookText,
  Sparkles,
} from "lucide-react";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "chikuseki",
  description: "Personal Engineering Learning OS",
};

const primaryNavItems = [
  { label: "Knowledge Map", href: "/knowledge-map", icon: Map },
  { label: "Linker", href: "/knowledge-linker", icon: Link2 },
  { label: "Resources", href: "/resources", icon: LibraryBig },
  { label: "Notes", href: "/notes", icon: NotebookText },
  { label: "Questions", href: "/questions", icon: FileQuestion },
  { label: "Reviews", href: "/reviews/today", icon: ListChecks },
  { label: "Import", href: "/imports/chatgpt", icon: Sparkles },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
    >
      <body className="min-h-full bg-background text-foreground antialiased">
        <input
          id="app-sidebar-toggle"
          type="checkbox"
          aria-label="サイドバーの表示幅を切り替える"
          className="sr-only"
        />
        <aside className="app-sidebar fixed inset-y-0 left-0 z-50 flex w-16 flex-col border-r border-sidebar-border bg-sidebar transition-[width] duration-200 sm:w-60">
          <div className="sidebar-header relative flex h-16 shrink-0 items-center border-b border-sidebar-border px-2 sm:px-4">
            <Link
              href="/"
              aria-label="Home"
              title="Home"
              className="sidebar-logo-link flex h-10 min-w-0 flex-1 items-center justify-center gap-3 rounded-lg text-sm font-semibold text-sidebar-foreground transition-colors hover:bg-sidebar-accent focus-visible:ring-3 focus-visible:ring-sidebar-ring/50 sm:justify-start sm:pl-2"
            >
              <span className="sidebar-logo-mark flex size-8 shrink-0 items-center justify-center text-foreground">
                <Layers3 aria-hidden="true" className="size-4" />
              </span>
              <span className="sidebar-expanded-inline hidden sm:inline">
                chikuseki
              </span>
            </Link>
            <label
              htmlFor="app-sidebar-toggle"
              title="サイドバーの表示幅を切り替える"
              className="sidebar-toggle-control ml-auto flex size-8 shrink-0 cursor-pointer items-center justify-center text-muted-foreground transition-colors hover:text-foreground"
            >
              <ChevronLeft
                aria-hidden="true"
                className="sidebar-collapse-icon size-4"
              />
              <ChevronRight
                aria-hidden="true"
                className="sidebar-expand-icon hidden size-4"
              />
            </label>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4 sm:px-3">
            <p className="sidebar-expanded-block mb-2 hidden px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground sm:block">
              Workspace
            </p>
            <nav aria-label="Primary navigation" className="space-y-1">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  aria-label={item.label}
                  title={item.label}
                  className="sidebar-nav-link flex h-10 items-center justify-center gap-3 rounded-lg px-2 text-sm font-medium text-sidebar-foreground/75 transition-colors hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-3 focus-visible:ring-sidebar-ring/50 sm:justify-start sm:px-3"
                >
                  <item.icon aria-hidden="true" className="size-4 shrink-0" />
                  <span className="sidebar-expanded-inline hidden sm:inline">
                    {item.label}
                  </span>
                </Link>
              ))}
            </nav>
          </div>

          <div className="sidebar-expanded-block hidden shrink-0 border-t border-sidebar-border px-5 py-4 sm:block">
            <p className="text-xs leading-5 text-muted-foreground">
              Personal Engineering
              <br />
              Learning OS
            </p>
          </div>
        </aside>

        <div className="app-content min-h-screen pl-16 transition-[padding] duration-200 sm:pl-60">
          {children}
        </div>
      </body>
    </html>
  );
}
