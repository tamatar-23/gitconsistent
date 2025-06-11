
"use client";

import React, { useEffect, useState, useCallback, useMemo } from 'react';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/hooks/use-auth';
import type { Habit, HabitLog } from '@/types/habit';
import { HabitForm } from '@/components/habits/habit-form';
import { HabitContributionGraph } from '@/components/habits/habit-contribution-graph';
import { HabitListItem } from '@/components/habits/habit-list-item';
import { Button } from '@/components/ui/button';
import { PlusCircle, Flame, Sparkles } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { format, startOfDay, subDays } from 'date-fns';

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
        // Fetch logs for the past year + a bit more to ensure graph continuity
        const graphStartDate = format(subDays(currentDateAnchor, (53 * 7)), 'yyyy-MM-dd');


        const logsQuery = query(
            collection(db, "habitLogs"),
            where("userId", "==", user.uid),
            where("date", ">=", graphStartDate)
        );
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
    }, [user, currentDateAnchor]);

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
            <div className="space-y-6 p-1 md:p-0">
                <div className="flex justify-between items-center">
                    <Skeleton className="h-9 w-40 rounded" />
                    <Skeleton className="h-10 w-36 rounded" />
                </div>
                <Skeleton className="h-8 w-48 rounded" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card className="w-full h-[250px]"> {/* Mimic fixed size */}
                        <CardHeader><Skeleton className="h-6 w-3/5 rounded mb-2" /><Skeleton className="h-9 w-28 rounded self-end" /></CardHeader>
                        <CardContent><Skeleton className="h-32 w-full rounded" /></CardContent>
                    </Card>
                    <Card className="w-full h-[250px]"> {/* Mimic fixed size */}
                        <CardHeader><Skeleton className="h-6 w-3/5 rounded mb-2" /><Skeleton className="h-9 w-28 rounded self-end" /></CardHeader>
                        <CardContent><Skeleton className="h-32 w-full rounded" /></CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8 p-1 md:p-0">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-3">
                    <h1 className="text-3xl font-headline font-bold">My Habits</h1>
                    {(longestStreak > 0 || (!isLoadingPage && habits.length > 0)) && (
                        <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-orange-100 dark:bg-orange-500/20">
                            <Flame className="h-5 w-5 text-orange-500 dark:text-orange-400" />
                            <span className="text-lg font-semibold text-orange-600 dark:text-orange-300">{longestStreak}</span>
                            <span className="text-sm text-orange-500 dark:text-orange-400">day streak</span>
                        </div>
                    )}
                    {isLoadingPage && habits.length > 0 && <Skeleton className="h-8 w-24 rounded-full" />}
                </div>
                <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
                    <DialogTrigger asChild>
                        <Button>
                            <PlusCircle className="mr-2 h-5 w-5" /> Add New Habit
                        </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[525px]">
                        <DialogHeader>
                            <DialogTitle className="font-headline">Add a New Habit</DialogTitle>
                        </DialogHeader>
                        <HabitForm onSuccess={() => { setIsFormOpen(false); }} />
                    </DialogContent>
                </Dialog>
            </div>

            {habits.length === 0 && !isLoadingPage ? (
                <Card className="text-center py-12">
                    <CardHeader>
                        <Sparkles className="h-12 w-12 text-primary mx-auto mb-4" />
                        <CardTitle className="font-headline text-2xl">No habits yet!</CardTitle>
                        <CardDescription>Start building positive routines by adding your first habit.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Button onClick={() => setIsFormOpen(true)}>
                            <PlusCircle className="mr-2 h-5 w-5" /> Add Your First Habit
                        </Button>
                    </CardContent>
                </Card>
            ) : (
                <div className="flex flex-wrap gap-6 justify-center md:justify-start">
                    {isLoadingPage && habits.map((habit) => ( // This skeleton part might need adjustment for fixed size
                        <Card key={`loading-graph-${habit.id}`} className="w-96 h-[250px]">
                            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                                <CardTitle className="font-headline text-lg"><Skeleton className="h-6 w-40 rounded" /></CardTitle>
                                <Skeleton className="h-9 w-32 rounded" />
                            </CardHeader>
                            <CardContent><Skeleton className="h-[150px] w-full rounded" /></CardContent>
                        </Card>
                    ))}
                    {!isLoadingPage && habits.map((habit) => (
                        <HabitListItem
                            key={habit.id}
                            habit={habit}
                            isCompletedToday={isHabitCompletedToday(habit.id)}
                            todayGlobal={todayStr}
                            currentDateAnchor={currentDateAnchor}
                            onHabitUpdated={handleHabitUpdated}
                        >
                            <HabitContributionGraph
                                habit={habit}
                                logsForThisHabit={getLogsForHabit(habit.id)}
                                currentDateAnchor={currentDateAnchor}
                                todayGlobal={todayStr}
                            />
                        </HabitListItem>
                    ))}
                </div>
            )}
        </div>
    );
}

