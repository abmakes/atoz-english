'use client';

import { useAuth } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import LoadingSpinner from '@/components/loading_spinner';
import { useIsClerkActive } from '@/components/auth/ClerkActiveProvider';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ClerkProtectedRoute({ children }: ProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push('/');
    }
  }, [isLoaded, isSignedIn, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  return <>{children}</>;
}

/**
 * When Clerk is not configured, allow access (local/dev fallback).
 * When Clerk is active, require a signed-in session.
 */
export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const clerkActive = useIsClerkActive();

  if (!clerkActive) {
    return <>{children}</>;
  }

  return <ClerkProtectedRoute>{children}</ClerkProtectedRoute>;
}
