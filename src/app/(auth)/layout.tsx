"use client";
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import React, { useEffect } from 'react';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push('/dashboard'); // Redirect to dashboard if already logged in
    }
  }, [user, loading, router]);

  // Optional: show a loading spinner while checking auth state, 
  // or just render children if routing handles the logged-in case.
  // For now, we let the page content handle its own loading if necessary.
  // The main purpose here is redirection if already logged in.
  
  return <>{children}</>;
}
