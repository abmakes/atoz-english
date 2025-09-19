import type { Metadata } from "next";
import "../styles/globals.css";
import ConditionalLayoutWrapper from "@/components/layout/ConditionalLayoutWrapper";
import { CustomToastProvider } from "@/components/ui/CustomToast";
import { ClerkProvider } from "@clerk/nextjs";

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
    <ClerkProvider>
      <html lang="en">
        <body className="">
          <CustomToastProvider>
            <ConditionalLayoutWrapper>
              {children}
            </ConditionalLayoutWrapper>
          </CustomToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
