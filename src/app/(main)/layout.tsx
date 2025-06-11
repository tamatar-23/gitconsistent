
"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { usePathname, useRouter } from 'next/navigation';
import { SidebarProvider, Sidebar, SidebarHeader, SidebarContent, SidebarInset, SidebarTrigger } from '@/components/ui/sidebar';
import Link from 'next/link';
import { LayoutGrid, Sparkles, BrainCircuit, ScrollText } from 'lucide-react'; // Removed Archive
import { SettingsDropdown } from '@/components/layout/settings-dropdown'; 
import { UserProfile } from '@/components/user-profile';
import { Button } from '@/components/ui/button';
import { CustomSidebarContent } from '@/components/layout/CustomSidebarContent';
import type { Habit, HabitLog } from '@/types/habit';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { format, subDays, startOfDay } from 'date-fns';
import { cn } from '@/lib/utils';
import { GitConsistentLogo } from '@/components/icons/git-consistent-logo';


export default function MainAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname(); 

  const [habits, setHabits] = useState<Habit[]>([]);
  const [habitLogs, setHabitLogs] = useState<HabitLog[]>([]);
  const [isLoadingHabits, setIsLoadingHabits] = useState(true);
  const [isLoadingLogs, setIsLoadingLogs] = useState(true);

  const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
  const todayDate = useMemo(() => startOfDay(new Date()), []);

  useEffect(() => {
    if (!authLoading && !user) {
      if (pathname !== '/signin' && pathname !== '/') {
         router.push('/signin');
      }
    }
  }, [user, authLoading, router, pathname]);

  useEffect(() => {
    if (!user) {
      setHabits([]);
      setHabitLogs([]);
      setIsLoadingHabits(true); 
      setIsLoadingLogs(true);
      return; 
    }

    setIsLoadingHabits(true);
    setIsLoadingLogs(true);

    const habitsQuery = query(
      collection(db, "habits"),
      where("userId", "==", user.uid),
      where("archived", "!=", true),
      orderBy("createdAt", "desc")
    );

    const sixtyDaysAgo = format(subDays(new Date(), 60), 'yyyy-MM-dd'); 
    const logsQuery = query(
      collection(db, "habitLogs"),
      where("userId", "==", user.uid),
      where("date", ">=", sixtyDaysAgo)
    );

    const unsubscribeHabits = onSnapshot(habitsQuery, (querySnapshot) => {
      const userHabits = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp
      } as Habit));
      setHabits(userHabits);
      setIsLoadingHabits(false);
    }, (error) => {
      console.error("Error fetching habits for sidebar:", error);
      setIsLoadingHabits(false);
    });

    const unsubscribeLogs = onSnapshot(logsQuery, (querySnapshot) => {
      const fetchedLogs = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt ? (doc.data().createdAt as Timestamp) : undefined
      } as HabitLog));
      setHabitLogs(fetchedLogs);
      setIsLoadingLogs(false);
    }, (error) => {
      console.error("Error fetching logs for sidebar:", error);
      setIsLoadingLogs(false);
    });

    return () => { 
      unsubscribeHabits();
      unsubscribeLogs();
    };
  }, [user]); 

  if (authLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <GitConsistentLogo className="h-16 w-16 animate-pulse text-primary" />
      </div>
    );
  }
  
  const NavButton = ({ href, children, isActive }: { href: string; children: React.ReactNode; isActive: boolean }) => (
    <Button
      variant="ghost"
      asChild
      className={cn(
        "text-sm font-medium transition-all hover:text-primary hover:bg-primary/10", 
        isActive ? "text-primary bg-primary/10" : "text-muted-foreground" 
      )}
    >
      <Link href={href}>{children}</Link>
    </Button>
  );

  const sidebarActuallyLoading = isLoadingHabits || isLoadingLogs;

  return (
    <SidebarProvider defaultOpen>
      <Sidebar collapsible="icon" className="border-r">
        <SidebarHeader>
            <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-lg text-primary">
                <GitConsistentLogo className="h-7 w-7 text-primary" />
                <span className="font-headline group-data-[collapsible=icon]:hidden">GitConsistent</span>
            </Link>
        </SidebarHeader>
        <SidebarContent>
          {user && ( 
            <CustomSidebarContent
              user={user}
              habits={habits}
              habitLogs={habitLogs}
              isLoading={sidebarActuallyLoading} 
              todayStr={todayStr}
              todayDate={todayDate}
            />
          )}
        </SidebarContent>
      </Sidebar>
      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center gap-4 border-b bg-background/80 backdrop-blur-sm px-4 lg:h-[60px] lg:px-6">
          <SidebarTrigger className="md:hidden" />
          <nav className="flex items-center gap-2">
            <NavButton href="/dashboard" isActive={pathname === '/dashboard'}>
              <LayoutGrid className="mr-2 h-5 w-5" /> Dashboard
            </NavButton>
            <NavButton href="/coach" isActive={pathname === '/coach'}>
              <Sparkles className="mr-2 h-5 w-5" /> AI Coach
            </NavButton>
            <NavButton href="/insights" isActive={pathname === '/insights'}>
              <BrainCircuit className="mr-2 h-5 w-5" /> Insights
            </NavButton>
            <NavButton href="/journal" isActive={pathname === '/journal'}>
              <ScrollText className="mr-2 h-5 w-5" /> Journal
            </NavButton>
            {/* Removed Archived NavButton from here */}
          </nav>
          <div className="ml-auto flex items-center gap-2">
            <SettingsDropdown /> 
            {user && <UserProfile />} 
          </div>
        </header>
        <main className="flex-1 p-4 lg:p-6 overflow-auto">
          {children}
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}

