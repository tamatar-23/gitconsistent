
"use client";

import type { Habit } from '@/types/habit';
import { cn } from '@/lib/utils';
import { Loader2, Check, Flame } from 'lucide-react';

interface HabitSidebarItemProps {
  habit: Habit;
  isCompleted: boolean;
  streak: number;
  onToggle: () => void;
  isLoading: boolean;
}

export function HabitSidebarItem({ habit, isCompleted, streak, onToggle, isLoading }: HabitSidebarItemProps) {
  return (
      <li
          className={cn(
              "flex items-center justify-between p-2.5 rounded-lg transition-colors group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center",
              isCompleted ? "bg-primary/10" : "bg-card hover:bg-muted/70",
              "group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:rounded-md"
          )}
      >
        <div className="flex items-center space-x-2.5 group-data-[collapsible=icon]:space-x-0">
          <div className={cn(
              "flex items-center justify-center h-6 w-6 rounded-md border-2 shrink-0 group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7 group-data-[collapsible=icon]:border-0",
              isCompleted ? "bg-primary border-primary group-data-[collapsible=icon]:bg-primary" : "bg-transparent border-border group-data-[collapsible=icon]:bg-muted/50"
          )}>
            {isCompleted && <Check className="h-4 w-4 text-primary-foreground group-data-[collapsible=icon]:h-5 group-data-[collapsible=icon]:w-5" />}
          </div>

          <div className="group-data-[collapsible=icon]:hidden flex items-center min-w-0"> {/* Added min-w-0 for flex child truncation */}
            <p className={cn(
                "font-medium text-sm truncate", // Added truncate
                isCompleted ? "text-primary" : "text-card-foreground"
            )}>{habit.name}</p>
            {habit.frequency === 'daily' && streak > 0 && (
                <span className="ml-2 text-xs font-normal flex items-center text-orange-500 dark:text-orange-400 shrink-0"> {/* Added shrink-0 to streak */}
                  <Flame className="h-3.5 w-3.5 mr-0.5" />
                  {streak}
            </span>
            )}
          </div>
        </div>
        <button
            onClick={onToggle}
            disabled={isLoading}
            className={cn(
                "px-2.5 py-1 text-xs font-medium rounded-md border transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 shrink-0 group-data-[collapsible=icon]:hidden",
                isCompleted
                    ? "bg-muted border-border text-muted-foreground hover:bg-muted/80"
                    : "bg-primary border-primary text-primary-foreground hover:bg-primary/90",
                isLoading ? "opacity-50 cursor-not-allowed" : ""
            )}
            aria-label={isCompleted ? `Mark ${habit.name} as incomplete` : `Mark ${habit.name} as complete`}
        >
          {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
              isCompleted ? "Undo?" : "Done?"
          )}
        </button>
      </li>
  );
}
