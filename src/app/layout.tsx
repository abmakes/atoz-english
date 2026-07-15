import type { Metadata } from "next";
import "../styles/globals.css";
import Navigation from "@/components/layout/Navigation";
import { CustomToastProvider } from "@/components/ui/CustomToast";
import { ClerkProvider } from "@clerk/nextjs";
import { ClerkActiveProvider } from "@/components/auth/ClerkActiveProvider";

export const metadata: Metadata = {
  title: "PlaytoZ — English quizzes that play like fair fights",
  description:
    "Create English quizzes in clicks. Students compete with skill and speed in Team Quiz or Splash Dash — timers, power-ups, and teams without luck replacing learning.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY?.trim();
  const clerkActive = Boolean(clerkPublishableKey);

  const body = (
    <ClerkActiveProvider active={clerkActive}>
      <CustomToastProvider>
        <Navigation />
        <main className="relative z-10">
          {children}
        </main>
      </CustomToastProvider>
    </ClerkActiveProvider>
  );

  return (
    <html lang="en">
      <body className="min-h-screen bg-white">
        {clerkActive ? (
          <ClerkProvider publishableKey={clerkPublishableKey}>
            {body}
          </ClerkProvider>
        ) : (
          body
        )}
      </body>
    </html>
  );
}
