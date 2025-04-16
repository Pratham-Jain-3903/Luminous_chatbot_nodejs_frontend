'use client';

import React, {useState, useEffect, useRef} from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarInput,
  useSidebar,
  SidebarTrigger,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {useToast} from '@/hooks/use-toast';
import {summarizeConversation} from '@/ai/flows/summarize-conversation';
import {Loader2, Plus, Trash, Edit, Send} from 'lucide-react';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {cn} from '@/lib/utils';
import Image from 'next/image';
import {nameConversation} from '@/ai/flows/name-conversation';
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut} from '@/components/ui/dropdown-menu';
import {AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel} from '@/components/ui/alert-dialog';
import {Input} from '@/components/ui/input';
import {ThemeToggle} from '@/components/theme-toggle';
import { useCompletion } from 'ai/react';
import { SidebarProvider } from '@/components/ui/sidebar';


interface Message {
  sender: string;
  text: string;
}

const initialMessages: Message[] = [{
  sender: 'bot',
  text: "Hello! How can I help you today?",
}];

export default function Home() {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const { complete, completion, isLoading: loadingResponse, stop } =
    useCompletion({
      api: '/api/completion',
    });
  const [renamingConversation, setRenamingConversation] = useState(false);
  const [newConversationName, setNewConversationName] = useState('');
  const [isAlertDialogOpen, setIsAlertDialogOpen] = useState(false);

  const {toast} = useToast();
  const {open, setOpen} = useSidebar();

  useEffect(() => {
    // Load conversation history from local storage
    const storedHistory = localStorage.getItem('conversationHistory');
    if (storedHistory) {
      setConversationHistory(JSON.parse(storedHistory));
    }
  }, []);

  useEffect(() => {
    // Load selected conversation from local storage
    if (selectedConversation) {
      const storedMessages = localStorage.getItem(selectedConversation);
      if (storedMessages) {
        setMessages(JSON.parse(storedMessages));
        updateSummary(JSON.parse(storedMessages));
      }
    }
  }, [selectedConversation]);

  useEffect(() => {
    // Save messages to local storage when they change
    if (selectedConversation) {
      localStorage.setItem(selectedConversation, JSON.stringify(messages));
      updateSummary(messages);
    }
  }, [messages, selectedConversation]);

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = {sender: 'user', text: input};

    // Add the user message to the messages state immediately
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInput(''); // Clear the input field

    if (messages.length === 1) {
      try {
        // Optimistically set a temporary conversation name
        const tempConversationName = input.substring(0, 20) + "...";
        setSelectedConversation(tempConversationName);
        const updatedHistory = [...conversationHistory, tempConversationName];
        setConversationHistory(updatedHistory);
        localStorage.setItem('conversationHistory', JSON.stringify(updatedHistory));

        // Await the AI's suggestion for a better conversation name
        const result = await nameConversation({ firstMessage: input });
        const newConversationName = result?.conversationName || "New Conversation";

        // Update conversation history with the new name
        const finalUpdatedHistory = conversationHistory.map(name =>
            name === tempConversationName ? newConversationName : name
        );
        setConversationHistory(finalUpdatedHistory);
        localStorage.setItem('conversationHistory', JSON.stringify(finalUpdatedHistory));
        setSelectedConversation(newConversationName);
      } catch (error) {
        console.error('Error naming conversation:', error);
        toast({
          title: 'Error',
          description: 'Failed to generate conversation name.',
        });
        // Handle naming failure gracefully, perhaps setting a default name
        const finalUpdatedHistory = conversationHistory.map(name =>
            name === tempConversationName ? "Error: Naming Failed" : name
        );
        setConversationHistory(finalUpdatedHistory);
        localStorage.setItem('conversationHistory', JSON.stringify(finalUpdatedHistory));
        setSelectedConversation("Error: Naming Failed");
      }
    }

    // Call Gemini completion
    complete(input);
  };


  useEffect(() => {
    if (completion) {
      const botResponse = {sender: 'bot', text: completion};
      setMessages((prevMessages) => [...prevMessages, botResponse]);
    }
  }, [completion]);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const updateSummary = async (msgs: Message[]) => {
    if (msgs.length === 0) {
      setSummary(null);
      return;
    }
    setLoadingSummary(true);
    try {
      const result = await summarizeConversation({messages: msgs.slice(-10)});
      setSummary(result?.summary || 'Failed to generate summary.');
    } catch (error) {
      console.error('Error summarizing conversation:', error);
      setSummary('Error generating summary.');
      toast({
        title: 'Error',
        description: 'Failed to generate summary.',
      });
    } finally {
      setLoadingSummary(false);
    }
  };

  const createNewConversation = async () => {
    const tempConversationName = `Conversation ${conversationHistory.length + 1}`;
    setConversationHistory([...conversationHistory, tempConversationName]);
    localStorage.setItem(
      'conversationHistory',
      JSON.stringify([...conversationHistory, tempConversationName])
    );
    setSelectedConversation(tempConversationName);
    setMessages([]);
    setSummary(null);
  };

  const deleteConversation = () => {
    if (!selectedConversation) return;
    setIsAlertDialogOpen(false);

    localStorage.removeItem(selectedConversation);
    setSelectedConversation(null);
    setMessages([]);
    setSummary(null);

    // Remove the conversation from the conversation history
    const updatedHistory = conversationHistory.filter((name) => name !== selectedConversation);
    setConversationHistory(updatedHistory);
    localStorage.setItem('conversationHistory', JSON.stringify(updatedHistory));

    toast({
      title: 'Conversation Deleted',
      description: 'The selected conversation has been deleted.',
    });
  };

  const selectConversation = (conversationName: string) => {
    setSelectedConversation(conversationName);
  };

  const updateConversationName = async (firstMessage: string) => {
    if (!selectedConversation) return;

    try {
      const result = await nameConversation({firstMessage: firstMessage});
      const newConversationName = result?.conversationName || 'New Conversation';

      const updatedHistory = conversationHistory.map((name) =>
        name === selectedConversation ? newConversationName : name
      );

      setConversationHistory(updatedHistory);
      localStorage.setItem('conversationHistory', JSON.stringify(updatedHistory));
      setSelectedConversation(newConversationName);

    } catch (error) {
      console.error('Error naming conversation:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate conversation name.',
      });
      // Optionally, set a default name if naming fails
      const updatedHistory = conversationHistory.map((name) =>
        name === selectedConversation ? "Error: Naming Failed" : name
      );
      setConversationHistory(updatedHistory);
      localStorage.setItem('conversationHistory', JSON.stringify(updatedHistory));
    }
  };

  const handleRenameConversation = () => {
    setRenamingConversation(true);
    setNewConversationName(selectedConversation || ''); // Initialize with the current name
  };

  const confirmRenameConversation = () => {
    if (!selectedConversation) return;

    const updatedHistory = conversationHistory.map((name) =>
      name === selectedConversation ? newConversationName : name
    );

    setConversationHistory(updatedHistory);
    localStorage.setItem('conversationHistory', JSON.stringify(updatedHistory));
    localStorage.setItem(newConversationName, localStorage.getItem(selectedConversation) || '');
    localStorage.removeItem(selectedConversation);
    setSelectedConversation(newConversationName);
    setRenamingConversation(false);
    setNewConversationName('');

    toast({
      title: 'Conversation Renamed',
      description: 'The conversation has been renamed.',
    });
  };
  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        {/* Sidebar Improvements */}
        <Sidebar className="w-[280px] border-r bg-muted/25">
          <SidebarHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={createNewConversation}
                className="rounded-full h-8 w-8 p-0"
              >
                <Plus className="h-4 w-4" />
              </Button>
              <SidebarInput 
                placeholder="Search..."
                className="flex-1 bg-background"
              />
              <ThemeToggle variant="ghost" className="h-8 w-8" />
            </div>
          </SidebarHeader>

          <SidebarContent className="p-2">
            <SidebarMenu>
              <SidebarGroup>
                {conversationHistory.map((conversationName) => (
                  <SidebarMenuItem key={conversationName} className="mb-1">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => selectConversation(conversationName)}
                          isActive={selectedConversation === conversationName}
                          className="group justify-between rounded-md hover:bg-accent/50 transition-colors"
                        >
                          <span className="truncate">{conversationName}</span>
                          <Trash className="h-4 w-4 opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive" />
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      {/* Keep existing dropdown content */}
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))}
              </SidebarGroup>
            </SidebarMenu>
          </SidebarContent>

          <SidebarFooter className="p-4 border-t">
            <Button 
              onClick={createNewConversation}
              className="w-full rounded-full"
              variant="secondary"
            >
              New Chat
            </Button>
          </SidebarFooter>
        </Sidebar>

        {/* Main Chat Area Improvements */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Summary Card */}
          {summary && (
            <div className="mx-4 mt-4 rounded-lg bg-primary/10 p-3 text-sm border">
              {loadingSummary ? (
                <div className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating summary...</span>
                </div>
              ) : (
                <>
                  <span className="font-medium">Conversation Summary:</span>
                  <p className="mt-1">{summary}</p>
                </>
              )}
            </div>
          )}

          {/* Messages Container */}
          <Card className="flex-1 overflow-y-auto m-4 bg-transparent border-none shadow-none">
            <CardContent className="p-4 space-y-6">
              {messages.map((message, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex items-start gap-3",
                    message.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {message.sender !== 'user' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div
                    className={cn(
                      "max-w-[70%] rounded-xl p-4",
                      message.sender === 'user'
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted rounded-bl-none"
                    )}
                  >
                    <p className="prose prose-sm">{message.text}</p>
                  </div>
                  {message.sender === 'user' && (
                    <Avatar className="h-8 w-8 mt-1">
                      <AvatarFallback className="bg-secondary text-secondary-foreground">
                        Y
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {loadingResponse && (
                <div className="flex justify-start">
                  <div className="max-w-[70%] rounded-xl p-4 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin" />
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Input Area Improvements */}
          <div className="p-4 pt-0 border-t">
            <div className="relative flex items-end gap-2">
              <Textarea
                placeholder="Type your message..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="min-h-[48px] max-h-32 py-3 pr-16 resize-none rounded-2xl"
                rows={1}
              />
              <Button 
                onClick={sendMessage} 
                disabled={loadingResponse || !input.trim()}
                className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full"
                size="sm"
              >
                {loadingResponse ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </div>
          </div>
        </div>

        {/* Rename Conversation Dialog (keep existing) */}
      </div>
    </SidebarProvider>
  );
}
