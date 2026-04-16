
"use client";

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sparkles, User, Send, Loader2 } from 'lucide-react';
import { getAICoachTipsAction } from '@/app/(main)/actions';
import type { HabitCoachTipsInput } from '@/ai/flows/habit-coach-tips';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const suggestions = [
  "How do I stop procrastinating on my projects?",
  "Tips for building a daily reading habit",
  "How can I improve my focus while working?",
];

export function ChatInterface() {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    if (scrollAreaRef.current) {
      const scrollViewport = scrollAreaRef.current.querySelector('div[data-radix-scroll-area-viewport]');
      if (scrollViewport) {
        scrollViewport.scrollTop = scrollViewport.scrollHeight;
      }
    }
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSuggestionClick = (text: string) => {
    setInput(text);
    inputRef.current?.focus();
  };
  
  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessageContent = input;
    
    const conversationHistory = messages.map(msg => ({
        role: msg.role,
        content: msg.content,
    }));

    const newUserMessage: Message = { id: Date.now().toString(), role: 'user', content: userMessageContent };
    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setIsLoading(true);

    setTimeout(scrollToBottom, 0);

    try {
      const aiInput: HabitCoachTipsInput = {
        currentInput: userMessageContent,
        history: conversationHistory.length > 0 ? conversationHistory : undefined,
      };
      const response = await getAICoachTipsAction(aiInput);
      const assistantMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: response.tips };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error getting AI tips:", error);
      toast({
        title: "Error",
        description: "Could not get tips from AI coach. Please try again.",
        variant: "destructive",
      });
      const errorMessageContent = "Sorry, I couldn't process your request right now. Please try again or simplify your query.";
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: errorMessageContent };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
      setTimeout(scrollToBottom, 0);
    }
  };

  return (
    <div className="flex flex-col h-full bg-transparent w-full relative">
      <AnimatePresence>
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5, type: 'spring', bounce: 0.3 }} 
            className="flex-1 flex flex-col items-center justify-center text-center max-w-2xl mx-auto px-4"
          >
            <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-6 ring-1 ring-primary/20 shadow-[0_0_40px_-10px] shadow-primary/20">
                <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-3xl font-semibold text-foreground tracking-tight mb-3">
              Ask your coach a question
            </h1>
            <p className="text-muted-foreground text-sm mb-10 max-w-md leading-relaxed">Get personalized, data-driven advice on habit building, maintaining brutal consistency, and structuring your life.</p>
            <div className="grid grid-cols-1 gap-3 w-full max-w-lg">
              {suggestions.map((text, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(text)}
                  className="w-full text-left text-sm text-muted-foreground hover:text-foreground px-5 py-4 rounded-xl border border-border/40 bg-card/30 hover:bg-card/80 backdrop-blur-sm transition-all duration-300 hover:shadow-md hover:border-border/80 group"
                >
                  <span className="flex items-center justify-between">
                      {text}
                      <Send className="h-3.5 w-3.5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300" />
                  </span>
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {messages.length > 0 && (
         <ScrollArea className="flex-1 w-full" ref={scrollAreaRef}>
            <div className="space-y-8 max-w-3xl mx-auto w-full px-4 pt-8 pb-32">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 20, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, type: 'spring', bounce: 0.3 }}
                    className={`flex items-start gap-4 ${message.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8 shrink-0 mt-0.5 ring-1 ring-border/50 shadow-sm">
                         <AvatarFallback className="bg-primary/10 text-primary text-xs"><Sparkles className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[85%] ${
                        message.role === 'user'
                          ? 'bg-neutral-800/90 text-white rounded-2xl rounded-tr-sm px-5 py-3.5 text-[15px] leading-relaxed shadow-sm border border-white/10 backdrop-blur-md'
                          : 'prose prose-sm dark:prose-invert prose-p:leading-relaxed prose-headings:font-semibold max-w-none px-2 pt-1' 
                      }`}
                    >
                      {message.role === 'assistant' ? (
                        <ReactMarkdown
                          components={{
                             p: ({node, ...props}) => <p className="mb-2 last:mb-0" {...props} />,
                             ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-2" {...props} />,
                             ol: ({node, ...props}) => <ol className="list-decimal pl-5 mb-2" {...props} />,
                             li: ({node, ...props}) => <li className="mb-1" {...props} />,
                          }}
                        >
                          {message.content}
                        </ReactMarkdown>
                      ) : (
                        message.content.split('\n').map((line, index) => (
                          <span key={index}>
                            {line}
                            {index < message.content.split('\n').length - 1 && <br />}
                          </span>
                        ))
                      )}
                    </div>
                    {message.role === 'user' && (
                      <Avatar className="h-8 w-8 shrink-0 mt-0.5 ring-1 ring-border/50">
                        <AvatarFallback className="bg-background text-muted-foreground text-xs"><User className="h-4 w-4" /></AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && messages.length > 0 && messages[messages.length -1].role === 'user' && (
                <motion.div
                    key="loading"
                    layout
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.15 }}
                    className="flex items-start gap-3"
                >
                  <Avatar className="h-8 w-8 shrink-0 mt-0.5 ring-1 ring-border/50">
                     <AvatarFallback className="bg-primary/10 text-primary text-xs"><Sparkles className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-card/40 border border-border/40 rounded-2xl rounded-tl-sm px-5 py-3.5 flex flex-col justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
      )}

      <div className="absolute bottom-6 left-0 right-0 px-4 w-full flex justify-center pointer-events-none">
        <form 
          onSubmit={handleSubmit} 
          className="w-full max-w-2xl bg-card/70 backdrop-blur-xl border border-border/50 rounded-2xl p-2 pl-4 shadow-[0_8px_30px_rgb(0,0,0,0.12)] flex items-end gap-3 pointer-events-auto transition-all duration-300 focus-within:ring-1 focus-within:ring-primary/30"
        >
          <Textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask your coach..."
            className="flex-1 resize-none min-h-[44px] max-h-[120px] bg-transparent border-0 py-3 text-[15px] focus-visible:ring-0 shadow-none scrollbar-hide"
            rows={1}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSubmit();
              }
            }}
            disabled={isLoading}
          />
          <Button 
            type="submit" 
            size="icon" 
            disabled={isLoading || !input.trim()} 
            className="h-[44px] w-[44px] shrink-0 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm transition-transform active:scale-95"
          >
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-4 w-4 ml-0.5" />}
            <span className="sr-only">Send</span>
          </Button>
        </form>
      </div>
    </div>
  );
}
