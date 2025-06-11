
"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { HabitLog, ContributionDay, Habit } from '@/types/habit';
import {
  format,
  eachDayOfInterval,
  getDay,
  parseISO,
  startOfDay,
  isWithinInterval,
  endOfWeek,
  getMonth,
  subDays,
} from 'date-fns';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

const DAYS_IN_WEEK = 7;
const NUM_WEEKS_TO_DISPLAY = 53;

const CELL_SIZE_PX = 12;
const CELL_GAP_PX = 2;

const DateCell: React.FC<{
  day: ContributionDay;
}> = ({ day }) => {
  const levelColors = [
    'bg-background', // Level 0 - no activity or future
    'bg-primary/40', // Level 1 (was bg-primary/30)
    'bg-primary/60', // Level 2 (was bg-primary/70)
    'bg-primary/80', // Level 3 (same)
    'bg-primary',    // Level 4 (same)
  ];

  const safeLevel = day.level !== undefined && day.level >= 0 && day.level < levelColors.length ? day.level : 0;
  const colorClass = day.date === '' || day.date.startsWith('ph-') ? levelColors[0] : levelColors[safeLevel];
  const cellSize = 'h-3 w-3';

  if (day.date === '' || day.date.startsWith('ph-')) {
    return <div className={cn("rounded-sm bg-transparent", cellSize)} />;
  }

  return (
      <TooltipProvider delayDuration={100}>
        <Tooltip>
          <TooltipTrigger asChild>
            <div
                className={cn(
                    "rounded-sm transition-colors duration-150 flex items-center justify-center",
                    colorClass,
                    cellSize
                )}
                aria-label={day.date && !day.date.startsWith('ph-') ? `Activity on ${format(parseISO(day.date), 'MMM d, yyyy')}: ${day.count > 0 ? 'Completed' : 'None'}` : 'Placeholder cell'}
            >
            </div>
          </TooltipTrigger>
          <TooltipContent className="bg-popover text-popover-foreground p-2 rounded-md shadow-lg">
            <p className="text-xs">
              {day.date && !day.date.startsWith('ph-') ?
                  (day.count > 0 ? `Completed on ${format(parseISO(day.date), 'MMM d, yyyy')}` : `No activity on ${format(parseISO(day.date), 'MMM d, yyyy')}`)
                  : "Placeholder"
              }
            </p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
  );
};

interface HabitContributionGraphProps {
  habit: Habit;
  logsForThisHabit: HabitLog[];
  currentDateAnchor: Date;
  todayGlobal: string;
}

export function HabitContributionGraph({
                                         habit,
                                         logsForThisHabit,
                                         currentDateAnchor,
                                         todayGlobal
                                       }: HabitContributionGraphProps) {
  const { user } = useAuth();
  const [days, setDays] = useState<ContributionDay[]>([]);
  const [yearViewMonthLabels, setYearViewMonthLabels] = useState<{ name: string; weekIndex: number }[]>([]);

  const monthNames = useMemo(() => Array.from({ length: 12 }, (_, i) => format(new Date(2000, i), 'MMM')), []);

  useEffect(() => {
    if (!user || !habit) {
      setDays([]);
      setYearViewMonthLabels([]);
      return;
    }

    const today = startOfDay(currentDateAnchor);
    const endOfCurrentWeek = endOfWeek(today, { weekStartsOn: 0 });
    const gridVisualEndDate = endOfCurrentWeek;
    const gridVisualStartDate = subDays(gridVisualEndDate, (NUM_WEEKS_TO_DISPLAY * DAYS_IN_WEEK) - 1);
    const allDatesForCells = eachDayOfInterval({ start: gridVisualStartDate, end: gridVisualEndDate });

    const contributionsMap = new Map<string, number>();
    logsForThisHabit.forEach(log => {
      const logDate = parseISO(log.date);
      if (log.completed && isWithinInterval(logDate, { start: gridVisualStartDate, end: gridVisualEndDate })) {
        contributionsMap.set(log.date, (contributionsMap.get(log.date) || 0) + 1);
      }
    });

    const generatedDaysData: ContributionDay[] = allDatesForCells.map(dateObj => {
      const dateStr = format(dateObj, 'yyyy-MM-dd');
      const count = contributionsMap.get(dateStr) || 0;
      let level: ContributionDay['level'] = 0;

      if (dateObj <= today) {
        if (count === 1) level = 1;
        else if (count === 2) level = 2;
        else if (count === 3) level = 3;
        else if (count >= 4) level = 4;
        // For count = 0 (and date is past/today), level remains 0
      }
      // For future dates, level remains 0

      return { date: dateStr, count, level };
    });
    setDays(generatedDaysData);

    const labels: { name: string; weekIndex: number }[] = [];
    const MIN_LABEL_SPACING_COLUMNS = 3;
    let lastLabeledMonthColumn = -MIN_LABEL_SPACING_COLUMNS;
    const processedYearMonths = new Set<number>();

    for (let i = 0; i < allDatesForCells.length; i++) {
      const cellDate = allDatesForCells[i];
      const currentMonth = getMonth(cellDate);
      const currentYear = cellDate.getFullYear();
      const yearMonthKey = currentYear * 100 + currentMonth;
      const dayInMonth = cellDate.getDate();
      const currentColumnIndex = Math.floor(i / DAYS_IN_WEEK);

      if (!processedYearMonths.has(yearMonthKey) && dayInMonth >= 1 && dayInMonth <= 7) {
        if (currentColumnIndex >= lastLabeledMonthColumn + MIN_LABEL_SPACING_COLUMNS) {
          labels.push({ name: monthNames[currentMonth], weekIndex: currentColumnIndex });
          lastLabeledMonthColumn = currentColumnIndex;
          processedYearMonths.add(yearMonthKey);
        }
      }
    }
    setYearViewMonthLabels(labels);

  }, [user, habit, logsForThisHabit, currentDateAnchor, monthNames]);


  if (!user) {
    return <p className="text-muted-foreground text-sm p-4">Please sign in to see activity.</p>;
  }

  if (days.length === 0) {
    return (
        <div className="flex items-center justify-center h-full">
          <Skeleton className="h-32 w-full" />
        </div>
    );
  }

  const yearViewWeekdayLabels = ["", "M", "", "W", "", "F", ""];
  const graphContentMinWidth = `${(NUM_WEEKS_TO_DISPLAY * (CELL_SIZE_PX + CELL_GAP_PX)) - CELL_GAP_PX + 30 + 6}px`;

  return (
      <div className="pt-2 pb-1">
        <div className="flex gap-1.5" style={{ minWidth: graphContentMinWidth }}>
          <div className="grid grid-cols-1 gap-0.5 text-xs text-muted-foreground shrink-0 pr-1 pt-5">
            {yearViewWeekdayLabels.map((label, index) => (
                <div key={`weekday-left-${index}-${habit.id}`} className={cn("flex items-center justify-center h-3")}>{label}</div>
            ))}
          </div>
          <div className="relative flex-grow">
            {yearViewMonthLabels.length > 0 && (
                <div className="absolute -top-0 left-0 text-xs text-muted-foreground h-5 items-center w-full">
                  {yearViewMonthLabels.map((month) => (
                      <div
                          key={`${month.name}-${month.weekIndex}-${habit.id}`}
                          className="absolute whitespace-nowrap"
                          style={{ left: `calc(${month.weekIndex} * (${CELL_SIZE_PX}px + ${CELL_GAP_PX}px))` }}
                      >
                        {month.name}
                      </div>
                  ))}
                </div>
            )}
            <div className={cn("grid grid-rows-7 grid-flow-col gap-0.5", "pt-5")}>
              {days.map((day, index) => (
                  <DateCell
                      key={day.date.startsWith('ph-') ? `year-${day.date}-${index}-${habit.id}` : `year-${day.date}-${habit.id}`}
                      day={day}
                  />
              ))}
            </div>
          </div>
        </div>
      </div>
  );
}

