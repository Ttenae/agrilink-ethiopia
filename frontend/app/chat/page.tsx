'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../context/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import { api } from '../../lib/api/client';
import { io, Socket } from 'socket.io-client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  Send,
  MessageCircle,
  User,
  Phone,
  Search,
  Leaf,
  Users,
  Clock,
  Check,
  CheckCheck,
  Truck,
  Plus,
  X,
  ArrowLeft,
  UserPlus,
  ShoppingBag,
  MoreVertical,
  Trash2,
  Settings,
  Bell,
  BellOff,
  Archive,
  RefreshCw
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface Message {
  id: string;
  senderId: string;
  content: string;
  isRead: boolean;
  createdAt: string;
  conversationId?: string;
  sender?: { id: string; name: string };
}

interface Conversation {
  id: string;
  buyerId: string;
  farmerId: string;
  transporterId?: string;
  buyer: { id: string; name: string; phone: string };
  farmer: { id: string; name: string; phone: string };
  transporter?: { id: string; name: string; phone: string };
  messages: Message[];
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
}

export default function ChatPage() {
  const { user, token } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewChat, setShowNewChat] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<string>('');
  const [creatingChat, setCreatingChat] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());

  // Connect to WebSocket
  useEffect(() => {
    if (!token || !user) return;

    const socket = io('http://localhost:3005/chat', {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => {
      console.log('✅ Connected to chat server');
    });

    socket.on('new-message', (message: Message) => {
      console.log('📩 New message received:', message);
      
      // Skip own messages (already shown optimistically)
      if (message.senderId === user?.id) {
        console.log('⏭️ Skipping own message (already shown)');
        return;
      }
      
      // Check if message already exists
      if (processedMessageIds.current.has(message.id)) {
        console.log('⚠️ Duplicate message detected, ignoring:', message.id);
        return;
      }
      
      processedMessageIds.current.add(message.id);
      
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === message.id)) {
          return prev;
        }
        if (selectedConversation && message.conversationId === selectedConversation.id) {
          return [...prev, message];
        }
        return prev;
      });

      if (selectedConversation && message.conversationId === selectedConversation.id) {
        if (socketRef.current) {
          socketRef.current.emit('mark-read', {
            conversationId: selectedConversation.id,
            userId: user.id,
          });
        }
      }
      
      fetchConversations();
    });

    socket.on('unread-count', (count: number) => {
      console.log('Unread count:', count);
    });

    socket.on('disconnect', () => {
      console.log('❌ Disconnected from chat server');
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user, selectedConversation]);

  // Fetch conversations
  const fetchConversations = async () => {
    try {
      const response = await api.get('/chat/conversations');
      setConversations(response.data);
      if (response.data.length > 0 && !selectedConversation) {
        setSelectedConversation(response.data[0]);
      }
    } catch (error) {
      console.error('Failed to fetch conversations:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fetch messages for a conversation
  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`);
      processedMessageIds.current.clear();
      setMessages(response.data);
      if (socketRef.current) {
        socketRef.current.emit('join-conversation', { conversationId });
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  // Send a message
  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedConversation || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);

    // Declare tempId outside try block
    const tempId = `temp-${Date.now()}`;

    try {
      const tempMessage: Message = {
        id: tempId,
        senderId: user?.id || '',
        content: content,
        isRead: false,
        createdAt: new Date().toISOString(),
        conversationId: selectedConversation.id,
        sender: { id: user?.id || '', name: user?.name || '' },
      };
      
      setMessages((prev) => [...prev, tempMessage]);

      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send-message', {
          conversationId: selectedConversation.id,
          content: content,
          senderId: user?.id,
        });
        console.log('📤 Message sent via WebSocket');
      } else {
        const response = await api.post(`/chat/conversations/${selectedConversation.id}/messages`, {
          content: content,
        });
        setMessages((prev) =>
          prev.map((msg) => (msg.id === tempId ? response.data : msg))
        );
      }
    } catch (error) {
      console.error('Failed to send message:', error);
      toast.error('Failed to send message');
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  // Delete conversation
  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    
    try {
      await api.delete(`/chat/conversations/${conversationId}`);
      toast.success('Conversation deleted');
      setConversations(conversations.filter(c => c.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  };

  // Clear message history
  const clearHistory = async () => {
    if (!selectedConversation) return;
    if (!confirm('Are you sure you want to clear all messages in this conversation?')) return;
    
    try {
      await api.delete(`/chat/conversations/${selectedConversation.id}/messages`);
      toast.success('Message history cleared');
      setMessages([]);
    } catch (error) {
      toast.error('Failed to clear history');
    }
  };

  // Fetch available users to chat with
  const fetchAvailableUsers = async () => {
    try {
      const response = await api.get('/users');
      const users = response.data.data || [];
      
      let filtered: User[] = [];
      if (user?.role === 'FARMER') {
        filtered = users.filter((u: User) => u.role === 'BUYER' || u.role === 'TRANSPORTER');
      } else if (user?.role === 'BUYER') {
        filtered = users.filter((u: User) => u.role === 'FARMER' || u.role === 'TRANSPORTER');
      } else if (user?.role === 'TRANSPORTER') {
        filtered = users.filter((u: User) => u.role === 'FARMER' || u.role === 'BUYER');
      }
      
      filtered = filtered.filter((u: User) => u.id !== user?.id);
      setAvailableUsers(filtered);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load available users');
    }
  };

  // Create a new conversation
  const createConversation = async () => {
    if (!selectedUser) {
      toast.error('Please select a user');
      return;
    }

    setCreatingChat(true);
    try {
      const selectedUserData = availableUsers.find(u => u.id === selectedUser);
      if (!selectedUserData) {
        toast.error('User not found');
        return;
      }

      let buyerId = null;
      let farmerId = null;
      let transporterId = null;

      if (user?.role === 'BUYER') {
        buyerId = user.id;
        if (selectedUserData.role === 'FARMER') farmerId = selectedUserData.id;
        else if (selectedUserData.role === 'TRANSPORTER') transporterId = selectedUserData.id;
      } else if (user?.role === 'FARMER') {
        farmerId = user.id;
        if (selectedUserData.role === 'BUYER') buyerId = selectedUserData.id;
        else if (selectedUserData.role === 'TRANSPORTER') transporterId = selectedUserData.id;
      } else if (user?.role === 'TRANSPORTER') {
        transporterId = user.id;
        if (selectedUserData.role === 'BUYER') buyerId = selectedUserData.id;
        else if (selectedUserData.role === 'FARMER') farmerId = selectedUserData.id;
      }

      if (!buyerId || !farmerId) {
        toast.error('Need both a buyer and farmer to start a conversation');
        return;
      }

      const response = await api.post('/chat/conversations', {
        buyerId,
        farmerId,
        transporterId: transporterId || undefined,
      });

      toast.success('Conversation created!');
      setShowNewChat(false);
      setSelectedUser('');
      await fetchConversations();
      
      const newConv = response.data;
      setSelectedConversation(newConv);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create conversation');
    } finally {
      setCreatingChat(false);
    }
  };

  // Refresh conversations
  const refreshConversations = () => {
    fetchConversations();
    toast.success('Conversations refreshed');
  };

  // Initial load
  useEffect(() => {
    fetchConversations();
  }, []);

  // Load messages when conversation changes
  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
    }
  }, [selectedConversation]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getOtherUser = (conversation: Conversation) => {
    if (!user) return null;
    if (user.role === 'FARMER') return conversation.buyer;
    if (user.role === 'BUYER') return conversation.farmer;
    if (user.role === 'TRANSPORTER') {
      return conversation.farmer || conversation.buyer;
    }
    return null;
  };

  const getParticipantInfo = (conversation: Conversation) => {
    const participants = [];
    if (conversation.buyer) participants.push({ ...conversation.buyer, role: 'Buyer' });
    if (conversation.farmer) participants.push({ ...conversation.farmer, role: 'Farmer' });
    if (conversation.transporter) participants.push({ ...conversation.transporter, role: 'Transporter' });
    return participants;
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'FARMER': return <Leaf className="h-3 w-3" />;
      case 'BUYER': return <ShoppingBag className="h-3 w-3" />;
      case 'TRANSPORTER': return <Truck className="h-3 w-3" />;
      default: return <User className="h-3 w-3" />;
    }
  };

  const filteredConversations = conversations.filter((conv) => {
    const otherUser = getOtherUser(conv);
    return otherUser?.name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading conversations...</p>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-primary" />
              <h1 className="text-2xl font-bold">Messages</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshConversations}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Button
                onClick={() => {
                  setShowNewChat(true);
                  fetchAvailableUsers();
                }}
                className="bg-primary hover:bg-primary/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Chat
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Conversation List */}
            <Card className="md:col-span-1 border-0 shadow-sm h-[600px] flex flex-col">
              <div className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Conversations</span>
                  <Badge variant="outline">{conversations.length}</Badge>
                </div>
                <div className="relative mt-2">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 h-9 text-sm"
                  />
                </div>
              </div>
              <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm">No conversations</p>
                    <Button
                      variant="link"
                      className="text-sm"
                      onClick={() => {
                        setShowNewChat(true);
                        fetchAvailableUsers();
                      }}
                    >
                      Start a new chat
                    </Button>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const otherUser = getOtherUser(conv);
                    if (!otherUser) return null;
                    const isSelected = selectedConversation?.id === conv.id;
                    const lastMessage = conv.messages[conv.messages.length - 1];
                    const unreadCount = conv.unreadCount || 0;

                    return (
                      <div
                        key={conv.id}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${
                          isSelected ? 'bg-primary/10' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => setSelectedConversation(conv)}
                      >
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 bg-primary/10">
                            <AvatarFallback className="text-primary">
                              {otherUser.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-medium text-sm truncate">{otherUser.name}</p>
                              {lastMessage && (
                                <span className="text-xs text-muted-foreground">
                                  {new Date(lastMessage.createdAt).toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                  })}
                                </span>
                              )}
                            </div>
                            {lastMessage && (
                              <p className="text-xs text-muted-foreground truncate">
                                {lastMessage.content}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                              {getParticipantInfo(conv).map((p, i) => (
                                <span key={i} className="flex items-center gap-0.5">
                                  {getRoleIcon(p.role)}
                                  {p.name}
                                  {i < getParticipantInfo(conv).length - 1 && ' • '}
                                </span>
                              ))}
                            </p>
                          </div>
                          {unreadCount > 0 && (
                            <Badge className="bg-primary text-white border-0 h-5 min-w-5 flex items-center justify-center rounded-full">
                              {unreadCount}
                            </Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="md:col-span-2 border-0 shadow-sm h-[600px] flex flex-col">
              {selectedConversation ? (
                <>
                  {/* Chat Header with Three-Dot Menu */}
                  <div className="p-4 border-b">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-10 w-10 bg-primary/10">
                          <AvatarFallback className="text-primary">
                            {getOtherUser(selectedConversation)?.name?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">
                            {getOtherUser(selectedConversation)?.name}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {getParticipantInfo(selectedConversation).map((p, i) => (
                              <span key={i} className="flex items-center gap-0.5">
                                {getRoleIcon(p.role)}
                                {p.name} ({p.role})
                                {i < getParticipantInfo(selectedConversation).length - 1 && ' • '}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant="outline">
                          {user?.role}
                        </Badge>
                        {/* Three-Dot Menu */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Chat Settings</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => {
                                setNotificationsEnabled(!notificationsEnabled);
                                toast.success(notificationsEnabled ? 'Notifications disabled' : 'Notifications enabled');
                              }}
                            >
                              {notificationsEnabled ? (
                                <>
                                  <BellOff className="h-4 w-4 mr-2" />
                                  Disable Notifications
                                </>
                              ) : (
                                <>
                                  <Bell className="h-4 w-4 mr-2" />
                                  Enable Notifications
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => deleteConversation(selectedConversation.id)}>
                              <Archive className="h-4 w-4 mr-2" />
                              Archive Conversation
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={clearHistory}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Clear History
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                if (confirm('Are you sure you want to delete this conversation permanently?')) {
                                  deleteConversation(selectedConversation.id);
                                }
                              }}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete Conversation
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </div>

                  {/* Messages */}
                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-3">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        <MessageCircle className="h-8 w-8 mx-auto mb-2 opacity-50" />
                        <p className="text-sm">No messages yet</p>
                        <p className="text-xs">Start the conversation!</p>
                      </div>
                    ) : (
                      messages.map((msg) => (
                        <div
                          key={msg.id}
                          className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg px-4 py-2 ${
                              msg.senderId === user?.id
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-muted text-foreground'
                            }`}
                          >
                            <p className="text-sm break-words">{msg.content}</p>
                            <div className="flex items-center justify-end gap-1 mt-1 text-xs opacity-70">
                              {new Date(msg.createdAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                              {msg.senderId === user?.id && (
                                msg.isRead ? (
                                  <CheckCheck className="h-3 w-3" />
                                ) : (
                                  <Check className="h-3 w-3" />
                                )
                              )}
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                    <div ref={messagesEndRef} />
                  </CardContent>

                  {/* Message Input */}
                  <div className="p-4 border-t">
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                      }}
                      className="flex gap-2"
                    >
                      <Input
                        placeholder="Type your message..."
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        className="flex-1"
                      />
                      <Button type="submit" disabled={sending || !newMessage.trim()}>
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center text-muted-foreground">
                  <div>
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Select a conversation to start messaging</p>
                    <Button
                      variant="link"
                      onClick={() => {
                        setShowNewChat(true);
                        fetchAvailableUsers();
                      }}
                    >
                      Or start a new chat
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Start a New Chat</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Select a user to start chatting with:
              </p>
              <Select value={selectedUser} onValueChange={setSelectedUser}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a user..." />
                </SelectTrigger>
                <SelectContent>
                  {availableUsers.length === 0 ? (
                    <SelectItem value="none" disabled>
                      No users available
                    </SelectItem>
                  ) : (
                    availableUsers.map((u) => (
                      <SelectItem key={u.id} value={u.id}>
                        <span className="flex items-center gap-2">
                          {getRoleIcon(u.role)}
                          {u.name} ({u.role})
                        </span>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
            </div>
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setShowNewChat(false)}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-primary hover:bg-primary/90"
                onClick={createConversation}
                disabled={creatingChat || !selectedUser}
              >
                {creatingChat ? 'Creating...' : 'Start Chat'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}