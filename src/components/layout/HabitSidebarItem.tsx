
"use client";

import type { Habit } from '@/types/habit';
import { cn } from '@/lib/utils';
import { Loader2, Check } from 'lucide-react';

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
              "flex items-center justify-between p-2.5 rounded-md transition-colors group-data-[collapsible=icon]:p-0 group-data-[collapsible=icon]:justify-center",
              isCompleted ? "bg-muted" : "hover:bg-muted/50",
              "group-data-[collapsible=icon]:w-10 group-data-[collapsible=icon]:h-10 group-data-[collapsible=icon]:rounded-md"
          )}
      >
        <div className="flex items-center space-x-2.5 group-data-[collapsible=icon]:space-x-0">
          <div className={cn(
              "flex items-center justify-center h-5 w-5 rounded-full border shrink-0 transition-colors duration-200",
              "group-data-[collapsible=icon]:h-7 group-data-[collapsible=icon]:w-7 group-data-[collapsible=icon]:border-0",
              isCompleted ? "bg-[var(--graph-4)] border-[var(--graph-4)]" : "bg-transparent border-border group-data-[collapsible=icon]:bg-muted/50"
          )}>
            <svg viewBox="0 0 14 14" className={cn("w-3 h-3 fill-current text-white transition-transform duration-200", isCompleted ? "scale-100 opacity-100" : "scale-50 opacity-0 group-data-[collapsible=icon]:scale-100 group-data-[collapsible=icon]:opacity-100 group-data-[collapsible=icon]:text-muted-foreground")} xmlns="http://www.w3.org/2000/svg"><path d="M5.5 10.5L2 7l1.4-1.4 2.1 2.1 6.1-6.1L13 3l-7.5 7.5z"/></svg>
          </div>

          <div className="group-data-[collapsible=icon]:hidden flex items-center min-w-0">
            <p className={cn(
                "font-medium text-sm truncate",
                isCompleted ? "text-muted-foreground" : "text-foreground"
            )}>{habit.name}</p>
            {habit.frequency === 'daily' && streak > 0 && (
                <span className="ml-2 text-xs text-muted-foreground shrink-0">
                  {streak}d
                </span>
            )}
          </div>
        </div>
        <button
            onClick={onToggle}
            disabled={isLoading}
            className={cn(
                "px-2 py-1 text-xs font-medium rounded border transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring shrink-0 group-data-[collapsible=icon]:hidden",
                isCompleted
                    ? "bg-transparent border-border text-muted-foreground hover:bg-muted"
                    : "bg-primary border-primary text-primary-foreground hover:bg-primary/90",
                isLoading ? "opacity-50 cursor-not-allowed" : ""
            )}
            aria-label={isCompleted ? `Mark ${habit.name} as incomplete` : `Mark ${habit.name} as complete`}
        >
          {isLoading ? (
              <Loader2 className="h-3 w-3 animate-spin" />
          ) : (
              isCompleted ? "Undo" : "Done"
          )}
        </button>
      </li>
  );
}
