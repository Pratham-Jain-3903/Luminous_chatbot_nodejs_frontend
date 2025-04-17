'use client';

import React, { useState, useEffect, useRef } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { summarizeConversation } from '@/ai/flows/summarize-conversation';
import { Loader2, Plus, Trash, Edit, Send } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import Image from 'next/image';
import { nameConversation } from '@/ai/flows/name-conversation';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel } from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { SidebarProvider } from '@/components/ui/sidebar';

interface Message {
  sender: string;
  text: string;
}

// Structure to store conversation metadata
interface ConversationMap {
  [id: string]: {
    name: string;
    messages: Message[];
    summary: string | null;
  }
}

const initialMessages: Message[] = [{
  sender: 'bot',
  text: "Hello! How can I help you today?",
}];

// Function to generate an optimistic conversation name from user input
const generateOptimisticName = (userMessage: string): string => {
  // Truncate long messages and use as conversation name
  const nameLimit = 25;
  let name = userMessage.trim();
  
  if (name.length > nameLimit) {
    name = name.substring(0, nameLimit - 3) + '...';
  }
  
  // Ensure name isn't empty
  return name || "New Conversation";
};

export default function Home() {
  // Main state
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [input, setInput] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]); // List of conversation IDs
  const [conversationNames, setConversationNames] = useState<Record<string, string>>({}); // ID -> Name mapping
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [loadingResponse, setLoadingResponse] = useState(false);
  const [newConversationFirstMessage, setNewConversationFirstMessage] = useState<string | null>(null);
  
  // State for rename dialog
  const [isRenameDialogOpen, setIsRenameDialogOpen] = useState(false);
  const [conversationToRename, setConversationToRename] = useState<string | null>(null);
  const [newConversationNameInput, setNewConversationNameInput] = useState('');

  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Load conversation history on initial mount
  useEffect(() => {
    loadConversationData();
  }, []);

  // Scroll to bottom of messages when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Load a specific conversation when selected
  useEffect(() => {
    if (!selectedConversation) {
      // Reset to initial state when no conversation is selected
      setMessages(initialMessages);
      setSummary(null);
      setInput('');
      return;
    }
    
    // Load selected conversation from local storage
    const storedMessages = localStorage.getItem(`messages_${selectedConversation}`);
    if (storedMessages) {
      const parsedMessages = JSON.parse(storedMessages);
      setMessages(parsedMessages);
      
      // Load summary
      const storedSummary = localStorage.getItem(`summary_${selectedConversation}`);
      if (storedSummary) {
        setSummary(storedSummary);
      } else if (parsedMessages.length > 1) {
        // Generate summary if it doesn't exist but messages do
        updateSummary(selectedConversation, parsedMessages);
      } else {
        setSummary(null);
      }
    } else {
      // If no messages found, initialize with default
      setMessages(initialMessages);
      setSummary(null);
      
      // Also save initial messages to storage
      localStorage.setItem(`messages_${selectedConversation}`, JSON.stringify(initialMessages));
    }
  }, [selectedConversation]);

  // Load all conversation data from localStorage
  const loadConversationData = () => {
    // Load conversation history (list of IDs)
    const storedHistory = localStorage.getItem('conversationHistory');
    let history: string[] = [];
    
    if (storedHistory) {
      history = JSON.parse(storedHistory);
      setConversationHistory(history);
    }
    
    // Load conversation names mapping
    const storedNames = localStorage.getItem('conversationNames');
    let names: Record<string, string> = {};
    
    if (storedNames) {
      names = JSON.parse(storedNames);
      setConversationNames(names);
    }
    
    // If there's at least one conversation, select the first one
    if (history.length > 0) {
      setSelectedConversation(history[0]);
    }
  };

  // Send a message to the bot
  const sendMessage = async () => {
    if (!input.trim()) return;
    
    setLoadingResponse(true);
    const userMessage = { sender: 'user', text: input };
    let currentConvoId = selectedConversation;
    const isNewConversation = !currentConvoId;
    const messageText = input; // Store for naming later
    
    // Create new conversation ID if needed
    if (isNewConversation) {
      currentConvoId = `chat-${Date.now()}`;
      
      // Generate optimistic name immediately using the user's first message
      const optimisticName = generateOptimisticName(messageText);
      
      // Update conversation history and names
      const updatedHistory = [currentConvoId, ...conversationHistory];
      const updatedNames = { ...conversationNames, [currentConvoId]: optimisticName };
      
      // Update state and localStorage
      setConversationHistory(updatedHistory);
      setConversationNames(updatedNames);
      localStorage.setItem('conversationHistory', JSON.stringify(updatedHistory));
      localStorage.setItem('conversationNames', JSON.stringify(updatedNames));
      
      // Set as selected conversation and remember first message for later AI naming
      setSelectedConversation(currentConvoId);
      setNewConversationFirstMessage(messageText);
    }
    
    try {
      // Update messages with user input (optimistically)
      const updatedMessages = [...messages, userMessage];
      setMessages(updatedMessages);
      setInput('');
      
      // Save to localStorage immediately
      localStorage.setItem(`messages_${currentConvoId}`, JSON.stringify(updatedMessages));
      
      // Update summary immediately after user message
      updateSummary(currentConvoId!, updatedMessages);
      
      // API Call for bot response
      const res = await fetch(`/api/completion?stream=false`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          conversationId: currentConvoId,
          messages: updatedMessages,
        }),
      });
      
      if (!res.ok) throw new Error(await res.text());
      const { result: botText } = await res.json();
      
      // Add bot message
      const botMessage = { sender: 'bot', text: botText };
      const finalMessages = [...updatedMessages, botMessage];
      setMessages(finalMessages);
      
      // Save updated messages with bot response
      localStorage.setItem(`messages_${currentConvoId}`, JSON.stringify(finalMessages));
      
      // Update summary again after bot response
      updateSummary(currentConvoId!, finalMessages);
      
      // If this was a new conversation, start AI naming process in the background
      if (isNewConversation && messageText) {
        try {
          // AI naming happens in the background, we already have an optimistic name
          nameConversation({ firstMessage: messageText }).then((result) => {
            if (result?.conversationName) {
              const aiName = result.conversationName;
              
              // Update the name if the AI provided something meaningful
              const updatedNames = { ...conversationNames, [currentConvoId!]: aiName };
              setConversationNames(updatedNames);
              localStorage.setItem('conversationNames', JSON.stringify(updatedNames));
            }
          }).catch((namingError) => {
            console.error('AI naming failed:', namingError);
            // We keep the optimistic name, so no need for error handling
          });
        } catch (namingError) {
          console.error('Naming failed:', namingError);
          // Already have optimistic name, so just log the error
        }
      }
      
    } catch (err: any) {
      console.error('Message failed:', err);
      toast({ 
        title: 'Error', 
        description: err.message || 'Failed to process message' 
      });
    } finally {
      setLoadingResponse(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const updateSummary = async (conversationId: string, msgs: Message[]) => {
    // Ensure there are enough messages to warrant a summary - at least one exchange
    if (msgs.length <= 1) {
      setSummary(null);
      localStorage.removeItem(`summary_${conversationId}`);
      return;
    }

    setLoadingSummary(true);
    try {
      // Summarize up to the last 10 messages
      const messagesToSummarize = msgs.slice(-10);
      const result = await summarizeConversation({ messages: messagesToSummarize });
      const newSummary = result?.summary || 'No summary available.';
      
      // Update state and storage
      setSummary(newSummary);
      localStorage.setItem(`summary_${conversationId}`, newSummary);
    } catch (error) {
      console.error('Error summarizing conversation:', error);
      // If there was an existing summary, keep it instead of showing error
      const existingSummary = localStorage.getItem(`summary_${conversationId}`);
      if (existingSummary) {
        setSummary(existingSummary);
      } else {
        setSummary('Error generating summary. Will try again with next message.');
      }
    } finally {
      setLoadingSummary(false);
    }
  };

  const createNewConversation = () => {
    setSelectedConversation(null);
    setMessages(initialMessages);
    setSummary(null);
    setInput('');
    setNewConversationFirstMessage(null);
  };

  const deleteConversation = (conversationId: string) => {
    if (!conversationId) return;

    // Remove from localStorage
    localStorage.removeItem(`messages_${conversationId}`);
    localStorage.removeItem(`summary_${conversationId}`);
    
    // Update conversationNames
    const updatedNames = { ...conversationNames };
    delete updatedNames[conversationId];
    setConversationNames(updatedNames);
    localStorage.setItem('conversationNames', JSON.stringify(updatedNames));
    
    // Update history
    const updatedHistory = conversationHistory.filter(id => id !== conversationId);
    setConversationHistory(updatedHistory);
    localStorage.setItem('conversationHistory', JSON.stringify(updatedHistory));

    // If the deleted conversation was selected, reset to initial state
    if (selectedConversation === conversationId) {
      if (updatedHistory.length > 0) {
        setSelectedConversation(updatedHistory[0]);
      } else {
        setSelectedConversation(null);
      }
    }

    toast({
      title: 'Conversation Deleted',
      description: `Conversation "${conversationNames[conversationId]}" has been deleted.`,
      variant: "destructive"
    });
  };

  const selectConversation = (conversationId: string) => {
    if (selectedConversation !== conversationId) {
      setSelectedConversation(conversationId);
      setNewConversationFirstMessage(null); // Reset first message tracking when switching conversations
    }
  };

  // Rename Handlers
  const handleRenameClick = (conversationId: string) => {
    setConversationToRename(conversationId);
    setNewConversationNameInput(conversationNames[conversationId] || '');
    setIsRenameDialogOpen(true);
  };

  const confirmRenameConversation = () => {
    if (!conversationToRename || !newConversationNameInput.trim()) {
      setIsRenameDialogOpen(false);
      setConversationToRename(null);
      return;
    }

    const newName = newConversationNameInput.trim();
    const oldName = conversationNames[conversationToRename];
    
    // Update conversation name mapping
    const updatedNames = { ...conversationNames, [conversationToRename]: newName };
    setConversationNames(updatedNames);
    localStorage.setItem('conversationNames', JSON.stringify(updatedNames));
    
    // Close dialog and reset state
    setIsRenameDialogOpen(false);
    setConversationToRename(null);
    setNewConversationNameInput('');

    toast({
      title: 'Conversation Renamed',
      description: `Renamed "${oldName}" to "${newName}".`,
    });
  };

  return (
    <SidebarProvider>
      <div className="flex h-screen bg-background">
        {/* Sidebar */}
        <Sidebar className="w-[280px] border-r bg-muted/25 flex flex-col">
          <SidebarHeader className="p-4 border-b">
            <div className="flex items-center gap-2">
              {/* New Chat Button */}
              <Button
                variant="outline"
                size="sm"
                onClick={createNewConversation}
                className="flex-1 gap-2"
              >
                <Plus className="h-4 w-4" />
                New Chat
              </Button>
              <ThemeToggle/>
            </div>
          </SidebarHeader>

          {/* Conversation History List */}
          <SidebarContent className="p-2 flex-1 overflow-y-auto">
            <SidebarMenu>
              <SidebarGroup>
                {conversationHistory.length === 0 ? (
                  <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                    No conversations yet. Start a new chat!
                  </div>
                ) : (
                  conversationHistory.map((conversationId) => (
                    <SidebarMenuItem key={conversationId} className="mb-1">
                      {/* Button to select the conversation */}
                      <SidebarMenuButton
                        onClick={() => selectConversation(conversationId)}
                        isActive={selectedConversation === conversationId}
                        className="group justify-between rounded-md hover:bg-accent/50 transition-colors w-full pr-2"
                      >
                        {/* Conversation Name (Truncated) */}
                        <span className="truncate flex-1 text-left mr-2">
                          {conversationNames[conversationId] || "Unnamed Chat"}
                        </span>

                        {/* Dropdown Menu for Edit/Delete */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 flex-shrink-0"
                            >
                              <Edit className="h-3 w-3 text-muted-foreground" />
                            </Button>
                          </DropdownMenuTrigger>
                          {/* Dropdown Content */}
                          <DropdownMenuContent side="right" align="start">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation();
                              handleRenameClick(conversationId);
                            }}>
                              Rename
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive focus:bg-destructive/10"
                              onClick={(e) => {
                                e.stopPropagation();
                                deleteConversation(conversationId);
                              }}
                            >
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))
                )}
              </SidebarGroup>
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>

        {/* Main Chat Area */}
        <div className="flex flex-1 flex-col overflow-hidden">
          {/* Summary Card */}
          {summary && selectedConversation && (
            <div className="mx-4 mt-4 rounded-lg bg-primary/10 p-3 text-sm border border-primary/20">
              {loadingSummary ? (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Updating summary...</span>
                </div>
              ) : (
                <>
                  <span className="font-medium">Conversation Summary:</span>
                  <p className="mt-1 whitespace-pre-wrap">{summary}</p>
                </>
              )}
            </div>
          )}

          {/* Messages Container */}
          <Card className="flex-1 overflow-y-auto m-4 bg-transparent border-none shadow-none">
            <CardContent className="p-4 space-y-6">
              {messages.map((message, index) => (
                <div
                  key={`${selectedConversation || 'new'}-${index}`}
                  className={cn(
                    "flex items-start gap-3",
                    message.sender === 'user' ? "justify-end" : "justify-start"
                  )}
                >
                  {/* Bot Avatar */}
                  {message.sender !== 'user' && (
                    <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                      <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                        AI
                      </AvatarFallback>
                    </Avatar>
                  )}
                  {/* Message Bubble */}
                  <div
                    className={cn(
                      "max-w-[70%] rounded-xl p-3 text-sm",
                      message.sender === 'user'
                        ? "bg-primary text-primary-foreground rounded-br-none"
                        : "bg-muted rounded-bl-none"
                    )}
                  >
                    <p className="whitespace-pre-wrap">{message.text}</p>
                  </div>
                  {/* User Avatar */}
                  {message.sender === 'user' && (
                    <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                      <AvatarFallback className="bg-secondary text-secondary-foreground text-xs">
                        Y
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ))}
              {/* Loading indicator for bot response */}
              {loadingResponse && (
                <div className="flex justify-start items-center gap-3">
                  <Avatar className="h-8 w-8 mt-1 flex-shrink-0">
                    <AvatarFallback className="bg-primary text-primary-foreground text-xs">
                      AI
                    </AvatarFallback>
                  </Avatar>
                  <div className="max-w-[70%] rounded-xl p-3 bg-muted">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                </div>
              )}
              {/* Invisible element for scrolling */}
              <div ref={messagesEndRef} />
            </CardContent>
          </Card>

          {/* Input Area */}
          <div className="p-4 pt-0 border-t">
            <div className="relative flex items-end gap-2">
              <Textarea
                placeholder="Type your message..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="min-h-[48px] max-h-32 py-3 pr-16 resize-none rounded-2xl bg-input focus-visible:ring-1 focus-visible:ring-ring"
                rows={1}
              />
              <Button
                onClick={sendMessage}
                disabled={loadingResponse || !input.trim()}
                className="absolute right-2 bottom-2 h-8 w-8 p-0 rounded-full"
                size="sm"
                title="Send message"
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

        {/* Rename Conversation Dialog */}
        <AlertDialog open={isRenameDialogOpen} onOpenChange={setIsRenameDialogOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Rename Conversation</AlertDialogTitle>
              <AlertDialogDescription>
                Enter a new name for "{conversationToRename ? conversationNames[conversationToRename] : ''}".
              </AlertDialogDescription>
            </AlertDialogHeader>
            <Input
              value={newConversationNameInput}
              onChange={(e) => setNewConversationNameInput(e.target.value)}
              placeholder="New conversation name"
              onKeyDown={(e) => e.key === 'Enter' && confirmRenameConversation()}
              autoFocus
            />
            <AlertDialogFooter>
              <AlertDialogCancel onClick={() => {
                setConversationToRename(null);
                setNewConversationNameInput('');
              }}>
                Cancel
              </AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmRenameConversation}
                disabled={!newConversationNameInput.trim()}
              >
                Rename
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SidebarProvider>
  );
}