
'use client';

import React, {useState, useEffect} from 'react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInput,
  useSidebar,
} from '@/components/ui/sidebar';
import {Card, CardContent} from '@/components/ui/card';
import {Button} from '@/components/ui/button';
import {Textarea} from '@/components/ui/textarea';
import {useToast} from '@/hooks/use-toast';
import {summarizeConversation} from '@/ai/flows/summarize-conversation';
import {Loader2, Plus, Trash} from 'lucide-react';
import {Avatar, AvatarFallback, AvatarImage} from '@/components/ui/avatar';
import {cn} from '@/lib/utils';
import Image from 'next/image';

interface Message {
  sender: string;
  text: string;
}

export default function Home() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [summary, setSummary] = useState<string | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<string[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

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

  const sendMessage = () => {
    if (!input.trim()) return;

    const newMessage = {sender: 'user', text: input};
    setMessages([...messages, newMessage]);
    setInput('');

    // Simulate bot response (replace with actual API call)
    setTimeout(() => {
      const botResponse = {sender: 'bot', text: `Echo: ${input}`};
      setMessages((prevMessages) => [...prevMessages, botResponse]);
    }, 500);
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

  const createNewConversation = () => {
    const newConversationName = `Conversation ${conversationHistory.length + 1}`;
    setConversationHistory([...conversationHistory, newConversationName]);
    localStorage.setItem(
      'conversationHistory',
      JSON.stringify([...conversationHistory, newConversationName])
    );
    setSelectedConversation(newConversationName);
    setMessages([]);
    setSummary(null);
  };

  const deleteConversation = () => {
    if (!selectedConversation) return;

    const updatedHistory = conversationHistory.filter((name) => name !== selectedConversation);
    setConversationHistory(updatedHistory);
    localStorage.setItem('conversationHistory', JSON.stringify(updatedHistory));
    localStorage.removeItem(selectedConversation);
    setSelectedConversation(null);
    setMessages([]);
    setSummary(null);

    toast({
      title: 'Conversation Deleted',
      description: 'The selected conversation has been deleted.',
    });
  };

  const selectConversation = (conversationName: string) => {
    setSelectedConversation(conversationName);
  };

  return (
    <>
      <Sidebar className="w-60">
        <SidebarHeader>
          <SidebarTrigger>
            <Plus className="h-4 w-4"/>
          </SidebarTrigger>
          <Image
            src="https://picsum.photos/40/40" // Replace with actual Luminous logo URL
            alt="Luminous Logo"
            width={40}
            height={40}
          />
          <SidebarInput placeholder="Search..."/>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarMenu>
              {conversationHistory.map((conversationName) => (
                <SidebarMenuItem key={conversationName}>
                  <SidebarMenuButton
                    onClick={() => selectConversation(conversationName)}
                    isActive={selectedConversation === conversationName}
                  >
                    {conversationName}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <Button variant="outline" onClick={createNewConversation}>
            Create New Conversation
          </Button>
        </SidebarFooter>
      </Sidebar>
      <div className="flex-1 p-4">
        <Card className="h-full flex flex-col">
          <CardContent className="flex-1 overflow-y-auto">
            {loadingSummary && <Loader2 className="h-4 w-4 animate-spin"/>}
            {summary && <div className="mb-4 rounded-md border p-2 text-sm">{summary}</div>}
            <div className="space-y-2">
              {messages.map((message, index) => (
                <div
                  key={index}
                  className={cn(
                    'flex w-full flex-col',
                    message.sender === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      'inline-flex items-center justify-center rounded-full border px-3 py-1 text-sm font-medium',
                      message.sender === 'user' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground'
                    )}
                  >
                    {message.text}
                  </div>
                  <div className="text-xs text-muted-foreground">{message.sender}</div>
                </div>
              ))}
            </div>
          </CardContent>
          <div className="m-4 flex items-center space-x-2">
            <Textarea
              placeholder="Type your message here..."
              value={input}
              onChange={handleInputChange}
              onKeyDown={handleKeyDown}
              className="flex-1 resize-none rounded-md border p-2"
            />
            <Button onClick={sendMessage}>Send</Button>
            <Button variant="destructive" onClick={deleteConversation}><Trash className="h-4 w-4"/></Button>
            {!open && (
              <Button variant="secondary" onClick={() => setOpen(true)}>
                Reopen Sidebar
              </Button>
            )}
          </div>
        </Card>
      </div>
    </>
  );
}
