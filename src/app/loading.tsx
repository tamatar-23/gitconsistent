
"use client";

import { GitConsistentLogo } from '@/components/icons/git-consistent-logo';
import { Progress } from "@/components/ui/progress";
import { useEffect, useState } from 'react';

export default function Loading() {
  const [progressValue, setProgressValue] = useState(10);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgressValue((prevValue) => {
        if (prevValue >= 90) {
          // Stay at 90 or a high number to indicate almost done
          // as the actual page load will complete it.
          return 90;
        }
        return prevValue + 10;
      });
    }, 300); // Adjust interval for speed

    return () => {
      clearInterval(timer);
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <GitConsistentLogo className="h-16 w-16 animate-pulse text-primary" />
      <p className="mt-4 mb-6 text-lg text-foreground">Loading GitConsistent...</p>
      <div className="w-full max-w-xs sm:max-w-sm md:max-w-md">
        <Progress value={progressValue} className="h-2 [&>div]:bg-primary" />
      </div>
    </div>
  );
}
