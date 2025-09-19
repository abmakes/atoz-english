"use client";

import { usePathname } from 'next/navigation';
import React from 'react';
import Image from 'next/image'; // Import next/image
import { Button } from '@/components/ui/button'; // Import Button
import Link from 'next/link'; // Import Link
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';

export default function ConditionalLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  
  // Define paths where the special background/nav should NOT be shown
  const excludeRoot = '/'; 
  const gamesBase = '/games/'; // Base path for actual game sessions

  // Check if it's the exact root path OR a specific game session
  const isExcludedPathForBackground = pathname === excludeRoot || 
                                     (pathname.startsWith(gamesBase) && pathname.length > gamesBase.length);

  // Check if it's ONLY a specific game session (for Navbar exclusion)
  const isGamePage = pathname.startsWith(gamesBase) && pathname.length > gamesBase.length;

  // Determine if the special background and image should be shown
  const showSpecialBackground = !isExcludedPathForBackground;
  
  // Determine if the Navbar should be shown (shown unless it's a game page)
  const showNavbar = !isGamePage;
  
  // Define heights for the wave images
  const topWaveHeight = 'h-[180px]'; // Adjust as needed
  const middleWaveHeight = 'h-[650px]'; // Adjust as needed
  const navbarHeight = 'h-14'; // Define navbar height for padding calculation (adjust if needed)

  return (
    // This outer div ensures relative positioning context and applies conditional background
    //'bg-[#E8F8FF]
    <div className={`relative min-h-screen ${showSpecialBackground ? 'bg-[#A5E4FF]/60' : 'bg-background'}`}>
      
      {/* Conditionally Render Navbar - Now with new structure & sticky */} 
      {showNavbar && (
        <nav className={`sticky top-0 ${navbarHeight} w-full z-30 bg-white/50 backdrop-blur-sm flex items-center justify-between px-6`}>
          {/* Left: Logo */}
          <Link href="/" className="flex items-center w-44">
            <h1 className="text-4xl font-bold grandstander text-[#114257] p-2">PlaytoZ</h1>
            {/* <Image 
              // Replace with your actual logo path and dimensions
              src="/placeholder.webp" 
              alt="PlaytoZ English Logo" 
              width={100} // Adjust width
              height={40} // Adjust height
            /> */}
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
      )}

      {/* Conditionally Render Background Waves - based on showSpecialBackground */} 
      {showSpecialBackground && (
        <>
          {/* Top Wave */}
          <div className={`absolute top-0 left-0 w-full ${topWaveHeight} z-0`}>
            <Image
              src="/top-wave.png"
              alt="Top Wave Background"
              fill
              className="object-cover object-bottom"
              priority
            />
          </div>

          {/* Middle Wave */}
          <div className={`absolute top-0 left-0 w-full ${middleWaveHeight} z-0`}>
            <Image
              src="/middle-wave.png"
              alt="Middle Wave Background"
              fill
              className="object-cover object-bottom"
              priority
            />
          </div>
        </>
      )}

      {/* Main Content */}
      <main className={`relative z-10 ${showNavbar ? `pt-${navbarHeight}` : ''}`}>
        {children}
      </main>
    </div>
  );
} 