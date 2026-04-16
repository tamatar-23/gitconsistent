
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, AlertTriangle, ArrowRight, CalendarDays } from 'lucide-react';
import { analyzeJournalEntryAction, JournalAnalysisInput, JournalAnalysisOutput } from '@/app/(main)/actions';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import type { JournalEntry } from '@/types/journal';
import { format, parseISO } from 'date-fns';
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
      orderBy("date", "desc"),
      orderBy("createdAt", "asc")
    );

    const unsubscribe = onSnapshot(entriesQuery, (querySnapshot) => {
      const fetchedEntries = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp
      } as JournalEntry));
      
      const newGroupedEntries = fetchedEntries.reduce((acc: GroupedEntries, entry) => {
        const dateKey = entry.date;
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
      toast({ title: "Success", description: "Journal entry analyzed and saved." });
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
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <FileText className="h-5 w-5 text-foreground" />
        <h1 className="text-2xl font-bold text-foreground">Journal</h1>
      </div>

      <div className="border rounded-md p-5 space-y-4">
        <div>
          <h2 className="font-semibold text-foreground mb-1">How was your day?</h2>
          <p className="text-sm text-muted-foreground">
            Write about your day. The AI will provide a reflection, and your entry will be saved.
          </p>
        </div>
        <Textarea
          placeholder="What's on your mind today?"
          value={journalEntryText}
          onChange={(e) => setJournalEntryText(e.target.value)}
          rows={6}
          className="resize-none focus-visible:ring-1 focus-visible:ring-primary/40"
          disabled={isLoadingSubmission}
        />
        <Button onClick={handleAnalyzeAndSaveJournal} disabled={isLoadingSubmission || !user || !journalEntryText.trim()} variant="outline" size="sm">
          {isLoadingSubmission ? (
            <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
          ) : (
            <ArrowRight className="mr-1.5 h-3.5 w-3.5" />
          )}
          Analyze and save
        </Button>
      </div>
      
      {currentAiSummary && !isLoadingSubmission && !submissionError && (
        <div className="border rounded-md p-5 space-y-4">
          <h3 className="font-semibold text-foreground text-sm">AI Reflection</h3>
          <div className="prose prose-sm dark:prose-invert max-w-none">
            <div>
              <h4 className="font-medium text-foreground mb-1 text-sm">Summary</h4>
              <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />}}>
                {currentAiSummary.daySummary}
              </ReactMarkdown>
            </div>
            <div className="mt-3">
              <h4 className="font-medium text-foreground mb-1 text-sm">Mood Analysis</h4>
              <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />}}>
                {currentAiSummary.moodAnalysis}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {submissionError && !isLoadingSubmission && (
        <div className="border border-destructive/20 bg-destructive/5 rounded-md p-4 flex items-start gap-2 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 mt-0.5 shrink-0" />
          <p>{submissionError}</p>
        </div>
      )}

      <div className="space-y-4 pt-4">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">History</h2>
        </div>

        {isLoadingEntries && (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={`skeleton-date-group-${i}`} className="space-y-2">
              <Skeleton className="h-5 w-1/4 mb-2" />
              {Array.from({ length: 2 }).map((_, j) => (
                  <div key={`skeleton-entry-${i}-${j}`} className="border rounded-md p-3">
                    <Skeleton className="h-4 w-1/3 mb-2" />
                    <Skeleton className="h-3 w-full" />
                    <Skeleton className="h-3 w-4/5 mt-1" />
                  </div>
              ))}
            </div>
          ))
        )}

        {!isLoadingEntries && sortedDates.length === 0 && (
           <div className="text-center py-10 text-muted-foreground text-sm">
                <p>No journal entries yet. Write your first entry above to get started.</p>
            </div>
        )}

        {!isLoadingEntries && sortedDates.length > 0 && (
            sortedDates.map(dateKey => (
              <div key={dateKey} className="space-y-2">
                <h3 className="text-sm font-medium text-muted-foreground">
                  {format(parseISO(dateKey), "MMMM d, yyyy")}
                </h3>
                <Accordion type="single" collapsible className="w-full space-y-1.5">
                  {groupedEntries[dateKey].map((entry) => (
                    <AccordionItem value={entry.id} key={entry.id} className="border rounded-md">
                      <AccordionTrigger className="px-4 py-2.5 hover:no-underline text-sm">
                        <div className="flex justify-between items-center w-full">
                          <span className="font-medium">
                            Entry #{entry.entrySuffix}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {entry.createdAt ? format(entry.createdAt.toDate(), 'p') : 'N/A'}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4 pt-0">
                        <div className="space-y-3">
                          <div>
                            <h4 className="font-medium text-foreground mb-1 text-xs uppercase tracking-wide text-muted-foreground">Your thoughts</h4>
                            <ScrollArea className="max-h-40 w-full rounded border bg-muted/30 p-3 text-sm">
                              <ReactMarkdown components={{ p: ({node, ...props}) => <p className="whitespace-pre-wrap mb-2 last:mb-0" {...props} />}}>
                                {entry.entryText}
                              </ReactMarkdown>
                            </ScrollArea>
                          </div>
                          <hr className="border-border" />
                          <div className="prose prose-sm dark:prose-invert max-w-none">
                            <h4 className="font-medium text-foreground mb-1 text-xs uppercase tracking-wide text-muted-foreground">Day Summary</h4>
                            <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />}}>
                              {entry.aiDaySummary}
                            </ReactMarkdown>
                            <h4 className="font-medium text-foreground mt-3 mb-1 text-xs uppercase tracking-wide text-muted-foreground">Mood Analysis</h4>
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
