
"use client";

import { useState, useRef, useEffect, FormEvent, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Sparkles, User, Send, Loader2, MessageSquarePlus, Brain, Zap } from 'lucide-react';
import { getAICoachTipsAction, HabitCoachTipsInput } from '@/app/(main)/actions'; // Import HabitCoachTipsInput
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/use-auth';
import ReactMarkdown from 'react-markdown';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

const examplePrompts = [
  { title: "Beat Procrastination", description: "Give me tips to stop procrastinating on my coding projects.", icon: Zap },
  { title: "Build a Reading Habit", description: "How can I make reading a daily habit?", icon: MessageSquarePlus },
  { title: "Improve Focus", description: "Suggest techniques to improve my focus while working.", icon: Brain },
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

  const handleExamplePromptClick = (promptDescription: string) => {
    setInput(promptDescription);
    inputRef.current?.focus();
  };
  
  const handleSubmit = async (e?: FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim()) return;

    const userMessageContent = input;
    
    // Prepare history: all messages currently in state
    // The AI will see these, then the currentInput.
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
      const errorMessageContent = "Sorry, I couldn't process your request right now. Please ensure your previous messages and current input are not too long, or try simplifying your query.";
      const errorMessage: Message = { id: (Date.now() + 1).toString(), role: 'assistant', content: errorMessageContent };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      inputRef.current?.focus();
      setTimeout(scrollToBottom, 0);
    }
  };

  const userName = user?.displayName?.split(' ')[0] || 'Explorer';

  return (
    <div className="flex flex-col h-full p-4 md:p-6 bg-background text-foreground">
      <AnimatePresence>
        {messages.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} 
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.3 }} 
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <h1 className="text-4xl md:text-5xl font-bold mb-6">
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-accent to-primary">Hello, {userName}</span>
            </h1>
            <p className="text-muted-foreground mb-10 text-lg">How can I help you build better habits today?</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl mb-12">
              {examplePrompts.map((prompt, index) => (
                <motion.div
                  key={prompt.title}
                  initial={{ opacity: 0, scale: 0.95 }} 
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index, duration: 0.25 }} 
                >
                  <Card 
                    className="p-4 hover:bg-card/80 cursor-pointer transition-colors duration-200 shadow-sm hover:shadow-md"
                    onClick={() => handleExamplePromptClick(prompt.description)}
                  >
                    <div className="flex items-center gap-3 mb-2">
                      <prompt.icon className="h-5 w-5 text-primary" />
                      <h3 className="font-semibold text-card-foreground">{prompt.title}</h3>
                    </div>
                    <p className="text-xs text-muted-foreground">{prompt.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {messages.length > 0 && (
         <ScrollArea className="flex-1 mb-4 pr-2" ref={scrollAreaRef}>
            <div className="space-y-6 max-w-3xl mx-auto w-full">
              <AnimatePresence initial={false}>
                {messages.map((message) => (
                  <motion.div
                    key={message.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className={`flex items-start gap-3 ${message.role === 'user' ? 'justify-end' : ''}`}
                  >
                    {message.role === 'assistant' && (
                      <Avatar className="h-8 w-8 shrink-0 border-2 border-primary/50">
                         <AvatarFallback className="bg-primary/20"><Sparkles className="h-5 w-5 text-primary" /></AvatarFallback>
                      </Avatar>
                    )}
                    <div
                      className={`max-w-[85%] md:max-w-[75%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground rounded-xl rounded-br-none p-3 text-sm shadow-md'
                          : 'prose prose-sm dark:prose-invert max-w-none bg-card p-3 rounded-xl shadow-md' 
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
                      <Avatar className="h-8 w-8 shrink-0">
                        <AvatarFallback><User className="h-5 w-5" /></AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
              {isLoading && messages.length > 0 && messages[messages.length -1].role === 'user' && (
                <motion.div
                    key="loading"
                    layout
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2 }}
                    className="flex items-start gap-3"
                >
                  <Avatar className="h-8 w-8 shrink-0 border-2 border-primary/50">
                     <AvatarFallback className="bg-primary/20"><Sparkles className="h-5 w-5 text-primary" /></AvatarFallback>
                  </Avatar>
                  <div className="bg-card p-3 rounded-xl shadow-md">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                  </div>
                </motion.div>
              )}
            </div>
          </ScrollArea>
      )}

      <form 
        onSubmit={handleSubmit} 
        className="mt-auto flex w-full items-end gap-2 bg-background pt-2 sticky bottom-0 max-w-3xl mx-auto"
      >
        <Textarea
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask your AI Habit Coach..."
          className="flex-1 resize-none min-h-[48px] rounded-xl shadow-sm focus-visible:ring-2 focus-visible:ring-primary/50 py-3 textarea-animated-focus"
          rows={1}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
          }}
          disabled={isLoading}
        />
        <Button type="submit" size="icon" disabled={isLoading || !input.trim()} className="h-[48px] w-[48px] rounded-xl shadow-sm">
          {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          <span className="sr-only">Send</span>
        </Button>
      </form>
    </div>
  );
}
