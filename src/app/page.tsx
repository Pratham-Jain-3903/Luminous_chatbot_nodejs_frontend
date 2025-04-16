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
import {Loader2, Plus, Trash, Edit} from 'lucide-react';
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
      <div className="flex h-screen">
        <Sidebar>
          <SidebarHeader>
            <div className="flex items-center justify-between p-4">
              <SidebarTrigger>
                <Plus className="h-4 w-4"/>
              </SidebarTrigger>
              
              <SidebarInput placeholder="Search..."/>
              <ThemeToggle />
            </div>
          </SidebarHeader>
          
          <SidebarContent>
            <SidebarMenu>
              <SidebarGroup>
                {conversationHistory.map((conversationName) => (
                  <SidebarMenuItem key={conversationName}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <SidebarMenuButton
                          onClick={() => selectConversation(conversationName)}
                          isActive={selectedConversation === conversationName}
                        >
                          {conversationName}
                        </SidebarMenuButton>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={handleRenameConversation}>
                          <Edit className="mr-2 h-4 w-4"/>
                          <span>Rename</span>
                          <DropdownMenuShortcut>⌘⇧R</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        
                        {/* Fix for the Delete functionality */}
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                              <Trash className="mr-2 h-4 w-4"/>
                              <span>Delete</span>
                              <DropdownMenuShortcut>⌘⇧D</DropdownMenuShortcut>
                            </DropdownMenuItem>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                              <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the conversation and remove
                                it from your history.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => deleteConversation()}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))}
              </SidebarGroup>
            </SidebarMenu>
          </SidebarContent>
          
          <SidebarFooter>
            <Button onClick={createNewConversation} className="w-full">
              Create New Conversation
            </Button>
          </SidebarFooter>
        </Sidebar>
        
        <div className="flex flex-1 flex-col overflow-hidden">
          <Card className="flex-1 overflow-y-auto">
            <CardContent className="p-4">
              {loadingSummary && <Loader2 className="h-4 w-4 animate-spin"/>}
              {summary && <div className="mb-4 rounded-md border p-2 text-sm">{summary}</div>}
              <div className="space-y-4">
                {messages.map((message, index) => (
                  <div key={index} className={cn("flex", message.sender === 'user' ? "justify-end" : "justify-start")}>
                    <div className={cn("rounded-lg p-3", message.sender === 'user' ? "bg-primary text-primary-foreground" : "bg-muted")}>
                      {message.text}
                    </div>
                    <Avatar className="ml-2">
                      <AvatarFallback>{message.sender}</AvatarFallback>
                    </Avatar>
                  </div>
                ))}
                {loadingResponse && <Loader2 className="h-4 w-4 animate-spin"/>}
              </div>
            </CardContent>
          </Card>
          
          <div className="p-4">
            <div className="flex items-center space-x-2">
              <Textarea
                placeholder="Type your message here..."
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                className="flex-1 resize-none rounded-md border p-2"
              />
              <Button onClick={sendMessage} disabled={loadingResponse || !input.trim()}>
                {loadingResponse ? 'Loading...' : 'Send'}
              </Button>
            </div>
          </div>
        </div>
  
        {/* Rename Conversation Dialog */}
        <AlertDialog open={renamingConversation} onOpenChange={setRenamingConversation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Rename Conversation
              </AlertDialogTitle>
              <AlertDialogDescription>
                Enter a new name for this conversation.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <label htmlFor="name" className="text-right">
                  Name
                </label>
                <Input 
                  id="name"
                  value={newConversationName} 
                  onChange={(e) => setNewConversationName(e.target.value)}
                  className="col-span-3"
                />
              </div>
            </div>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={confirmRenameConversation}>Rename</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </SidebarProvider>
  )};

