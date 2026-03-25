import type { Metadata } from "next";
import "@/app/globals.css";

export const metadata: Metadata = {
  title: "Event Wheel Pro",
  description: "Gamified competition wheel MVP scaffold based on the supplied PRD."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.7.2/css/all.min.css" />
      </head>
      <body>{children}</body>
    </html>
  );
}
