
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Loader2, Sparkles, BookHeart, FileText, AlertTriangle, CalendarDays } from 'lucide-react';
import { analyzeJournalEntryAction, JournalAnalysisInput, JournalAnalysisOutput } from '@/app/(main)/actions';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import type { JournalEntry } from '@/types/journal';
import { format, parseISO, formatISO } from 'date-fns';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

interface GroupedEntries {
  [date: string]: JournalEntry[];
}

export default function JournalPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [journalEntryText, setJournalEntryText] = useState<string>('');
  const [currentAiSummary, setCurrentAiSummary] = useState<JournalAnalysisOutput | null>(null);
  const [isLoadingSubmission, setIsLoadingSubmission] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const [groupedEntries, setGroupedEntries] = useState<GroupedEntries>({});
  const [isLoadingEntries, setIsLoadingEntries] = useState(true);


  useEffect(() => {
    if (!user) {
      setGroupedEntries({});
      setIsLoadingEntries(false);
      return;
    }
    setIsLoadingEntries(true);
    const entriesQuery = query(
      collection(db, "journalEntries"),
      where("userId", "==", user.uid),
      orderBy("date", "desc"), // Most recent dates first
      orderBy("createdAt", "asc") // Oldest entry of the day first
    );

    const unsubscribe = onSnapshot(entriesQuery, (querySnapshot) => {
      const fetchedEntries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp
      } as JournalEntry));
      
      const newGroupedEntries = fetchedEntries.reduce((acc: GroupedEntries, entry) => {
        const dateKey = entry.date; // Already YYYY-MM-DD
        if (!acc[dateKey]) {
          acc[dateKey] = [];
        }
        acc[dateKey].push(entry);
        return acc;
      }, {});

      setGroupedEntries(newGroupedEntries);
      setIsLoadingEntries(false);
    }, (err) => {
      console.error("Error fetching journal entries:", err);
      toast({ title: "Error", description: "Could not load journal history.", variant: "destructive" });
      setIsLoadingEntries(false);
    });

    return () => unsubscribe();
  }, [user, toast]);

  const handleAnalyzeAndSaveJournal = async () => {
    if (!user) {
      toast({ title: "Error", description: "You must be logged in.", variant: "destructive" });
      return;
    }
    if (!journalEntryText.trim()) {
      toast({ title: "Empty Journal", description: "Please write something before analyzing.", variant: "destructive" });
      return;
    }

    setIsLoadingSubmission(true);
    setCurrentAiSummary(null);
    setSubmissionError(null);

    try {
      const input: JournalAnalysisInput = { journalText: journalEntryText };
      const result = await analyzeJournalEntryAction(user.uid, input);
      setCurrentAiSummary(result); 
      setJournalEntryText(''); 
      toast({ title: "Success", description: "Journal entry analyzed and saved!" });
    } catch (err: any) {
      console.error("Error analyzing/saving journal entry:", err);
      setSubmissionError(err.message || "Failed to process journal entry. Please try again.");
      toast({ title: "Processing Error", description: err.message || "Could not process your journal.", variant: "destructive" });
    } finally {
      setIsLoadingSubmission(false);
    }
  };
  
  const sortedDates = useMemo(() => {
    return Object.keys(groupedEntries).sort((a, b) => parseISO(b).getTime() - parseISO(a).getTime());
  }, [groupedEntries]);

  return (
    <div className="space-y-8"> {/* Removed max-w-3xl mx-auto */}
      <div className="flex items-center gap-3">
        <FileText className="h-8 w-8 text-primary" />
        <h1 className="text-3xl font-headline font-bold">Daily Journal</h1>
      </div>

      <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300">
        <CardHeader>
          <CardTitle className="font-headline text-xl">How was your day?</CardTitle>
          <CardDescription>
            Write about your day. The AI will provide a reflection, and your entry will be saved.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea
            placeholder="What's on your mind today? Reflect on your activities, feelings, or learnings..."
            value={journalEntryText}
            onChange={(e) => setJournalEntryText(e.target.value)}
            rows={8}
            className="resize-none focus-visible:ring-primary/50 mb-4"
            disabled={isLoadingSubmission}
          />
          <Button onClick={handleAnalyzeAndSaveJournal} disabled={isLoadingSubmission || !user || !journalEntryText.trim()} className="w-full sm:w-auto">
            {isLoadingSubmission ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="mr-2 h-4 w-4" />
            )}
            Analyze & Save Entry
          </Button>
        </CardContent>
      </Card>
      
      {currentAiSummary && !isLoadingSubmission && !submissionError && (
        <Card className="bg-muted/30 border-primary/30 animate-in fade-in-50 duration-500">
          <CardHeader>
            <CardTitle className="font-headline text-lg flex items-center gap-2">
              <BookHeart className="h-5 w-5 text-primary" />
              Latest AI Reflection
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 prose prose-sm dark:prose-invert max-w-none">
            <div>
              <h3 className="font-semibold text-foreground mb-1">Summary of Your Entry:</h3>
              <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />}}>
                {currentAiSummary.daySummary}
              </ReactMarkdown>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-1">Your Mood Analysis:</h3>
              <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />}}>
                {currentAiSummary.moodAnalysis}
              </ReactMarkdown>
            </div>
          </CardContent>
        </Card>
      )}

      {submissionError && !isLoadingSubmission && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2"><AlertTriangle /> Error Processing Entry</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-destructive">{submissionError}</p>
          </CardContent>
        </Card>
      )}

      <div className="space-y-6 pt-6">
        <h2 className="text-2xl font-headline font-semibold flex items-center gap-2">
          <CalendarDays className="h-6 w-6 text-primary" />
          Journal History
        </h2>

        {isLoadingEntries && (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`skeleton-date-group-${i}`} className="space-y-2">
              <Skeleton className="h-7 w-1/3 mb-2" />
              {Array.from({ length: 2 }).map((_, j) => (
                  <Card key={`skeleton-entry-${i}-${j}`} className="p-4">
                    <Skeleton className="h-6 w-1/2 mb-2" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6 mt-1" />
                  </Card>
              ))}
            </div>
          ))
        )}

        {!isLoadingEntries && sortedDates.length === 0 && (
           <div className="text-center py-10 text-muted-foreground">
                <BookHeart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No journal entries yet. Write your first entry above to get started!</p>
            </div>
        )}

        {!isLoadingEntries && sortedDates.length > 0 && (
            sortedDates.map(dateKey => (
              <div key={dateKey} className="space-y-3">
                <h3 className="text-xl font-semibold text-muted-foreground">
                  {format(parseISO(dateKey), "MMMM d, yyyy")}
                </h3>
                <Accordion type="single" collapsible className="w-full space-y-2">
                  {groupedEntries[dateKey].map((entry) => (
                    <AccordionItem value={entry.id} key={entry.id} className="bg-card border border-border rounded-lg shadow-sm hover:shadow-md transition-shadow">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex justify-between items-center w-full">
                          <span className="font-headline text-md">
                            Journal Entry #{entry.entrySuffix}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Logged at {entry.createdAt ? format(entry.createdAt.toDate(), 'p') : 'N/A'}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-0">
                        <div className="space-y-4">
                          <div>
                            <h4 className="font-semibold text-foreground mb-1 text-sm">Your thoughts:</h4>
                            <ScrollArea className="max-h-40 w-full rounded-md border bg-background/50 p-3 text-sm">
                              <ReactMarkdown components={{ p: ({node, ...props}) => <p className="whitespace-pre-wrap mb-2 last:mb-0" {...props} />}}>
                                {entry.entryText}
                              </ReactMarkdown>
                            </ScrollArea>
                          </div>
                          <hr className="border-border" />
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <h4 className="font-semibold text-foreground mb-1">AI Day Summary:</h4>
                            <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />}}>
                              {entry.aiDaySummary}
                            </ReactMarkdown>
                            <h4 className="font-semibold text-foreground mt-3 mb-1">AI Mood Analysis:</h4>
                            <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />}}>
                              {entry.aiMoodAnalysis}
                            </ReactMarkdown>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </div>
            ))
        )}
      </div>
    </div>
  );
}

