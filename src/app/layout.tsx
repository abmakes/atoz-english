import type { Metadata } from "next";
import "../styles/globals.css";
import Navigation from "@/components/layout/Navigation";
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
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;
  
  // If Clerk key is not available, render without ClerkProvider
  if (!clerkPublishableKey) {
    return (
      <html lang="en">
        <body className="min-h-screen bg-white">
          <CustomToastProvider>
            <Navigation />
            <main className="relative z-10">
              {children}
            </main>
          </CustomToastProvider>
        </body>
      </html>
    );
  }

  return (
    <ClerkProvider publishableKey={clerkPublishableKey}>
      <html lang="en">
        <body className="min-h-screen bg-white">
          <CustomToastProvider>
            <Navigation />
            <main className="relative z-10">
              {children}
            </main>
          </CustomToastProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
