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
  SidebarMenuItem,
  SidebarInput,
  useSidebar,
  SidebarTrigger,
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
import {useCompletion} from 'ai/react';
import {DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuShortcut} from '@/components/ui/dropdown-menu';
import {AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogFooter, AlertDialogTitle, AlertDialogDescription, AlertDialogAction, AlertDialogCancel} from '@/components/ui/alert-dialog';
import {Input} from '@/components/ui/input';
import {ThemeToggle} from '@/components/theme-toggle';
//import {Navbar} from '@/components/ui/navbar';

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
  const {complete, completion, isLoading: loadingResponse, stop} = useCompletion({
    api: '/api/completion',
    //onFinish: handleOnFinish,
  });
  const [renamingConversation, setRenamingConversation] = useState(false);
  const [newConversationName, setNewConversationName] = useState('');

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

    // Optimistically update the conversation name with the user's first message
    const tempConversationName = input.substring(0, 20) + "...";
    if (messages.length === 1) {
      setSelectedConversation(tempConversationName);
      const updatedHistory = [...conversationHistory, tempConversationName];
      setConversationHistory(updatedHistory);
      localStorage.setItem('conversationHistory', JSON.stringify(updatedHistory));
    }

    setMessages((prevMessages) => [...prevMessages, userMessage]);

    setInput('');

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
    
      
        
          
            
              <SidebarTrigger />
            
            <Image
              src="/luminous-logo.png"
              alt="Luminous Logo"
              width={40}
              height={40}
            />
            <SidebarInput placeholder="Search..."/>
            <ThemeToggle />
          
          
            
              
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
                          
                          <span>Rename</span>
                          <DropdownMenuShortcut>⌘⇧R</DropdownMenuShortcut>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator/>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive">
                              
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
                              <AlertDialogAction onClick={deleteConversation}>Continue</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </SidebarMenuItem>
                ))}
              
            
          
          
            
              Create New Conversation
            
          
        
        
          
            {loadingSummary && <Loader2 className="h-4 w-4 animate-spin"/>}
            {summary && <div className="mb-4 rounded-md border p-2 text-sm">{summary}</div>}
            
              {messages.map((message, index) => (
                
                  
                    
                      {message.text}
                    
                    
                      {message.sender}
                    
                  
                
              ))}
              {loadingResponse && <Loader2 className="h-4 w-4 animate-spin"/>}
            
          
          
            
              
                <Textarea
                  placeholder="Type your message here..."
                  value={input}
                  onChange={handleInputChange}
                  onKeyDown={handleKeyDown}
                  className="flex-1 resize-none rounded-md border p-2"
                />
                <Button onClick={sendMessage} disabled={loadingResponse}>
                  {loadingResponse ? 'Loading...' : 'Send'}
                </Button>
              
            
          
        
      
      {/* Rename Conversation Dialog */}
      <AlertDialog open={renamingConversation} onOpenChange={setRenamingConversation}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rename Conversation</AlertDialogTitle>
            <AlertDialogDescription>Enter a new name for this conversation.</AlertDialogDescription>
          </AlertDialogHeader>
          
            
              
                Name
              
              <Input
                id="name"
                value={newConversationName}
                onChange={(e) => setNewConversationName(e.target.value)}
                className="col-span-3"
              />
            
          
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setRenamingConversation(false);
              setNewConversationName('');
            }}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRenameConversation}>Rename</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    
  );
}
