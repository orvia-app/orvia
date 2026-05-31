import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import { AuthProvider } from "@/components/auth/AuthProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import { STORAGE_KEYS } from "@/lib/storage";
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
  title: "Orvia",
  description: "Local-first capture and memory operating system",
};

const themeInitScript = `
(function () {
  try {
    var storedTheme = window.localStorage.getItem(${JSON.stringify(
      STORAGE_KEYS.theme,
    )});
    var theme = storedTheme ? JSON.parse(storedTheme) : "dark";
    var isSystem = theme === "system";
    var isDark = theme === "dark" || (isSystem && window.matchMedia("(prefers-color-scheme: dark)").matches);

    if (theme !== "light" && theme !== "dark" && theme !== "system") {
      isDark = true;
    }

    document.documentElement.classList.toggle("dark", isDark);
  } catch {
    document.documentElement.classList.add("dark");
  }
})();
`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-950 dark:bg-black dark:text-white">
        <ThemeProvider>
          <AuthProvider>{children}</AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
