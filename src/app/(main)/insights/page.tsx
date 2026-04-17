
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
    <div className="space-y-8 max-w-5xl mx-auto py-4 min-w-0 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <BrainCircuit className="h-7 w-7 text-primary" />
            Insights
        </h1>
        <p className="text-muted-foreground text-sm">
          Get personalized, AI-driven analysis of your habit patterns and achievements.
        </p>
      </div>

      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <Tabs value={selectedPeriod} onValueChange={(value) => setSelectedPeriod(value as ReviewPeriod)} className="w-full sm:w-auto">
              <TabsList className="grid w-full sm:w-[240px] grid-cols-2 bg-muted/50 p-1 rounded-full">
                <TabsTrigger value="weekly" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm hover:text-foreground">Weekly</TabsTrigger>
                <TabsTrigger value="monthly" className="rounded-full data-[state=active]:bg-background data-[state=active]:shadow-sm hover:text-foreground">Monthly</TabsTrigger>
              </TabsList>
            </Tabs>

            <Button onClick={handleGenerateReview} disabled={isLoadingReview || !user} className="w-full sm:w-auto rounded-full font-medium shadow-sm transition-all" size="sm">
              {isLoadingReview ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <RefreshCw className="mr-2 h-4 w-4" />
              )}
              Generate Review
            </Button>
        </div>

        <div className="min-h-[300px] bg-card rounded-2xl border border-border/80 shadow-sm p-6 sm:p-8 md:p-10 transition-all mx-auto">
            {isLoadingReview && (
              <div className="space-y-5 animate-pulse">
                <Skeleton className="h-6 w-1/3 rounded-lg bg-muted" />
                <div className="space-y-3">
                    <Skeleton className="h-4 w-full rounded-md bg-muted/60" />
                    <Skeleton className="h-4 w-[95%] rounded-md bg-muted/60" />
                    <Skeleton className="h-4 w-[90%] rounded-md bg-muted/60" />
                </div>
                <Skeleton className="h-6 w-1/4 rounded-lg bg-muted mt-8" />
                <div className="space-y-3">
                    <Skeleton className="h-4 w-[92%] rounded-md bg-muted/60" />
                    <Skeleton className="h-4 w-[88%] rounded-md bg-muted/60" />
                </div>
              </div>
            )}

            {reviewError && !isLoadingReview && (
              <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-xl text-destructive flex items-start gap-3 text-sm">
                <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
                <div>
                  <p className="font-semibold text-base">We couldn't generate your review</p>
                  <p className="mt-1 opacity-90">{reviewError}</p>
                </div>
              </div>
            )}

            {aiReview && !isLoadingReview && !reviewError && (
              <div className="prose prose-slate dark:prose-invert max-w-none hover:prose-a:text-primary leading-relaxed text-[15px]">
                 <ReactMarkdown
                    components={{
                        h2: ({node, ...props}) => <h2 className="text-xl font-bold mt-8 mb-4 tracking-tight" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-lg font-semibold mt-6 mb-3 tracking-tight" {...props} />,
                        p: ({node, ...props}) => <p className="mb-4 text-muted-foreground leading-7" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-6 space-y-2 text-muted-foreground" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-6 space-y-2 text-muted-foreground" {...props} />,
                        li: ({node, ...props}) => <li className="pl-1" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-semibold text-foreground" {...props} />,
                    }}
                  >
                    {aiReview}
                </ReactMarkdown>
              </div>
            )}

            {!aiReview && !isLoadingReview && !reviewError && (
               <div className="h-[250px] flex flex-col items-center justify-center text-muted-foreground text-center animate-in fade-in duration-700">
                  <div className="h-16 w-16 mb-6 rounded-full bg-muted/50 flex items-center justify-center">
                    <BrainCircuit className="h-8 w-8 opacity-40" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No Insights Yet</h3>
                  <p className="max-w-sm text-sm">Tap generate to let AI analyze your habits and provide a personalized review based on your recent activity.</p>
              </div>
            )}
        </div>
      </div>
    </div>
  );
}
