
"use client";

import React, { useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BrainCircuit, Loader2, AlertTriangle, RefreshCw } from 'lucide-react';
import { getAIHabitReviewAction } from '@/app/(main)/actions';
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

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <BrainCircuit className="h-5 w-5 text-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Insights</h1>
      </div>

      <div className="border rounded-md p-5 space-y-5">
        <div>
          <h2 className="font-semibold text-foreground mb-1">Habit Review</h2>
          <p className="text-sm text-muted-foreground">
            Get personalized insights into your habit patterns and achievements.
          </p>
        </div>

        <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as ReviewPeriod)}>
          <TabsList className="grid w-full grid-cols-2 md:w-[280px]">
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
          </TabsList>
        </Tabs>

        <Button onClick={handleGenerateReview} disabled={isLoadingReview || !user} variant="outline" size="sm">
          {isLoadingReview ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <RefreshCw className="mr-1.5 h-3.5 w-3.5" />
          )}
          Generate {selectedPeriod} review
        </Button>

        {isLoadingReview && (
          <div className="space-y-3 pt-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-4 w-full" />
          </div>
        )}

        {reviewError && !isLoadingReview && (
          <div className="mt-2 p-3 bg-destructive/10 border border-destructive/20 rounded-md text-destructive flex items-start gap-2 text-sm">
            <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">Error generating review</p>
              <p className="text-xs mt-0.5">{reviewError}</p>
            </div>
          </div>
        )}

        {aiReview && !isLoadingReview && !reviewError && (
          <div className="mt-2 border-t pt-4 prose prose-sm dark:prose-invert max-w-none">
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
          </div>
        )}

        {!aiReview && !isLoadingReview && !reviewError && (
           <div className="text-center py-8 text-muted-foreground text-sm">
              <p>Generate a review to see your habit analysis.</p>
          </div>
        )}
      </div>
    </div>
  );
}
