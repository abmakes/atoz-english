import type { Metadata } from "next";
import "../styles/globals.css";
import ConditionalLayoutWrapper from "@/components/layout/ConditionalLayoutWrapper";

export const metadata: Metadata = {
  title: "AtoZ English",
  description: "Learn English the fun way",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className="">
        <ConditionalLayoutWrapper>
          {children}
        </ConditionalLayoutWrapper>
      </body>
    </html>
  );
}
