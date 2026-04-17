
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Habit, HabitLog } from '@/types/habit';
import { HabitForm } from '@/components/habits/habit-form';
import dynamic from 'next/dynamic';
import { endOfWeek, format, startOfDay, subDays } from 'date-fns';

const HabitContributionGraph = dynamic(
  () => import('@/components/habits/habit-contribution-graph').then(mod => mod.HabitContributionGraph),
  { ssr: false, loading: () => <div className="h-[140px] w-full border rounded-md p-4 bg-card shadow-sm mb-4"><div className="h-full w-full bg-muted animate-pulse rounded-md" /></div> }
);
import { HabitListItem } from '@/components/habits/habit-list-item';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';

// Streak Calculation
const calculateLongestCurrentDailyStreak = (habits: Habit[], habitLogs: HabitLog[]): number => {
    let maxStreak = 0;
    const today = startOfDay(new Date());

    habits.forEach(habit => {
        if (habit.frequency === 'daily') {
            let currentStreak = 0;
            let currentDate = today;

            const logsForHabit = habitLogs
                .filter(log => log.habitId === habit.id && log.completed);

            const completedDates = new Set(logsForHabit.map(log => log.date));

            while(completedDates.has(format(currentDate, 'yyyy-MM-dd'))) {
                currentStreak++;
                currentDate = subDays(currentDate, 1);
            }

            if (currentStreak > maxStreak) {
                maxStreak = currentStreak;
            }
        }
    });
    return maxStreak;
};


export default function DashboardPage() {
    const { user } = useAuth();
    const [habits, setHabits] = useState<Habit[]>([]);
    const [allHabitLogsForYear, setAllHabitLogsForYear] = useState<HabitLog[]>([]);
    const [isLoadingHabits, setIsLoadingHabits] = useState(true);
    const [isLoadingLogs, setIsLoadingLogs] = useState(true);
    const [isFormOpen, setIsFormOpen] = useState(false);

    const todayStr = useMemo(() => format(new Date(), 'yyyy-MM-dd'), []);
    const [longestStreak, setLongestStreak] = useState(0);
    const currentDateAnchor = useMemo(() => startOfDay(new Date()), []);
    const [selectedYearMode, setSelectedYearMode] = useState<string>("lastYear");
    const fetchHabits = useCallback(() => {
        if (!user) return;
        setIsLoadingHabits(true);
        const habitsQuery = query(
            collection(db, "habits"),
            where("userId", "==", user.uid),
            where("archived", "!=", true),
            orderBy("createdAt", "desc")
        );
        const unsubscribe = onSnapshot(habitsQuery, (querySnapshot) => {
            const userHabits = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt as Timestamp
            } as Habit));
            setHabits(userHabits);
            setIsLoadingHabits(false);
        }, (error) => {
            console.error("Error fetching habits:", error);
            setIsLoadingHabits(false);
        });
        return unsubscribe;
    }, [user]);

    const fetchLogsForYear = useCallback(() => {
        if (!user) return;
        setIsLoadingLogs(true);
        
        let graphStartDate: string;
        let graphEndDate: string | null = null;

        if (selectedYearMode === "lastYear") {
            graphStartDate = format(subDays(currentDateAnchor, (53 * 7)), 'yyyy-MM-dd');
        } else {
            const yearNum = parseInt(selectedYearMode, 10);
            graphStartDate = `${yearNum}-01-01`;
            graphEndDate = `${yearNum}-12-31`;
        }

        const queryConstraints: any[] = [
            where("userId", "==", user.uid),
            where("date", ">=", graphStartDate)
        ];
        
        if (graphEndDate) {
            queryConstraints.push(where("date", "<=", graphEndDate));
        }

        const logsQuery = query(collection(db, "habitLogs"), ...queryConstraints);
        const unsubscribe = onSnapshot(logsQuery, (querySnapshot) => {
            const fetchedLogs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt ? (doc.data().createdAt as Timestamp) : undefined
            } as HabitLog));
            setAllHabitLogsForYear(fetchedLogs);
            setIsLoadingLogs(false);
        }, (error) => {
            console.error("Error fetching logs for year:", error);
            setIsLoadingLogs(false);
        });
        return unsubscribe;
    }, [user, currentDateAnchor, selectedYearMode]);

    useEffect(() => {
        const unsubscribeHabits = fetchHabits();
        const unsubscribeLogs = fetchLogsForYear();
        return () => {
            unsubscribeHabits?.();
            unsubscribeLogs?.();
        };
    }, [fetchHabits, fetchLogsForYear]);

    useEffect(() => {
        if (!isLoadingHabits && !isLoadingLogs) {
            if (habits.length > 0 && allHabitLogsForYear.length > 0){
                setLongestStreak(calculateLongestCurrentDailyStreak(habits, allHabitLogsForYear));
            } else {
                setLongestStreak(0);
            }
        }
    }, [habits, allHabitLogsForYear, isLoadingHabits, isLoadingLogs]);


    const isHabitCompletedToday = (habitId: string) => {
        return allHabitLogsForYear.some(log => log.habitId === habitId && log.date === todayStr && log.completed);
    };

    const getLogsForHabit = (habitId: string) => {
        return allHabitLogsForYear.filter(log => log.habitId === habitId);
    };

    const isLoadingPage = isLoadingHabits || isLoadingLogs;

    const handleHabitUpdated = () => {
        // Actions in `actions.ts` use revalidatePath
    };


    if (isLoadingPage && habits.length === 0) {
        return (
            <div className="space-y-6 p-1 md:p-0 min-w-0">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-8 w-32 rounded" />
                    <Skeleton className="h-9 w-32 rounded" />
                </div>
                <div className="space-y-6">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="border rounded-md p-4 space-y-3">
                            <Skeleton className="h-5 w-48 rounded" />
                            <Skeleton className="h-[120px] w-full rounded" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 p-1 md:p-0 min-w-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-baseline gap-3">
                    <h1 className="text-2xl font-bold text-foreground">Habits</h1>
                    {(longestStreak > 0 || (!isLoadingPage && habits.length > 0)) && (
                        <span className="text-sm text-muted-foreground">
                            {longestStreak > 0 ? `${longestStreak}-day streak` : "No active streak"}
                        </span>
                    )}
                    {isLoadingPage && habits.length > 0 && <Skeleton className="h-4 w-20 rounded" />}
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                            <PlusCircle className="mr-1.5 h-4 w-4" /> Add habit
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                            <DialogTitle>Add a New Habit</DialogTitle>
                        </DialogHeader>
                        <HabitForm onSuccess={() => { setIsFormOpen(false); }} />
                    </DialogContent>
                </Dialog>
            </div>

            {habits.length === 0 && !isLoadingPage ? (
                <div className="text-center py-16 text-muted-foreground">
                    <p className="mb-4">No habits yet. Add one to get started.</p>
                    <Button variant="outline" size="sm" onClick={() => setIsFormOpen(true)}>
                        <PlusCircle className="mr-1.5 h-4 w-4" /> Add your first habit
                    </Button>
                </div>
            ) : (
                <>
                    {/* Global Activity Graph */}
                    {!isLoadingPage && allHabitLogsForYear.length > 0 && (
                        <div className="mb-4">
                            <HabitContributionGraph
                                logs={allHabitLogsForYear}
                                currentDateAnchor={currentDateAnchor}
                                todayGlobal={todayStr}
                                selectedYearMode={selectedYearMode}
                                onYearModeChange={setSelectedYearMode}
                            />
                        </div>
                    )}

                    <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
                        <div className="divide-y divide-border">
                            {!isLoadingPage && habits.map((habit) => (
                                <HabitListItem
                                    key={habit.id}
                                    habit={habit}
                                    logs={getLogsForHabit(habit.id)}
                                    isCompletedToday={isHabitCompletedToday(habit.id)}
                                    todayGlobal={todayStr}
                                    currentDateAnchor={currentDateAnchor}
                                    onHabitUpdated={handleHabitUpdated}
                                />
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
}
