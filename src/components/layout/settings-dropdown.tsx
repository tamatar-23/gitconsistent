
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { useTheme } from 'next-themes';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
} from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { Settings, Moon, Sun, Laptop, BellRing, Palette, Loader2 } from 'lucide-react';
import { updateNudgePreferenceAction } from '@/app/(main)/actions';
import type { UserSettings } from '@/types/user';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export function SettingsDropdown() {
  const { user } = useAuth();
  const { setTheme } = useTheme();
  const { toast } = useToast();

  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isUpdatingNudges, setIsUpdatingNudges] = useState(false);

  useEffect(() => {
    if (!user) {
      setIsLoadingSettings(false);
      setUserSettings(null); // Clear settings if user logs out
      return;
    }
    setIsLoadingSettings(true);
    const settingsDocRef = doc(db, 'userSettings', user.uid);
    const unsubscribe = onSnapshot(settingsDocRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserSettings(docSnap.data() as UserSettings);
      } else {
        // Initialize with default if no settings exist, but don't save yet
        setUserSettings({ userId: user.uid, proactiveNudgesEnabled: false });
      }
      setIsLoadingSettings(false);
    }, (error) => {
      console.error("Error fetching user settings for dropdown:", error);
      // Don't toast here as it might be too intrusive for a dropdown
      setIsLoadingSettings(false);
    });
    return () => unsubscribe();
  }, [user]);

  const handleNudgeToggle = async (enabled: boolean) => {
    if (!user || !userSettings) {
      toast({ title: "Error", description: "User or settings not found.", variant: "destructive" });
      return;
    }
    setIsUpdatingNudges(true);
    try {
      await updateNudgePreferenceAction(user.uid, enabled);
      // Firestore onSnapshot will update userSettings state, so no need for optimistic update here if listener is robust.
      // However, for immediate UI feedback if needed:
      // setUserSettings(prev => ({ ...prev!, proactiveNudgesEnabled: enabled }));
      toast({ title: "Success", description: `Proactive Nudges ${enabled ? 'enabled' : 'disabled'}.` });
    } catch (error: any) {
      console.error("Error updating nudge preference from dropdown:", error);
      toast({ title: "Update Error", description: error.message || "Could not update nudge preference.", variant: "destructive" });
    } finally {
      setIsUpdatingNudges(false);
    }
  };

  const currentNudgesEnabled = userSettings?.proactiveNudgesEnabled ?? false;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon">
          <Settings className="h-[1.2rem] w-[1.2rem]" />
          <span className="sr-only">Open Settings</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        <DropdownMenuLabel>Appearance</DropdownMenuLabel>
        <DropdownMenuSub>
          <DropdownMenuSubTrigger>
            <Palette className="mr-2 h-4 w-4" />
            <span>Theme</span>
          </DropdownMenuSubTrigger>
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem onClick={() => setTheme("light")}>
                <Sun className="mr-2 h-4 w-4" />
                <span>Light</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("dark")}>
                <Moon className="mr-2 h-4 w-4" />
                <span>Dark</span>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setTheme("system")}>
                <Laptop className="mr-2 h-4 w-4" />
                <span>System</span>
              </DropdownMenuItem>
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>

        {user && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Preferences</DropdownMenuLabel>
            <div className="px-2 py-1.5 text-sm">
              <div className="flex items-center justify-between">
                <Label htmlFor="nudges-opt-in-dropdown" className="flex items-center font-normal cursor-pointer">
                  <BellRing className="mr-2 h-4 w-4" />
                  Proactive Nudges
                </Label>
                {isLoadingSettings ? (
                    <Skeleton className="h-5 w-9 rounded-full" />
                ) : (
                <Switch
                  id="nudges-opt-in-dropdown"
                  checked={currentNudgesEnabled}
                  onCheckedChange={handleNudgeToggle}
                  disabled={isUpdatingNudges || isLoadingSettings}
                  className={cn(
                    "h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50",
                    "data-[state=checked]:bg-primary data-[state=unchecked]:bg-input"
                  )}
                  thumbClassName={cn(
                    "pointer-events-none block h-4 w-4 rounded-full bg-background shadow-lg ring-0 transition-transform",
                    "data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
                  )}
                  aria-label="Toggle proactive nudges"
                />
                )}
              </div>
              {isUpdatingNudges && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground ml-auto mt-1" />}
               <p className="text-xs text-muted-foreground mt-1 leading-tight">
                Smart reminders if you might miss a habit.
              </p>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
