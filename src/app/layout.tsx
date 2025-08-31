import type { Metadata } from "next";
import "../styles/globals.css";
import ConditionalLayoutWrapper from "@/components/layout/ConditionalLayoutWrapper";
import { StagewiseToolbar } from "@stagewise/toolbar-next";
import { CustomToastProvider } from "@/components/ui/CustomToast";
import { ReactPlugin } from "@stagewise-plugins/react";

export const metadata: Metadata = {
  title: "AtoZ English",
  description: "Learn English the fun way",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const stagewiseConfig = {
    plugins: [ReactPlugin],
  };
  return (
    <html lang="en">
      <body className="">
        <CustomToastProvider>
          <ConditionalLayoutWrapper>
            {children}
          </ConditionalLayoutWrapper>
          <StagewiseToolbar config={stagewiseConfig} />
        </CustomToastProvider>
      </body>
    </html>
  );
}
