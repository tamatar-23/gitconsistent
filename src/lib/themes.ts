
// Helper for chart theming, can be expanded
// These are conceptual and would need to map to your actual CSS variables or Tailwind config

export interface ThemeColors {
  primary: string;
  text: string;
  textMuted: string;
  background: string;
  border: string;
  borderFaded: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
  tooltipHoverBg: string;
}

export interface AppThemes {
  light: ThemeColors;
  dark: ThemeColors;
}

export const themes: AppThemes = {
  light: {
    primary: 'hsl(var(--chart-1))', // Using chart-1 for primary bar/ring color in charts
    text: 'hsl(var(--foreground))',
    textMuted: 'hsl(var(--muted-foreground))',
    background: 'hsl(var(--background))',
    border: 'hsl(var(--border))',
    borderFaded: 'hsla(var(--border), 0.5)',
    tooltipBg: 'hsl(var(--popover))',
    tooltipBorder: 'hsl(var(--border))',
    tooltipText: 'hsl(var(--popover-foreground))',
    tooltipHoverBg: 'hsla(var(--accent), 0.1)',
  },
  dark: {
    primary: 'hsl(var(--chart-1))', // Using chart-1 for primary bar/ring color in charts
    text: 'hsl(var(--foreground))',
    textMuted: 'hsl(var(--muted-foreground))',
    background: 'hsl(var(--background))',
    border: 'hsl(var(--border))',
    borderFaded: 'hsla(var(--border), 0.5)',
    tooltipBg: 'hsl(var(--popover))',
    tooltipBorder: 'hsl(var(--border))',
    tooltipText: 'hsl(var(--popover-foreground))',
    tooltipHoverBg: 'hsla(var(--accent), 0.1)',
  },
};
