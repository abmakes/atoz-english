"use client";

import { usePathname } from 'next/navigation';
import React from 'react';
import Image from 'next/image'; // Import next/image
import { Button } from '@/components/ui/button'; // Import Button
import Link from 'next/link'; // Import Link

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
  const navbarHeight = 'h-16'; // Define navbar height for padding calculation (adjust if needed)

  return (
    // This outer div ensures relative positioning context and applies conditional background
    //'bg-[#E8F8FF]
    <div className={`relative min-h-screen ${showSpecialBackground ? 'bg-[#A5E4FF]/60' : 'bg-background'}`}>
      
      {/* Conditionally Render Navbar - Now with new structure & sticky */} 
      {showNavbar && (
        <nav className={`sticky top-0 ${navbarHeight} w-full z-30 bg-background/80 backdrop-blur-sm flex items-center justify-between px-6`}>
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
          <div className="flex gap-6 grandstander text-lg">
            <Link href="/games" className="font-regular text-foreground hover:text-primary transition-colors hover:font-bold">Games</Link>
            <Link href="/create" className="font-regular text-foreground hover:text-primary transition-colors hover:font-bold">Create</Link>
            <Link href="/dashboard" className="font-regular text-foreground hover:text-primary transition-colors hover:font-bold">Dashboard</Link>
          </div>

          {/* Right: Buttons */}
          <div className="flex gap-4 w-44">
            <Button variant="solidAccent" className="grandstander pt-2">Login</Button>
            <Button variant="solidAccent" className="grandstander pt-2">Sign up</Button> {/* Assuming default variant is primary */} 
          </div>
        </nav>
      )}

      {/* Conditionally Render Background Waves - based on showSpecialBackground */} 
      {showSpecialBackground && (
        <>
          {/* Top Wave Image Container - Sits above background (z-10) */}
          <div className={`absolute top-0 left-0 w-full ${topWaveHeight} z-10`}>
            <Image
              src="/top-wave.png" // Path relative to /public
              alt="" // Decorative image
              fill={true} // Fill the container div
              style={{ objectFit: 'fill' }} // Stretch image to fill exactly
              priority // Optimize loading as it's likely above the fold
              aria-hidden="true"
            />
          </div>
          
          {/* Middle Wave Image Container - Sits above background (z-10) */}
          <div className={`absolute top-2/3 -translate-y-1/2 left-0 w-full ${middleWaveHeight} z-10`}>
            <Image
              src="/middle-wave.png" // Assume this image exists in /public
              alt="" // Decorative image
              fill={true}
              style={{ objectFit: 'fill', opacity: 1}}
              aria-hidden="true"
              priority
            />
          </div>
        </>
      )}
      {/* Main Content: Needs higher z-index (z-20) to be above waves */}
      <div className={`relative z-20 ${showNavbar ? 'pt-6' : ''}`}> 
        {children}
      </div>
    </div>
  );
} 