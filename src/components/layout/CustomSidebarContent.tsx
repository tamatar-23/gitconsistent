
"use client";

import React, { useState, useCallback, useMemo, useEffect } from 'react';
import type { User } from 'firebase/auth';
import type { Habit, HabitLog } from '@/types/habit';
import { format, subDays, getDay, parseISO, startOfDay } from 'date-fns';
import { HabitSidebarItem } from './HabitSidebarItem';
import { toggleHabitCompletionAction } from '@/app/(main)/actions';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { WeeklyProgressChart, type WeeklyDataPoint } from './WeeklyProgressChart';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Archive } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface CustomSidebarContentProps {
  user: User;
  habits: Habit[];
  habitLogs: HabitLog[]; // These logs are now for the last 60 days
  isLoading: boolean;
  todayStr: string;
  todayDate: Date; // Date object for start of today
}

const stoicQuotes = [
  "The best revenge is to be unlike him who performed the injury. - Marcus Aurelius",
  "Waste no more time arguing about what a good man should be. Be one. - Marcus Aurelius",
  "It is not death that a man should fear, but he should fear never beginning to live. - Marcus Aurelius",
  "The happiness of your life depends upon the quality of your thoughts. - Marcus Aurelius",
  "If it is not right, do not do it; if it is not true, do not say it. - Marcus Aurelius",
  "Wealth consists not in having great possessions, but in having few wants. - Epictetus",
  "First say to yourself what you would be; and then do what you have to do. - Epictetus",
  "It's not what happens to you, but how you react to it that matters. - Epictetus",
  "We suffer more often in imagination than in reality. - Seneca",
  "Luck is what happens when preparation meets opportunity. - Seneca",
  "Difficulties strengthen the mind, as labor does the body. - Seneca",
  "Begin at once to live, and count each separate day as a separate life. - Seneca",
];

const getDayOfYear = (date: Date): number => {
  const start = new Date(date.getFullYear(), 0, 0);
  const diff = (date.getTime() - start.getTime()) + ((start.getTimezoneOffset() - date.getTimezoneOffset()) * 60 * 1000);
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
};

const calculateIndividualDailyStreak = (
  habit: Habit,
  allUserLogs: HabitLog[],
  todayDateForStreak: Date // Expects startOfDay(new Date())
): number => {
  if (habit.frequency !== 'daily') {
    return 0;
  }

  const logsForThisHabit = allUserLogs.filter(
    (log) => log.habitId === habit.id && log.completed
  );
  if (logsForThisHabit.length === 0) return 0;

  const completedDates = new Set(logsForThisHabit.map((log) => log.date));

  let streak = 0;
  let currentDateToCheck = todayDateForStreak; // Already start of day

  if (completedDates.has(format(currentDateToCheck, 'yyyy-MM-dd'))) {
    streak++;
    let previousDay = subDays(currentDateToCheck, 1);
    while (completedDates.has(format(previousDay, 'yyyy-MM-dd'))) {
      streak++;
      previousDay = subDays(previousDay, 1);
    }
  } else {
    // Check if streak ended yesterday
    currentDateToCheck = subDays(todayDateForStreak, 1);
    if (completedDates.has(format(currentDateToCheck, 'yyyy-MM-dd'))) {
      streak++;
      let previousDay = subDays(currentDateToCheck, 1);
      while (completedDates.has(format(previousDay, 'yyyy-MM-dd'))) {
        streak++;
        previousDay = subDays(previousDay, 1);
      }
    }
  }
  return streak;
};


export function CustomSidebarContent({ user, habits, habitLogs, isLoading, todayStr, todayDate }: CustomSidebarContentProps) {
  const { toast } = useToast();
  const [loadingHabitId, setLoadingHabitId] = useState<string | null>(null);
  const [dailyQuote, setDailyQuote] = useState<string>("");
  const pathname = usePathname();

  useEffect(() => {
    const today = new Date();
    const dayIndex = getDayOfYear(today);
    const quoteIndex = dayIndex % stoicQuotes.length;
    setDailyQuote(stoicQuotes[quoteIndex]);
  }, []);

  const isHabitCompletedToday = useCallback((habitId: string): boolean => {
    return habitLogs.some(log => log.habitId === habitId && log.date === todayStr && log.completed);
  }, [habitLogs, todayStr]);

  const handleToggleCompletion = async (habitId: string, currentCompletedStatus: boolean) => {
    if (!user || !user.uid) {
      toast({ title: "Error", description: "User not found.", variant: "destructive" });
      return;
    }
    setLoadingHabitId(habitId);
    try {
      await toggleHabitCompletionAction(user.uid, habitId, todayStr, !currentCompletedStatus);
    } catch (error: any) {
      toast({ title: "Error", description: error.message || "Failed to update habit.", variant: "destructive" });
    } finally {
      setLoadingHabitId(null);
    }
  };

  const currentDateFormatted = useMemo(() => format(new Date(), "MMMM d, yyyy"), []);

  const weeklyProgressData: WeeklyDataPoint[] = useMemo(() => {
    const data: WeeklyDataPoint[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const day = subDays(today, i);
      const dayStr = format(day, 'yyyy-MM-dd');
      const dayName = format(day, 'EEEEE'); // Use 'EEEEE' for narrow day name (M, T, W, etc.)

      let completedCount = 0;
      let totalApplicableHabitsToday = 0;

      habits.forEach(habit => {
        let isApplicableToday = false;
        if (habit.frequency === 'daily') {
          isApplicableToday = true;
        } else if (habit.frequency === 'weekly') {
          const dayOfWeek = getDay(day);
          if (habit.targetDays?.includes(dayOfWeek)) {
            isApplicableToday = true;
          }
        }

        if (isApplicableToday) {
          totalApplicableHabitsToday++;
          const log = habitLogs.find(l => l.habitId === habit.id && l.date === dayStr && l.completed);
          if (log) {
            completedCount++;
          }
        }
      });
      data.push({ name: dayName, completed: completedCount, totalApplicable: totalApplicableHabitsToday });
    }
    return data;
  }, [habits, habitLogs]);


  if (isLoading) {
    return (
      <div className="flex flex-col h-full">
        <div className="flex-grow p-2 space-y-4 overflow-hidden">
          <div className="mb-4 group-data-[collapsible=icon]:hidden">
            <Skeleton className="h-6 w-3/4 mb-1" />
            <Skeleton className="h-4 w-1/2" />
          </div>

          {Array.from({ length: 3 }).map((_, i) => (
            <div key={`skeleton-habit-${i}`} className="flex items-center space-x-3 p-2 rounded-lg group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center">
              <Skeleton className="h-7 w-7 rounded group-data-[collapsible=icon]:h-8 group-data-[collapsible=icon]:w-8" />
              <div className="flex-1 space-y-1 group-data-[collapsible=icon]:hidden">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
              <Skeleton className="h-9 w-9 rounded-full group-data-[collapsible=icon]:hidden" />
            </div>
          ))}
          <div className="group-data-[collapsible=icon]:hidden pt-4 space-y-3 p-1">
            <Skeleton className="bg-muted p-3 rounded-lg h-[118px] w-full">
              <Skeleton className="h-4 w-1/3 mb-2.5 bg-background/50" />
              <div className="flex justify-around items-end h-[calc(100%-1.625rem)]">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div key={`skeleton-chart-bar-${i}`} className="flex flex-col items-center space-y-1.5 flex-1">
                    <Skeleton className="h-3 w-5 bg-background/30" />
                    <Skeleton className="h-14 max-h-full w-6 rounded-full bg-secondary" />
                    <Skeleton className="h-3 w-5 bg-background/30" />
                  </div>
                ))}
              </div>
            </Skeleton>
          </div>
        </div>
        <div className="group-data-[collapsible=icon]:hidden mt-auto px-4 pb-6 pt-4 text-center">
          <Skeleton className="h-2 w-4/5 mx-auto mb-2 opacity-50" />
          <Skeleton className="h-2 w-3/5 mx-auto opacity-50" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <ScrollArea className="flex-grow">
        <div className="p-3 space-y-2">
          <div className="mb-4 px-1 group-data-[collapsible=icon]:hidden flex justify-between items-end">
            <h2 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-80">Today</h2>
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground opacity-40">{currentDateFormatted}</p>
          </div>

          {habits.length === 0 && !isLoading && (
            <p className="text-xs text-muted-foreground px-1 group-data-[collapsible=icon]:hidden">No habits yet. Add some on the dashboard!</p>
          )}

          <ul className="space-y-1.5">
            {habits.map(habit => {
              const streak = calculateIndividualDailyStreak(habit, habitLogs, todayDate);
              return (
                <HabitSidebarItem
                  key={habit.id}
                  habit={habit}
                  isCompleted={isHabitCompletedToday(habit.id)}
                  onToggle={() => handleToggleCompletion(habit.id, isHabitCompletedToday(habit.id))}
                  isLoading={loadingHabitId === habit.id}
                  streak={streak}
                />
              );
            })}
          </ul>

          {habits.length > 0 && (
            <div className="group-data-[collapsible=icon]:hidden pt-6 px-1">
              <WeeklyProgressChart data={weeklyProgressData} />
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="px-3 pb-3 group-data-[collapsible=icon]:px-1 group-data-[collapsible=icon]:pb-1 pt-2">
        <Link href="/archive" passHref legacyBehavior>
          <Button
            variant="ghost"
            className={cn(
              "w-full justify-start text-[13px] font-medium transition-colors h-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:p-0 rounded-lg",
              pathname === '/archive'
                ? "bg-sidebar-accent text-sidebar-accent-foreground shadow-sm ring-1 ring-border"
                : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            )}
            title="Archived Habits"
          >
            <Archive className="h-4 w-4 group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />
            <span className="ml-3 group-data-[collapsible=icon]:hidden tracking-wide">Archived Habits</span>
          </Button>
        </Link>
      </div>

      {dailyQuote && (
        <div className="group-data-[collapsible=icon]:hidden px-4 pb-6 pt-2 text-center opacity-70">
          <p className="text-[11px] font-semibold text-muted-foreground tracking-widest mb-2 leading-relaxed">
            &ldquo;{dailyQuote.split(" - ")[0]}&rdquo;
          </p>
          <p className="text-[10px] font-bold text-muted-foreground/60 tracking-widest">- {dailyQuote.split(" - ")[1]}</p>
        </div>
      )}
    </div>
  );
}

