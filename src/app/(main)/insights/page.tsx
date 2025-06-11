
"use client";

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
// Switch and Label removed as they are now in SettingsDropdown
import { BrainCircuit, ClipboardList, Loader2, AlertTriangle, Sparkles as SparklesIcon } from 'lucide-react';
import { getAIHabitReviewAction } from '@/app/(main)/actions';
// UserSettings type, onSnapshot, db, updateNudgePreferenceAction are no longer needed here for nudges
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { Skeleton } from '@/components/ui/skeleton';

type ReviewPeriod = 'weekly' | 'monthly';

export default function InsightsPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [selectedPeriod, setSelectedPeriod] = useState<ReviewPeriod>('weekly');
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [isLoadingReview, setIsLoadingReview] = useState(false);
  const [reviewError, setReviewError] = useState<string | null>(null);

  // Nudge related states and effects are removed from here

  const handleGenerateReview = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    setIsLoadingReview(true);
    setAiReview(null);
    setReviewError(null);
    try {
      const result = await getAIHabitReviewAction(user.uid, selectedPeriod);
      setAiReview(result.analysis);
    } catch (error: any) {
      console.error("Error generating AI review:", error);
      setReviewError(error.message || "Failed to generate review. Please try again.");
      toast({ title: "Review Error", description: error.message || "Could not generate review.", variant: "destructive" });
    } finally {
      setIsLoadingReview(false);
    }
  };

  // handleNudgeToggle and nudgeOptIn are removed

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-3">
        <BrainCircuit className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-headline font-bold">AI Insights</h1> 
      </div>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <div className="flex items-center gap-2">
            <ClipboardList className="h-6 w-6 text-primary" />
            <CardTitle className="font-headline text-xl">AI Habit Review</CardTitle>
          </div>
          <CardDescription>
            Get personalized insights into your habit patterns and achievements.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as ReviewPeriod)}>
            <TabsList className="grid w-full grid-cols-2 md:w-[300px]">
              <TabsTrigger value="weekly">Weekly Review</TabsTrigger>
              <TabsTrigger value="monthly">Monthly Review</TabsTrigger>
            </TabsList>
          </Tabs>
          <Button onClick={handleGenerateReview} disabled={isLoadingReview || !user}>
            {isLoadingReview ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <SparklesIcon className="mr-2 h-4 w-4" />
            )}
            Generate {selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Review
          </Button>

          {isLoadingReview && (
            <div className="space-y-3 pt-4">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-5/6" />
              <Skeleton className="h-4 w-full" />
            </div>
          )}

          {reviewError && !isLoadingReview && (
            <div className="mt-4 p-4 bg-destructive/10 border border-destructive/30 rounded-md text-destructive flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
              <div>
                <p className="font-semibold">Error Generating Review</p>
                <p className="text-sm">{reviewError}</p>
              </div>
            </div>
          )}

          {aiReview && !isLoadingReview && !reviewError && (
            <Card className="mt-4 bg-muted/50 p-1">
              <CardContent className="pt-6 prose prose-sm dark:prose-invert max-w-none">
                 <ReactMarkdown
                    components={{
                        p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                        li: ({node, ...props}) => <li className="mb-1" {...props} />,
                    }}
                  >
                    {aiReview}
                </ReactMarkdown>
              </CardContent>
            </Card>
          )}
          {!aiReview && !isLoadingReview && !reviewError && (
             <div className="text-center py-8 text-muted-foreground">
                <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Generate a review to see your personalized habit analysis.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proactive Nudges Card is removed from here */}
    </div>
  );
}
