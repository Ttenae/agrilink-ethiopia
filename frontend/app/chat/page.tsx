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
  Send, MessageCircle, User, Search, Leaf, Check, CheckCheck,
  Truck, Plus, ShoppingBag, MoreVertical, Trash2,
  Bell, BellOff, Archive, RefreshCw, Loader2
} from 'lucide-react';
import { toast } from 'sonner';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from '@/components/ui/dialog';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger
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

interface UserType {
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
  
  // New Chat State
  const [showNewChat, setShowNewChat] = useState(false);
  const [availableUsers, setAvailableUsers] = useState<UserType[]>([]);
  const [selectedUser, setSelectedUser] = useState<UserType | null>(null); // ✅ Store full user object
  const [creatingChat, setCreatingChat] = useState(false);
  const [userSearchTerm, setUserSearchTerm] = useState('');
  const [loadingUsers, setLoadingUsers] = useState(false);
  
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const socketRef = useRef<Socket | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const processedMessageIds = useRef<Set<string>>(new Set());
  
  const selectedConversationRef = useRef<string | null>(null);
  useEffect(() => {
    selectedConversationRef.current = selectedConversation?.id || null;
  }, [selectedConversation]);

  // Connect to WebSocket
  useEffect(() => {
    if (!token || !user) return;

    const socket = io('http://localhost:3005/chat', {
      auth: { token },
      transports: ['websocket'],
    });

    socketRef.current = socket;

    socket.on('connect', () => console.log('✅ Connected to chat server'));

    socket.on('new-message', (message: Message) => {
      if (message.senderId === user?.id) return;
      if (processedMessageIds.current.has(message.id)) return;
      
      processedMessageIds.current.add(message.id);
      
      setMessages((prev) => {
        if (prev.some((msg) => msg.id === message.id)) return prev;
        if (selectedConversationRef.current && message.conversationId === selectedConversationRef.current) {
          return [...prev, message];
        }
        return prev;
      });

      if (selectedConversationRef.current && message.conversationId === selectedConversationRef.current) {
        socketRef.current?.emit('mark-read', {
          conversationId: selectedConversationRef.current,
          userId: user.id,
        });
      }
      
      fetchConversations();
    });

    return () => {
      socket.disconnect();
    };
  }, [token, user]);

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

  const fetchMessages = async (conversationId: string) => {
    try {
      const response = await api.get(`/chat/conversations/${conversationId}/messages`);
      processedMessageIds.current.clear();
      setMessages(response.data);
      socketRef.current?.emit('join-conversation', { conversationId });
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    }
  };

  const sendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim() || !selectedConversation || sending) return;

    const content = newMessage.trim();
    setNewMessage('');
    setSending(true);
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

      if (socketRef.current?.connected) {
        socketRef.current.emit('send-message', {
          conversationId: selectedConversation.id,
          content: content,
          senderId: user?.id,
        });
      } else {
        const response = await api.post(`/chat/conversations/${selectedConversation.id}/messages`, { content });
        setMessages((prev) => prev.map((msg) => (msg.id === tempId ? response.data : msg)));
      }
    } catch (error) {
      toast.error('Failed to send message');
      setMessages((prev) => prev.filter((msg) => msg.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const deleteConversation = async (conversationId: string) => {
    if (!confirm('Are you sure you want to delete this conversation?')) return;
    try {
      await api.delete(`/chat/conversations/${conversationId}`);
      toast.success('Conversation deleted');
      setConversations(prev => prev.filter(c => c.id !== conversationId));
      if (selectedConversation?.id === conversationId) {
        setSelectedConversation(null);
        setMessages([]);
      }
    } catch (error) {
      toast.error('Failed to delete conversation');
    }
  };

  const clearHistory = async () => {
    if (!selectedConversation) return;
    if (!confirm('Clear all messages in this conversation?')) return;
    try {
      await api.delete(`/chat/conversations/${selectedConversation.id}/messages`);
      toast.success('History cleared');
      setMessages([]);
    } catch (error) {
      toast.error('Failed to clear history');
    }
  };

  const fetchAvailableUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await api.get('/chat/users/available');
      setAvailableUsers(response.data);
    } catch (error) {
      console.error('Failed to fetch users:', error);
      toast.error('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const createConversation = async () => {
    if (!selectedUser) return toast.error('Please select a user');

    setCreatingChat(true);
    try {
      let buyerId = undefined;
      let farmerId = undefined;
      let transporterId = undefined;

      if (user?.role === 'BUYER') buyerId = user.id;
      else if (user?.role === 'FARMER') farmerId = user.id;
      else if (user?.role === 'TRANSPORTER') transporterId = user.id;

      if (selectedUser.role === 'BUYER') buyerId = selectedUser.id;
      else if (selectedUser.role === 'FARMER') farmerId = selectedUser.id;
      else if (selectedUser.role === 'TRANSPORTER') transporterId = selectedUser.id;

      const response = await api.post('/chat/conversations', {
        buyerId,
        farmerId,
        transporterId,
      });

      toast.success('Conversation created!');
      setShowNewChat(false);
      setSelectedUser(null);
      setUserSearchTerm('');
      await fetchConversations();
      setSelectedConversation(response.data);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to create conversation');
    } finally {
      setCreatingChat(false);
    }
  };

  useEffect(() => { fetchConversations(); }, []);

  useEffect(() => {
    if (selectedConversation) fetchMessages(selectedConversation.id);
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getOtherUser = (conversation: Conversation) => {
    if (!user) return null;
    if (user.role === 'FARMER') return conversation.buyer;
    if (user.role === 'BUYER') return conversation.farmer || conversation.transporter;
    if (user.role === 'TRANSPORTER') return conversation.farmer || conversation.buyer;
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

  // ✅ Functional search filter
  const filteredUsers = availableUsers.filter(u => 
    u.name.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  if (loading) return <div className="min-h-[60vh] flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div></div>;

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8 max-w-6xl">
          
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-6 w-6 text-green-600" />
              <h1 className="text-2xl font-bold text-gray-900">Messages</h1>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={fetchConversations} className="bg-white">
                <RefreshCw className="h-4 w-4 mr-2" /> Refresh
              </Button>
              <Button onClick={() => { setShowNewChat(true); fetchAvailableUsers(); }} className="bg-green-600 hover:bg-green-700 text-white">
                <Plus className="h-4 w-4 mr-2" /> New Chat
              </Button>
            </div>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            
            {/* Conversation List */}
            <Card className="md:col-span-1 border-0 shadow-sm h-[600px] flex flex-col bg-white">
              <div className="p-4 pb-2 border-b border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-bold text-gray-900">Conversations</span>
                  <Badge variant="outline" className="bg-gray-50">{conversations.length}</Badge>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input placeholder="Search..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="pl-9 h-9 text-sm bg-gray-50" />
                </div>
              </div>
              <CardContent className="flex-1 overflow-y-auto p-2 space-y-1">
                {filteredConversations.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    <MessageCircle className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                    <p className="text-sm">No conversations yet</p>
                  </div>
                ) : (
                  filteredConversations.map((conv) => {
                    const otherUser = getOtherUser(conv);
                    if (!otherUser) return null;
                    const isSelected = selectedConversation?.id === conv.id;
                    const lastMessage = conv.messages[0];
                    const unreadCount = conv.unreadCount || 0;

                    return (
                      <div key={conv.id} onClick={() => setSelectedConversation(conv)}
                        className={`p-3 rounded-lg cursor-pointer transition-colors ${isSelected ? 'bg-green-50 border border-green-100' : 'hover:bg-gray-50'}`}>
                        <div className="flex items-center gap-3">
                          <Avatar className={`h-10 w-10 ${isSelected ? 'bg-green-200' : 'bg-gray-100'}`}>
                            <AvatarFallback className={isSelected ? 'text-green-700' : 'text-gray-600'}>
                              {otherUser.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold text-sm truncate text-gray-900">{otherUser.name}</p>
                              {lastMessage && (
                                <span className="text-[10px] text-gray-400">
                                  {new Date(lastMessage.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                            {lastMessage && <p className="text-xs text-gray-500 truncate mt-0.5">{lastMessage.content}</p>}
                          </div>
                          {unreadCount > 0 && (
                            <Badge className="bg-green-600 text-white border-0 h-5 min-w-5 flex items-center justify-center rounded-full">{unreadCount}</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </CardContent>
            </Card>

            {/* Chat Area */}
            <Card className="md:col-span-2 border-0 shadow-sm h-[600px] flex flex-col bg-white">
              {selectedConversation ? (
                <>
                  <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-white rounded-t-xl z-10">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 bg-green-100">
                        <AvatarFallback className="text-green-700 font-bold">
                          {getOtherUser(selectedConversation)?.name?.charAt(0) || 'U'}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-bold text-gray-900">{getOtherUser(selectedConversation)?.name}</p>
                        <div className="flex items-center gap-2 text-[11px] text-gray-500">
                          {getParticipantInfo(selectedConversation).map((p, i) => (
                            <span key={i} className="flex items-center gap-0.5">
                              {getRoleIcon(p.role)} {p.name} ({p.role}) {i < getParticipantInfo(selectedConversation).length - 1 && ' • '}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-gray-500"><MoreVertical className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Chat Settings</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => { setNotificationsEnabled(!notificationsEnabled); toast.success('Notifications updated'); }}>
                            {notificationsEnabled ? <><BellOff className="h-4 w-4 mr-2" /> Mute</> : <><Bell className="h-4 w-4 mr-2" /> Unmute</>}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={clearHistory} className="text-red-600"><Archive className="h-4 w-4 mr-2" /> Clear History</DropdownMenuItem>
                          <DropdownMenuItem onClick={() => deleteConversation(selectedConversation.id)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Delete Chat</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <CardContent className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50/50">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-gray-400">
                        <MessageCircle className="h-10 w-10 mx-auto mb-2 opacity-30" />
                        <p className="text-sm">No messages yet. Say hello!</p>
                      </div>
                    ) : (
                      messages.map((msg) => {
                        const isMe = msg.senderId === user?.id;
                        return (
                          <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[75%] rounded-2xl px-4 py-2 shadow-sm ${isMe ? 'bg-green-600 text-white rounded-tr-none' : 'bg-white border border-gray-100 text-gray-800 rounded-tl-none'}`}>
                              <p className="text-sm break-words">{msg.content}</p>
                              <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-green-100' : 'text-gray-400'}`}>
                                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                {isMe && (msg.isRead ? <CheckCheck className="h-3 w-3" /> : <Check className="h-3 w-3" />)}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </CardContent>

                  <div className="p-4 border-t border-gray-100 bg-white rounded-b-xl">
                    <form onSubmit={sendMessage} className="flex gap-2">
                      <Input placeholder="Type your message..." value={newMessage} onChange={(e) => setNewMessage(e.target.value)} className="flex-1 bg-gray-50 border-gray-200 focus:border-green-500" />
                      <Button type="submit" disabled={sending || !newMessage.trim()} className="bg-green-600 hover:bg-green-700 text-white">
                        <Send className="h-4 w-4" />
                      </Button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-center text-gray-400 bg-gray-50/50">
                  <div>
                    <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p className="font-medium text-gray-600">Your Messages</p>
                    <p className="text-sm">Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </Card>
          </div>
        </div>
      </div>

      {/* New Chat Dialog */}
      <Dialog open={showNewChat} onOpenChange={setShowNewChat}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader><DialogTitle>Start a New Chat</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-3">
              <p className="text-sm text-gray-500">Select a user to start chatting with:</p>
              
              {/* ✅ Search input */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input 
                  placeholder="Search by name..." 
                  value={userSearchTerm} 
                  onChange={(e) => setUserSearchTerm(e.target.value)} 
                  className="pl-9 bg-gray-50" 
                />
              </div>

              {/* ✅ Replaced the buggy Select with a scrollable list */}
              <div className="h-64 overflow-y-auto border border-gray-100 rounded-lg bg-gray-50 p-2 space-y-1">
                {loadingUsers ? (
                  <div className="flex justify-center py-4"><Loader2 className="h-6 w-6 animate-spin text-green-600" /></div>
                ) : filteredUsers.length === 0 ? (
                  <div className="text-center py-8 text-gray-500 text-sm">No users found</div>
                ) : (
                  filteredUsers.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUser(u)}
                      className={`w-full flex items-center justify-between p-2 rounded-md transition-colors ${
                        selectedUser?.id === u.id ? 'bg-green-100 border border-green-200' : 'bg-white hover:bg-gray-100'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Avatar className="h-8 w-8 bg-green-50">
                          <AvatarFallback className="text-green-700 text-xs font-bold">{u.name.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="text-sm font-medium text-gray-800">{u.name}</span>
                      </div>
                      <span className="text-xs text-gray-500 capitalize flex items-center gap-1">
                        {getRoleIcon(u.role)} {u.role.toLowerCase()}
                      </span>
                    </button>
                  ))
                )}
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowNewChat(false)}>Cancel</Button>
              <Button className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={createConversation} disabled={creatingChat || !selectedUser}>
                {creatingChat ? 'Creating...' : 'Start Chat'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </ProtectedRoute>
  );
}