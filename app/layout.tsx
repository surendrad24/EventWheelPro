import type { Metadata } from "next";
import "@/app/globals.css";
import { GlobalMatrixHeader } from "@/components/global-matrix-header";
import { store } from "@/lib/server/in-memory-store";

export const metadata: Metadata = {
  title: "Event Wheel Pro",
  description: "Gamified competition wheel MVP scaffold based on the supplied PRD."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const competitions = store.listCompetitions().map((competition) => ({
    id: competition.id,
    slug: competition.slug,
    title: competition.title,
    themeKey: competition.themeKey,
    status: competition.status
  }));

  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
      </head>
      <body>
        <GlobalMatrixHeader competitions={competitions} />
        {children}
      </body>
    </html>
  );
}
