"use client";

import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useAuth } from '@/hooks/use-auth';
import type { HabitLog, ContributionDay } from '@/types/habit';
import {
  format,
  eachDayOfInterval,
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const DAYS_IN_WEEK = 7;
const NUM_WEEKS_TO_DISPLAY = 53;

const CELL_SIZE_PX = 14;
const CELL_GAP_PX = 3;

const DateCell: React.FC<{
  day: ContributionDay;
}> = ({ day }) => {
  const levelColors = [
    'bg-[var(--graph-0)]',
    'bg-[var(--graph-1)]',
    'bg-[var(--graph-2)]',
    'bg-[var(--graph-3)]',
    'bg-[var(--graph-4)]',
  ];

  const safeLevel = day.level !== undefined && day.level >= 0 && day.level < levelColors.length ? day.level : 0;
  const cellSize = 'h-[18px] w-[18px]';

  const isPlaceholder = day.date === '' || day.date.startsWith('ph-');
  const isFuture = day.isFuture || isPlaceholder;

  if (isFuture || isPlaceholder) {
    return <div className={cn("rounded-[4px]", levelColors[0], cellSize)} />;
  }

  const tooltipText = day.count === 0
    ? `No activity on ${format(parseISO(day.date), 'MMM d, yyyy')}`
    : `${day.count} ${day.count === 1 ? 'completion' : 'completions'} on ${format(parseISO(day.date), 'MMM d, yyyy')}`;

  return (
    <TooltipProvider delayDuration={100}>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "rounded-[4px] transition-colors duration-150 flex items-center justify-center",
              levelColors[safeLevel],
              cellSize
            )}
          >
          </div>
        </TooltipTrigger>
        <TooltipContent className="bg-popover text-popover-foreground p-2 rounded-md shadow-sm border border-border">
          <p className="text-xs font-medium">
            {tooltipText}
          </p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

interface HabitContributionGraphProps {
  logs: HabitLog[];
  currentDateAnchor: Date;
  todayGlobal: string;
  selectedYearMode: string;
  onYearModeChange: (val: string) => void;
}

export function HabitContributionGraph({
  logs,
  currentDateAnchor,
  todayGlobal,
  selectedYearMode,
  onYearModeChange
}: HabitContributionGraphProps) {
  const { user } = useAuth();
  const [days, setDays] = useState<ContributionDay[]>([]);
  const [yearViewMonthLabels, setYearViewMonthLabels] = useState<{ name: string; weekIndex: number }[]>([]);
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const monthNames = useMemo(() => Array.from({ length: 12 }, (_, i) => format(new Date(2000, i), 'MMM')), []);

  useEffect(() => {
    if (!user) {
      setDays([]);
      setYearViewMonthLabels([]);
      return;
    }

    const today = startOfDay(currentDateAnchor);
    let gridVisualStartDate: Date;
    let gridVisualEndDate: Date;

    if (selectedYearMode === "lastYear") {
      gridVisualEndDate = endOfWeek(today, { weekStartsOn: 0 });
      gridVisualStartDate = subDays(gridVisualEndDate, (NUM_WEEKS_TO_DISPLAY * DAYS_IN_WEEK) - 1);
    } else {
      const yearInt = parseInt(selectedYearMode, 10);
      const yearStart = new Date(yearInt, 0, 1);
      const yearEnd = new Date(yearInt, 11, 31);
      // ensure start is Sunday, end is Saturday for full grid rendering
      gridVisualStartDate = subDays(yearStart, yearStart.getDay());
      gridVisualEndDate = endOfWeek(yearEnd, { weekStartsOn: 0 });
    }

    const allDatesForCells = eachDayOfInterval({ start: gridVisualStartDate, end: gridVisualEndDate });

    const contributionsMap = new Map<string, number>();
    logs.forEach(log => {
      const logDate = parseISO(log.date);
      if (log.completed && isWithinInterval(logDate, { start: gridVisualStartDate, end: gridVisualEndDate })) {
        contributionsMap.set(log.date, (contributionsMap.get(log.date) || 0) + 1);
      }
    });

    const generatedDaysData: ContributionDay[] = allDatesForCells.map(dateObj => {
      const dateStr = format(dateObj, 'yyyy-MM-dd');
      const count = contributionsMap.get(dateStr) || 0;
      let level: ContributionDay['level'] = 0;

      const isFuture = dateObj > today;

      if (!isFuture) {
        if (count === 0) level = 0;
        else if (count === 1) level = 1;
        else if (count === 2) level = 2;
        else if (count === 3) level = 3;
        else if (count >= 4) level = 4;
      }

      return { date: dateStr, count, level, isFuture, isTargetDay: false };
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

    // Auto scroll to right
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollLeft = scrollContainerRef.current.scrollWidth;
      }
    }, 100);

  }, [user, logs, currentDateAnchor, monthNames, selectedYearMode]);

  const metrics = useMemo(() => {
    let total = 0;
    const dayCounts = new Array(7).fill(0);
    const monthCounts = new Array(12).fill(0);
    let pastDays = 0;

    days.forEach(d => {
      total += d.count;
      const isPlaceholder = d.date === '' || d.date.startsWith('ph-');
      if (!d.isFuture && !isPlaceholder) {
        pastDays++;
        if (d.count > 0) {
          const dateObj = parseISO(d.date);
          dayCounts[dateObj.getDay()] += d.count;
          monthCounts[dateObj.getMonth()] += d.count;
        }
      }
    });

    const avg = pastDays > 0 ? (total / pastDays).toFixed(1) : "0.0";

    let bestDayIdx = 0;
    let maxDayCount = 0;
    for (let i = 0; i < 7; i++) {
      if (dayCounts[i] > maxDayCount) {
        maxDayCount = dayCounts[i];
        bestDayIdx = i;
      }
    }

    let bestMonthIdx = 0;
    let maxMonthCount = 0;
    for (let i = 0; i < 12; i++) {
      if (monthCounts[i] > maxMonthCount) {
        maxMonthCount = monthCounts[i];
        bestMonthIdx = i;
      }
    }

    const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
    const months = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

    return {
      total,
      avg,
      bestDay: maxDayCount > 0 ? weekdays[bestDayIdx] : "-",
      bestMonth: maxMonthCount > 0 ? months[bestMonthIdx] : "-"
    };
  }, [days]);

  if (!user) {
    return null;
  }

  if (days.length === 0) {
    return (
      <div className="flex items-center justify-center h-[140px] w-full border rounded-md p-4 bg-card">
        <Skeleton className="h-full w-full" />
      </div>
    );
  }

  const yearViewWeekdayLabels = ["", "monday", "", "wednesday", "", "friday", ""];
  const graphContentMinWidth = `${(NUM_WEEKS_TO_DISPLAY * (CELL_SIZE_PX + CELL_GAP_PX)) - CELL_GAP_PX + 30 + 6}px`;

  return (
    <div className="border border-border/40 rounded-xl bg-card/50 backdrop-blur-sm p-6 shadow-sm w-full">
      <div className="flex flex-col xl:flex-row gap-8 lg:gap-12 w-full">
        <div className="flex-1 overflow-hidden min-w-0">
          <div className="flex flex-col md:flex-row md:justify-between items-start md:items-center gap-4 mb-6">
            <div className="flex items-center gap-4">
              <Select value={selectedYearMode} onValueChange={onYearModeChange}>
                <SelectTrigger className="h-8 text-xs font-semibold w-[140px] bg-background border-border/40 focus:ring-0">
                  <SelectValue placeholder="Period" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="lastYear">last 12 months</SelectItem>
                  <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
                </SelectContent>
              </Select>
              <span className="text-xs font-medium text-muted-foreground">
                {metrics.total} completions
              </span>
            </div>

            <div className="flex items-center text-[10px] text-muted-foreground justify-end opacity-80">
              <span className="mr-2">less</span>
              <div className="flex gap-[3px] items-center">
                <div className="h-[18px] w-[18px] rounded-[3px] bg-[var(--graph-0)]"></div>
                <div className="h-[18px] w-[18px] rounded-[3px] bg-[var(--graph-1)]"></div>
                <div className="h-[18px] w-[18px] rounded-[3px] bg-[var(--graph-2)]"></div>
                <div className="h-[18px] w-[18px] rounded-[3px] bg-[var(--graph-3)]"></div>
                <div className="h-[18px] w-[18px] rounded-[3px] bg-[var(--graph-4)]"></div>
              </div>
              <span className="ml-2">more</span>
            </div>
          </div>

          <div
            ref={scrollContainerRef}
            className="pb-2 w-full overflow-x-auto snap-x snap-mandatory scroll-smooth [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
          >
            <div className="flex gap-4 w-max" style={{ minWidth: graphContentMinWidth }}>
              <div className="grid grid-cols-1 gap-[3px] text-[10px] leading-[18px] text-muted-foreground opacity-60 shrink-0 pr-1">
                {yearViewWeekdayLabels.map((label, index) => (
                  <div key={`weekday-left-${index}`} className={cn("flex items-center justify-end h-[18px] w-[60px]")}>{label}</div>
                ))}
              </div>
              <div className="relative flex-grow">
                <div className={cn("grid grid-rows-7 grid-flow-col gap-[3px]")}>
                  {days.map((day, index) => (
                    <DateCell
                      key={`year-${day.date}-${index}`}
                      day={day}
                    />
                  ))}
                </div>
                {yearViewMonthLabels.length > 0 && (
                  <div className="relative mt-2 text-[10px] text-muted-foreground opacity-60 h-[14px] w-full">
                    {yearViewMonthLabels.map((month, idx) => (
                      <div
                        key={`${month.name}-${idx}`}
                        className="absolute whitespace-nowrap"
                        style={{ left: `calc(${month.weekIndex} * (${CELL_SIZE_PX}px + ${CELL_GAP_PX}px))` }}
                      >
                        {month.name.toLowerCase()}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="w-full xl:w-[350px] shrink-0 flex flex-col justify-center border-t xl:border-t-0 xl:border-l border-border/40 pt-6 xl:pt-0 xl:pl-12">
          <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-6 opacity-80">Year in Review</h3>
          <div className="grid grid-cols-2 gap-y-8 gap-x-6">
            <div className="flex flex-col">
              <span className="text-2xl font-semibold text-foreground tracking-tight">{metrics.total}</span>
              <span className="text-xs text-muted-foreground mt-0.5 opacity-80">Total Completions</span>
            </div>
            <div className="flex flex-col">
              <span className="text-2xl font-semibold text-foreground tracking-tight">{metrics.avg}</span>
              <span className="text-xs text-muted-foreground mt-0.5 opacity-80">Daily Average</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-medium text-foreground capitalize tracking-tight leading-7">{metrics.bestDay}</span>
              <span className="text-xs text-muted-foreground mt-0.5 opacity-80">Most Active Day</span>
            </div>
            <div className="flex flex-col">
              <span className="text-xl font-medium text-foreground capitalize tracking-tight leading-7">{metrics.bestMonth}</span>
              <span className="text-xs text-muted-foreground mt-0.5 opacity-80">Busiest Month</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
