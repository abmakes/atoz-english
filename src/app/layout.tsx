import type { Metadata } from "next";
import "../styles/globals.css";
import Navigation from "@/components/layout/Navigation";
import { CustomToastProvider } from "@/components/ui/CustomToast";
import { ClerkProvider } from "@clerk/nextjs";
import { ClerkActiveProvider } from "@/components/auth/ClerkActiveProvider";

export const metadata: Metadata = {
  title: "PlaytoZ — Classroom games for English teachers",
  description:
    "Create grammar and vocabulary quizzes, choose a classroom game, and keep every team engaged through the final question.",
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
      <body className="min-h-screen bg-[#f7fcff]">
        <div className="tide" aria-hidden="true">
          <svg className="tide-sheet tide-drift" viewBox="0 0 1440 900" preserveAspectRatio="none">
            <path fill="#ffffff" d="M0,120 C280,20 520,210 820,110 C1120,10 1320,150 1440,80 L1440,250 C1180,340 900,160 620,270 C300,390 80,240 0,300 Z" />
            <path fill="#d9f2ff" d="M0,430 C260,330 560,520 860,410 C1160,300 1340,470 1440,390 L1440,590 C1120,690 780,500 500,610 C220,720 40,560 0,620 Z" />
            <path fill="#ffffff" d="M0,700 C300,610 620,790 940,690 C1200,610 1360,740 1440,680 L1440,860 C1100,940 760,760 460,860 C180,950 20,820 0,860 Z" />
          </svg>
          <svg className="tide-sheet tide-drift-slow" viewBox="0 0 1440 900" preserveAspectRatio="none">
            <path fill="#eef8ff" opacity="0.85" d="M0,250 C320,160 640,340 980,230 C1220,160 1360,280 1440,220 L1440,400 C1080,500 740,300 420,420 C160,510 20,380 0,430 Z" />
            <path fill="#c5e9fc" opacity="0.55" d="M0,560 C340,470 700,650 1040,540 C1240,480 1360,600 1440,540 L1440,740 C1080,830 700,640 380,760 C140,840 10,700 0,750 Z" />
          </svg>
        </div>
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
