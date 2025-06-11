
"use client";

import type { Habit } from "@/types/habit";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle
} from "@/components/ui/card";
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

interface HabitListItemProps {
    habit: Habit;
    children: React.ReactNode;
    isCompletedToday: boolean;
    todayGlobal: string;
    currentDateAnchor: Date;
    onHabitUpdated: () => void;
}

const daysOfWeekMap = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export function HabitListItem({
                                  habit,
                                  children,
                                  isCompletedToday,
                                  todayGlobal,
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
            return habit.targetDays.sort((a,b)=>a-b).map(dayIndex => daysOfWeekMap[dayIndex]).join(', ');
        }
        return 'Weekly';
    };

    return (
        // Set a fixed width for the card to accommodate the full graph. 800px ~ 50rem
        <Card className="w-[800px] h-[250px] flex flex-col transition-shadow duration-200 ease-in-out hover:shadow-xl">
            <CardHeader className="pb-3 pt-4 px-4">
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                        <CardTitle className="font-headline text-base sm:text-lg line-clamp-1">
                            {habit.name}
                        </CardTitle>
                        {habit.description && (
                            <CardDescription className="text-xs text-muted-foreground pt-0.5 line-clamp-2 h-[2.1em]">
                                {habit.description}
                            </CardDescription>
                        )}
                        <div className="text-xs text-muted-foreground flex items-center pt-1">
                            <Repeat className="mr-1.5 h-3.5 w-3.5" />
                            <span>{getFrequencyText()}</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                        <Button
                            variant={isCompletedToday ? "default" : "outline"}
                            onClick={handleToggleCompletion}
                            disabled={isToggleButtonDisabled}
                            size="sm"
                            className="shrink-0 h-8 px-2.5"
                        >
                            {loadingAction === 'toggle' ? (
                                <Loader2 className="mr-1.5 h-4 w-4 animate-spin" />
                            ) : isCompletedToday ? (
                                <CheckSquare className="mr-1.5 h-4 w-4" />
                            ) : (
                                <Square className="mr-1.5 h-4 w-4" />
                            )}
                            {isCompletedToday ? "Done" : "Mark"}
                        </Button>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8" disabled={!!loadingAction}>
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
                                            <AlertDialogAction onClick={handleArchive} className="bg-amber-600 hover:bg-amber-700" disabled={loadingAction === 'archive'}>
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
                </div>
            </CardHeader>
            {/* Ensure CardContent allows graph to take its necessary width. overflow-visible might be implicit if card is wide enough. */}
            <CardContent className="px-2 pb-2 pt-1 flex-grow overflow-visible">
                <div className="h-[150px] w-full">
                    {children}
                </div>
            </CardContent>

            <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
                <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                        <FormDialogTitle className="font-headline">Edit Habit</FormDialogTitle>
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
        </Card>
    );
}
