
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Loader2, FileText, AlertTriangle, ArrowRight, CalendarDays, BrainCircuit } from 'lucide-react';
import { analyzeJournalEntryAction, JournalAnalysisInput, JournalAnalysisOutput } from '@/app/(main)/actions';
import { useToast } from '@/hooks/use-toast';
import ReactMarkdown from 'react-markdown';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { db } from '@/lib/firebase';
import { collection, query, where, orderBy, onSnapshot, Timestamp } from 'firebase/firestore';
import type { JournalEntry } from '@/types/journal';
import { format, parseISO } from 'date-fns';


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
    <div className="space-y-10 max-w-5xl mx-auto py-4 min-w-0 w-full">
      <div className="flex flex-col gap-2">
        <h1 className="text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <FileText className="h-7 w-7 text-primary" />
            Journal
        </h1>
        <p className="text-muted-foreground text-sm">
          Chronicle your journey. Write your thoughts and let AI provide reflection and mood analysis.
        </p>
      </div>

      <div className="bg-card border border-border/60 rounded-2xl p-2 shadow-sm transition-all focus-within:ring-1 focus-within:ring-primary/30 focus-within:border-primary/50 relative">
        <Textarea
          placeholder="What's on your mind today?"
          value={journalEntryText}
          onChange={(e) => setJournalEntryText(e.target.value)}
          rows={5}
          className="resize-none border-0 shadow-none focus-visible:ring-0 bg-transparent text-[15px] leading-relaxed p-4 w-full"
          disabled={isLoadingSubmission}
        />
        <div className="flex justify-between items-center px-4 pb-3 pt-2 border-t border-border/40 mt-2">
          <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-widest opacity-60">
            {new Date().toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}
          </span>
          <Button 
            onClick={handleAnalyzeAndSaveJournal} 
            disabled={isLoadingSubmission || !user || !journalEntryText.trim()} 
            className="rounded-full shadow-sm font-medium transition-all" 
            size="sm"
          >
            {isLoadingSubmission ? (
              <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" />
            ) : (
              <ArrowRight className="mr-2 h-3.5 w-3.5" />
            )}
            Save & Reflect
          </Button>
        </div>
      </div>
      
      {currentAiSummary && !isLoadingSubmission && !submissionError && (
        <div className="bg-primary/5 border border-primary/20 rounded-2xl p-6 sm:p-8 space-y-5 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <h3 className="font-semibold text-primary text-sm flex items-center gap-2">
            <BrainCircuit className="h-4 w-4" /> AI Reflection
          </h3>
          <div className="prose prose-slate dark:prose-invert max-w-none text-[15px] leading-relaxed">
            <div className="mb-6">
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Summary</h4>
              <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-3 last:mb-0 text-foreground" {...props} />}}>
                {currentAiSummary.daySummary}
              </ReactMarkdown>
            </div>
            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-2">Mood Analysis</h4>
              <ReactMarkdown components={{ p: ({node, ...props}) => <p className="mb-0 text-foreground" {...props} />}}>
                {currentAiSummary.moodAnalysis}
              </ReactMarkdown>
            </div>
          </div>
        </div>
      )}

      {submissionError && !isLoadingSubmission && (
        <div className="border border-destructive/20 bg-destructive/5 rounded-xl p-4 flex items-start gap-3 text-sm text-destructive">
          <AlertTriangle className="h-5 w-5 mt-0.5 shrink-0" />
          <div>
            <p className="font-semibold">Unable to process entry</p>
            <p className="opacity-90 mt-1">{submissionError}</p>
          </div>
        </div>
      )}

      <div className="pt-6 space-y-8">
        <div className="flex items-center gap-3 border-b border-border/40 pb-4">
          <CalendarDays className="h-5 w-5 text-muted-foreground" />
          <h2 className="text-xl font-bold tracking-tight text-foreground">Timeline</h2>
        </div>

        {isLoadingEntries && (
          <div className="space-y-10 animate-pulse">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={`skeleton-date-group-${i}`} className="space-y-4">
                <Skeleton className="h-5 w-32 rounded-md bg-muted" />
                {Array.from({ length: Math.max(1, 3 - i) }).map((_, j) => (
                    <div key={`skeleton-entry-${i}-${j}`} className="pl-6 border-l-2 border-muted/50 space-y-3 py-2">
                      <Skeleton className="h-3 w-20 rounded bg-muted/60" />
                      <Skeleton className="h-4 w-[90%] rounded bg-muted" />
                      <Skeleton className="h-4 w-[85%] rounded bg-muted" />
                    </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {!isLoadingEntries && sortedDates.length === 0 && (
           <div className="h-[200px] flex flex-col items-center justify-center text-muted-foreground text-center">
                <div className="bg-muted/50 rounded-full p-4 mb-4">
                    <FileText className="h-6 w-6 opacity-40" />
                </div>
                <h3 className="text-base font-medium text-foreground mb-1">Your timeline is empty</h3>
                <p className="text-sm max-w-xs">Write your first journal entry above to start recording your thoughts.</p>
            </div>
        )}

        {!isLoadingEntries && sortedDates.length > 0 && (
             <div className="space-y-12 pb-10">
                {sortedDates.map(dateKey => (
                  <div key={dateKey} className="space-y-6">
                    <div className="sticky top-14 z-10 bg-background/95 backdrop-blur py-2">
                      <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                        {format(parseISO(dateKey), "MMMM d, yyyy")}
                      </h3>
                    </div>
                    
                    <div className="space-y-4">
                      {groupedEntries[dateKey].map((entry) => (
                        <div key={entry.id} className="relative pl-6 sm:pl-10 pb-6 group">
                          <div className="absolute left-[5px] top-3 bottom-[-16px] w-[2px] bg-muted/60 group-hover:bg-primary/40 transition-colors"></div>
                          <div className="absolute w-3 h-3 bg-background border-2 border-muted-foreground group-hover:border-primary rounded-full left-0 top-1.5 transition-colors z-10"></div>
                          
                          <div className="flex flex-col gap-4">
                            <div>
                                <span className="text-[11px] font-bold text-muted-foreground mb-2 block tracking-wider">
                                  {entry.createdAt ? format(entry.createdAt.toDate(), 'h:mm a') : 'N/A'}
                                </span>
                                <div className="text-[15px] leading-relaxed text-foreground whitespace-pre-wrap font-medium">
                                  {entry.entryText}
                                </div>
                            </div>
                            
                            {(entry.aiDaySummary || entry.aiMoodAnalysis) && (
                                <div className="bg-muted/30 rounded-xl p-4 sm:p-5 text-sm space-y-4">
                                  {entry.aiDaySummary && (
                                      <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 flex items-center gap-1.5">
                                          <BrainCircuit className="w-3 h-3" /> Summary
                                        </h4>
                                        <div className="text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert">
                                            <ReactMarkdown>{entry.aiDaySummary}</ReactMarkdown>
                                        </div>
                                      </div>
                                  )}
                                  
                                  {entry.aiMoodAnalysis && (
                                      <div>
                                        <h4 className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1.5 mt-3">
                                          Mood
                                        </h4>
                                        <div className="text-muted-foreground leading-relaxed prose prose-sm dark:prose-invert">
                                            <ReactMarkdown>{entry.aiMoodAnalysis}</ReactMarkdown>
                                        </div>
                                      </div>
                                  )}
                                </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
             </div>
        )}
      </div>
    </div>
  );
}
