"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { SignInButton, SignUpButton, UserButton, SignedIn, SignedOut } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { useIsClerkActive } from '@/components/auth/ClerkActiveProvider';

function ClerkAuthControls({ mobile = false }: { mobile?: boolean }) {
  if (mobile) {
    return (
      <div className="flex flex-col gap-3 pt-4 border-t border-gray-200">
        <SignedOut>
          <SignInButton mode="modal">
            <Button variant="outline" className="grandstander text-base h-10 px-6 border-2 border-gray-300 shadow-[2px_2px_0px_0px_#d1d5db] w-full">
              Sign In
            </Button>
          </SignInButton>
          <SignUpButton mode="modal">
            <Button className="grandstander text-base h-10 px-6 bg-blue-500 hover:bg-blue-600 text-white border-2 border-blue-600 shadow-[2px_2px_0px_0px_#1e40af] w-full">
              Sign Up
            </Button>
          </SignUpButton>
        </SignedOut>
        <SignedIn>
          <div className="flex justify-center">
            <UserButton
              appearance={{
                elements: {
                  avatarBox: "w-10 h-10"
                }
              }}
            />
          </div>
        </SignedIn>
      </div>
    );
  }

  return (
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
  );
}

export default function Navigation() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const clerkActive = useIsClerkActive();

  const isGamePage = pathname.startsWith('/games/') && pathname.length > '/games/'.length;
  // Student-facing story pages (recording / watching) get a clean, nav-free screen.
  const isStudentStoryPage = pathname.startsWith('/story/');

  if (isGamePage || isStudentStoryPage) {
    return null;
  }

  return (
    <nav className="sticky top-0 h-14 w-full z-30 bg-white/50 backdrop-blur-sm flex items-center justify-between px-6">
      <Link href="/" className="flex items-center w-44">
        <h1 className="text-4xl font-bold grandstander text-[#114257] p-2">PlaytoZ</h1>
      </Link>

      <div className="hidden lg:flex gap-6 h-full items-center grandstander">
        <Link href="/games" className="text-[--text-color] transition-colors hover:font-semibold">Games</Link>
        {clerkActive ? (
          <SignedIn>
            <Link href="/create" className="text-[--text-color] transition-colors hover:font-semibold">Create</Link>
            <Link href="/tools" className="text-[--text-color] transition-colors hover:font-semibold">Tools</Link>
            <Link href="/quizzes" className="text-violet-500 transition-colors hover:font-semibold">Profile</Link>
          </SignedIn>
        ) : (
          <>
            <Link href="/create" className="text-[--text-color] transition-colors hover:font-semibold">Create</Link>
            <Link href="/tools" className="text-[--text-color] transition-colors hover:font-semibold">Tools</Link>
            <Link href="/quizzes" className="text-violet-500 transition-colors hover:font-semibold">Profile</Link>
          </>
        )}

        {clerkActive ? <ClerkAuthControls /> : null}
      </div>

      <div className="lg:hidden">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="h-10 w-10"
          aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMobileMenuOpen}
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </Button>
      </div>

      {isMobileMenuOpen && (
        <div className="absolute top-14 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 shadow-lg lg:hidden">
          <div className="flex flex-col p-4 space-y-4">
            <Link
              href="/games"
              className="text-[--text-color] transition-colors hover:font-semibold py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Games
            </Link>
            {clerkActive ? (
              <SignedIn>
                <Link
                  href="/create"
                  className="text-[--text-color] transition-colors hover:font-semibold py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Create
                </Link>
                <Link
                  href="/tools"
                  className="text-[--text-color] transition-colors hover:font-semibold py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Tools
                </Link>
                <Link
                  href="/quizzes"
                  className="text-violet-500 transition-colors hover:font-semibold py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
              </SignedIn>
            ) : (
              <>
                <Link
                  href="/create"
                  className="text-[--text-color] transition-colors hover:font-semibold py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Create
                </Link>
                <Link
                  href="/tools"
                  className="text-[--text-color] transition-colors hover:font-semibold py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Tools
                </Link>
                <Link
                  href="/quizzes"
                  className="text-violet-500 transition-colors hover:font-semibold py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Profile
                </Link>
              </>
            )}

            {clerkActive ? <ClerkAuthControls mobile /> : null}
          </div>
        </div>
      )}
    </nav>
  );
}
