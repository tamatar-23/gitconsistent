"use client";

import type { Habit, HabitLog } from "@/types/habit";
import { Button } from "@/components/ui/button";
import { Trash2, MoreVertical, Repeat, Square, CheckSquare, Loader2, Archive as ArchiveIcon, Pencil } from "lucide-react";
import { useState, useMemo } from "react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { deleteHabitAction, archiveHabitAction, toggleHabitCompletionAction } from "@/app/(main)/actions";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogHeader, DialogTitle as FormDialogTitle } from '@/components/ui/dialog';
import { HabitForm } from './habit-form';
import { format, subDays, parseISO } from 'date-fns';
import { cn } from '@/lib/utils';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

interface HabitListItemProps {
    habit: Habit;
    logs: HabitLog[];
    isCompletedToday: boolean;
    todayGlobal: string;
    currentDateAnchor: Date;
    onHabitUpdated: () => void;
}

const daysOfWeekMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HabitListItem({
    habit,
    logs,
    isCompletedToday,
    todayGlobal,
    currentDateAnchor,
    onHabitUpdated
}: HabitListItemProps): JSX.Element {
    const { user } = useAuth();
    const { toast } = useToast();

    const [loadingAction, setLoadingAction] = useState<string | null>(null);
    const [isArchiveDialogOpen, setIsArchiveDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

    const isToggleButtonDisabled = useMemo(() => {
        return loadingAction === 'toggle';
    }, [loadingAction]);

    const handleToggleCompletion = async () => {
        if (!user || !user.uid) {
            toast({ title: "Error", description: "User not found.", variant: "destructive" });
            return;
        }
        setLoadingAction('toggle');
        try {
            await toggleHabitCompletionAction(user.uid, habit.id, todayGlobal, !isCompletedToday);
            toast({
                title: "Success",
                description: `Habit marked as ${!isCompletedToday ? "complete" : "incomplete"} for today.`,
            });
            onHabitUpdated();
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to update habit status.", variant: "destructive" });
        } finally {
            setLoadingAction(null);
        }
    };

    const handleDelete = async () => {
        if (!user || !user.uid) {
            toast({ title: "Error", description: "User not found.", variant: "destructive" });
            return;
        }
        setLoadingAction('delete');
        try {
            await deleteHabitAction(user.uid, habit.id);
            toast({ title: "Success", description: "Habit deleted." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to delete habit.", variant: "destructive" });
        } finally {
            setLoadingAction(null);
            setIsDeleteDialogOpen(false);
        }
    };

    const handleArchive = async () => {
        if (!user || !user.uid) {
            toast({ title: "Error", description: "User not found.", variant: "destructive" });
            return;
        }
        setLoadingAction('archive');
        try {
            await archiveHabitAction(user.uid, habit.id);
            toast({ title: "Success", description: "Habit archived." });
        } catch (error: any) {
            toast({ title: "Error", description: error.message || "Failed to archive habit.", variant: "destructive" });
        } finally {
            setLoadingAction(null);
            setIsArchiveDialogOpen(false);
        }
    };

    const getFrequencyText = () => {
        if (habit.frequency === 'daily') return 'Daily';
        if (habit.frequency === 'weekly' && habit.targetDays && habit.targetDays.length > 0) {
            if (habit.targetDays.length === 7) return 'Daily (Weekly Target)';
            if (habit.targetDays.length === 0) return 'Weekly (No specific days)';
            return habit.targetDays.sort((a, b) => a - b).map(dayIndex => daysOfWeekMap[dayIndex]).join(', ');
        }
        return 'Weekly';
    };

    // Calculate last 7 days history
    const last7Days = useMemo(() => {
        const days = [];
        for (let i = 6; i >= 0; i--) {
            const date = subDays(currentDateAnchor, i);
            const dateStr = format(date, 'yyyy-MM-dd');
            const isCompleted = logs.some(log => log.date === dateStr && log.completed);
            days.push({ date, dateStr, isCompleted });
        }
        return days;
    }, [currentDateAnchor, logs]);

    return (
        <div className="group flex items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-muted/30">
            <div className="flex items-center gap-4 flex-1 min-w-0">
                <button
                    onClick={handleToggleCompletion}
                    disabled={isToggleButtonDisabled}
                    className={cn(
                        "flex-shrink-0 w-[22px] h-[22px] rounded-full border-[1.5px] flex items-center justify-center transition-all duration-200 ease-in-out",
                        isCompletedToday
                            ? "bg-[var(--graph-4)] border-[var(--graph-4)] text-background shadow-[0_0_8px_rgba(57,211,83,0.3)]"
                            : "border-muted-foreground/40 hover:border-[var(--graph-4)]/60 bg-transparent text-transparent",
                        isToggleButtonDisabled && "opacity-50 cursor-not-allowed"
                    )}
                >
                    {loadingAction === 'toggle' ? (
                        <Loader2 className="h-3 w-3 animate-spin text-muted-foreground" />
                    ) : (
                        <svg viewBox="0 0 14 14" className={cn("w-3.5 h-3.5 fill-current outline-none transition-transform duration-200", isCompletedToday ? "scale-100 opacity-100" : "scale-50 opacity-0")} xmlns="http://www.w3.org/2000/svg"><path d="M5.5 10.5L2 7l1.4-1.4 2.1 2.1 6.1-6.1L13 3l-7.5 7.5z" /></svg>
                    )}
                </button>

                <div className="flex flex-col flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className={cn("font-medium text-[15px] truncate transition-colors", isCompletedToday ? "text-foreground" : "text-foreground/90")}>
                            {habit.name}
                        </h3>
                    </div>
                    {habit.description ? (
                        <p className="text-[13px] text-muted-foreground line-clamp-1 mt-0.5">
                            {habit.description}
                        </p>
                    ) : (
                        <p className="text-[12px] text-muted-foreground/70 mt-0.5 flex items-center">
                            <Repeat className="mr-1.5 h-[10px] w-[10px]" />
                            {getFrequencyText()}
                        </p>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-5 flex-shrink-0">
                {/* Mini Tracker */}
                <div className="flex items-center gap-1.5">
                    {last7Days.map((day) => (
                        <TooltipProvider key={day.dateStr} delayDuration={100}>
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <div
                                        className={cn(
                                            "h-[18px] w-[18px] rounded-[2px] transition-colors",
                                            day.isCompleted ? "bg-[var(--graph-4)]" : "bg-muted-foreground/15"
                                        )}
                                    />
                                </TooltipTrigger>
                                <TooltipContent className="bg-popover text-foreground p-2 rounded-md shadow-sm border text-xs">
                                    {format(day.date, 'MMM d, yyyy')}: {day.isCompleted ? 'Completed' : 'Missed'}
                                </TooltipContent>
                            </Tooltip>
                        </TooltipProvider>
                    ))}
                </div>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground/50 hover:text-foreground opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity focus:opacity-100" disabled={!!loadingAction}>
                            <MoreVertical className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem onSelect={() => setIsEditDialogOpen(true)} disabled={!!loadingAction}>
                            <Pencil className="mr-2 h-4 w-4" /> Edit Habit
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialog open={isArchiveDialogOpen} onOpenChange={setIsArchiveDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()} disabled={!!loadingAction}>
                                    <ArchiveIcon className="mr-2 h-4 w-4" /> Archive
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Archive Habit?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        Archiving this habit will remove it from your active list, but its history will be saved.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={loadingAction === 'archive'}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleArchive} disabled={loadingAction === 'archive'}>
                                        {loadingAction === 'archive' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Archive
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                            <AlertDialogTrigger asChild>
                                <DropdownMenuItem
                                    onSelect={(e) => e.preventDefault()}
                                    className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                    disabled={!!loadingAction}
                                >
                                    <Trash2 className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Delete Habit?</AlertDialogTitle>
                                    <AlertDialogDescription>
                                        This action cannot be undone. This will permanently delete the habit and all its associated logs.
                                    </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel disabled={loadingAction === 'delete'}>Cancel</AlertDialogCancel>
                                    <AlertDialogAction onClick={handleDelete} className="bg-destructive hover:bg-destructive/90" disabled={loadingAction === 'delete'}>
                                        {loadingAction === 'delete' ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                        Delete
                                    </AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <FormDialogTitle>Edit Habit</FormDialogTitle>
                    </DialogHeader>
                    <HabitForm
                        initialData={habit}
                        habitIdToEdit={habit.id}
                        onSuccess={() => {
                            setIsEditDialogOpen(false);
                            onHabitUpdated();
                        }}
                    />
                </DialogContent>
            </Dialog>
        </div>
    );
}
