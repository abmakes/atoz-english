"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();
  
  // Check if it's a game page (for hiding nav)
  const isGamePage = pathname.startsWith('/games/') && pathname.length > '/games/'.length;
  
  // Don't show navigation on game pages
  if (isGamePage) {
    return null;
  }

  return (
    <nav className="sticky top-0 h-14 w-full z-30 bg-white/50 backdrop-blur-sm flex items-center justify-between px-6">
      {/* Left: Logo */}
      <Link href="/" className="flex items-center w-44">
        <h1 className="text-4xl font-bold grandstander text-[#114257] p-2">PlaytoZ</h1>
      </Link>

      {/* Middle: Links */}
      <div className="flex gap-6 h-full items-center grandstander">
        <Link href="/games" className="text-[--text-color] transition-colors hover:font-semibold">Games</Link>
        <SignedIn>
          <Link href="/create" className="text-[--text-color] transition-colors hover:font-semibold">Create</Link>
          <Link href="/quizzes" className="text-violet-500 transition-colors hover:font-semibold">Profile</Link>
        </SignedIn>

        {/* Right: Authentication Buttons */}
        <div className="flex text-base h-full gap-4 items-center">
          <SignedOut>
            <SignInButton mode="modal">
              <Button variant="outline" className="grandstander text-base h-8 px-6 border-2 border-gray-300 shadow-[2px_2px_0px_0px_#d1d5db]">
                Sign In
              </Button>
            </SignInButton>
            <SignUpButton mode="modal">
              <Button className="grandstander text-base h-8 px-6 bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-600 shadow-[2px_2px_0px_0px_#1e40af]">
                Sign Up
              </Button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-8 h-8"
                }
              }}
            />
          </SignedIn>
        </div>
      </div>
    </nav>
  );
}
