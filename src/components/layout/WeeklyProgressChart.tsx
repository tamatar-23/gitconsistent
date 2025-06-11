
"use client"

import React from 'react';
import { format } from 'date-fns'; // Ensured format is imported

export interface WeeklyDataPoint {
    name: string; // Day name e.g., "M", "T"
    completed: number;
    totalApplicable: number;
}

interface WeeklyProgressChartProps {
    data: WeeklyDataPoint[];
}

export function WeeklyProgressChart({ data }: WeeklyProgressChartProps) {
    const trackVisualHeightPx = 56; // Corresponds to h-14 for consistency

    return (
        <div className="bg-muted p-3 rounded-lg text-foreground shadow-sm">
            <h4 className="text-sm font-medium mb-2.5">Weekly Progress</h4>
            <div className="flex justify-around items-end">
                {data.map((dayData, index) => {
                    const percentage = dayData.totalApplicable > 0 ? Math.max(0, Math.min(100, (dayData.completed / dayData.totalApplicable) * 100)) : 0;
                    let fillHeightPx = (percentage / 100) * trackVisualHeightPx;
                    if (percentage > 0 && fillHeightPx < 4) { // Ensure a minimum visible height for small percentages
                        fillHeightPx = 4;
                    }
                    if (percentage === 0) {
                        fillHeightPx = 0;
                    }

                    // Use 'EEEEE' for narrow day name (single letter)
                    const singleLetterDayName = format(new Date(2000,0, index + 1), 'EEEEE');


                    return (
                        <div key={index} className="flex flex-col items-center space-y-1.5 flex-1 min-w-0 px-0.5">
                            <span className="text-xs text-muted-foreground truncate">{dayData.name}</span>
                            <div className="w-5 h-14 bg-secondary rounded-full relative overflow-hidden">
                                <div
                                    className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-primary to-accent rounded-full transition-all duration-300 ease-in-out"
                                    style={{ height: `${fillHeightPx}px` }}
                                ></div>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

