import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Tasks | AtoZ PixiJS Game Platform",
  description: "View all tasks for the project",
};

export default function TaskLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
} 