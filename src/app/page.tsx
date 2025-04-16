
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
  SidebarTrigger, // Import SidebarTrigger
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
import {nameConversation} from '@/ai/flows/name-conversation';
import { useCompletion } from 'ai/react';

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
  const { complete, completion, isLoading: loadingResponse, stop } = useCompletion({
    api: '/api/completion',
    //onFinish: handleOnFinish,
  });

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
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    // Update conversation name immediately after sending the message
    if (messages.length === 1) {
      await updateConversationName(input);
    }

    const tempConversationName = input.substring(0, 20) + "...";
    setSelectedConversation(tempConversationName);

    setInput('');

    // Call Gemini completion
    complete(input);
  };

  useEffect(() => {
    if (completion) {
      const botResponse = { sender: 'bot', text: completion };
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

    // Immediately update the conversation name based on the first message
    // For now using a placeholder message "New Conversation"

    await updateConversationName("New Conversation");
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

  return (
    <>
      <Sidebar className="w-60">
        <SidebarHeader>
          <SidebarTrigger>
            <Plus className="h-4 w-4"/>
          </SidebarTrigger>
          <Image
            src="/luminous-logo.png"
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
              {loadingResponse && <Loader2 className="h-4 w-4 animate-spin"/>}
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
            <Button onClick={sendMessage} disabled={loadingResponse}>
              {loadingResponse ? 'Loading...' : 'Send'}
            </Button>
            <Button variant="destructive" onClick={deleteConversation}><Trash className="h-4 w-4"/></Button>
          </div>
        </Card>
      </div>
    </>
  );
}

