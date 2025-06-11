
"use client"

import React from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { useTheme } from 'next-themes';
import { themes, type ThemeColors, type AppThemes } from '@/lib/themes';

export interface ProgressData {
  name: string;
  value: number;
  fill: string;
}

interface OverallTodayProgressProps {
  data: ProgressData[];
  total: number; // Total applicable habits for today
}

export function OverallTodayProgress({ data, total }: OverallTodayProgressProps) {
  const { resolvedTheme } = useTheme();
  const [currentThemeColors, setCurrentThemeColors] = React.useState<ThemeColors>(themes.light);

  React.useEffect(() => {
    if (resolvedTheme) {
      setCurrentThemeColors(themes[resolvedTheme as keyof AppThemes] || themes.light);
    }
  }, [resolvedTheme]);
  
  const completedValue = data.find(d => d.name === 'Completed')?.value || 0;
  const percentage = total > 0 ? Math.round((completedValue / total) * 100) : 0;

  // Dynamically set fill colors based on the current theme for the data prop
  const themedData = data.map(item => {
    if (item.name === 'Completed') {
      return { ...item, fill: currentThemeColors.primary };
    }
    if (item.name === 'Pending' || item.name === 'No Habits' || item.name === 'No Habits Due') {
      // Use a muted color from the theme for pending/empty states
      return { ...item, fill: 'hsl(var(--muted))' }; // Directly using CSS var for muted
    }
    return item;
  });

  return (
    <div className="h-[100px] w-[100px] relative">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Tooltip
             contentStyle={{
              backgroundColor: currentThemeColors.tooltipBg,
              borderColor: currentThemeColors.tooltipBorder,
              borderRadius: '0.375rem',
              fontSize: '0.75rem',
              padding: '0.5rem 0.75rem',
            }}
            itemStyle={{ color: currentThemeColors.tooltipText }}
          />
          <Pie
            data={themedData} // Use themedData here
            cx="50%"
            cy="50%"
            innerRadius="70%"
            outerRadius="100%"
            paddingAngle={themedData.length > 1 && (themedData.some(d => d.value > 0) && themedData.some(d => d.name === 'Pending' && d.value > 0)) ? 5 : 0}
            dataKey="value"
            stroke="none"
          >
            {themedData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
        <span className="text-2xl font-bold" style={{ color: currentThemeColors.primary }}>
          {percentage}%
        </span>
      </div>
    </div>
  );
}
