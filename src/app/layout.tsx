import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import {
  FileQuestion,
  Layers3,
  LibraryBig,
  ListChecks,
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
      className={`${geistSans.variable} ${geistMono.variable} dark h-full`}
    >
      <body className="flex min-h-full flex-col antialiased">
        <header className="fixed inset-x-3 top-3 z-50">
          <div className="mx-auto flex max-w-6xl items-center gap-2 rounded-lg border border-border bg-card/95 p-1.5 shadow-sm backdrop-blur">
            <span className="shrink-0 px-2 text-sm font-semibold tracking-normal text-foreground">
              chikuseki
            </span>
            <Link
              href="/"
              aria-label="Home"
              title="Home"
              className="inline-flex size-9 shrink-0 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              <Layers3 aria-hidden="true" className="size-4" />
            </Link>
            <nav
              aria-label="Primary navigation"
              className="flex min-w-0 flex-1 items-center gap-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
            >
              {primaryNavItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="inline-flex h-9 shrink-0 items-center gap-2 rounded-md px-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                >
                  <item.icon aria-hidden="true" className="size-4" />
                  <span>{item.label}</span>
                </Link>
              ))}
            </nav>
          </div>
        </header>
        <div className="flex min-h-full flex-1 flex-col pt-16">{children}</div>
      </body>
    </html>
  );
}
