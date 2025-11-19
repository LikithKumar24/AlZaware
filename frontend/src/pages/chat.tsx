import { useEffect, useState, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/router';
import axios from 'axios';
import { Send, MessageCircle, Loader2, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Message {
  _id: string;
  sender_email: string;
  receiver_email: string;
  message: string;
  timestamp: string;
  read: boolean;
  delivered?: boolean;
}

interface Doctor {
  email: string;
  full_name: string;
  specialization?: string;
  profile_photo_url?: string;
  assigned_patients?: string[];
}

export default function ChatPage() {
  const { user, token } = useAuth();
  const router = useRouter();
  const { email: queryPartnerEmail } = router.query;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [ws, setWs] = useState<WebSocket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [partnerName, setPartnerName] = useState<string>('');
  const [assignedDoctors, setAssignedDoctors] = useState<Doctor[]>([]);
  const [assignedPatients, setAssignedPatients] = useState<any[]>([]);
  const [selectedDoctor, setSelectedDoctor] = useState<Doctor | null>(null);
  const [selectedPatient, setSelectedPatient] = useState<any | null>(null);
  const [latestMessages, setLatestMessages] = useState<Record<string, string>>({});
  const [loadingDoctors, setLoadingDoctors] = useState(false);
  const [loadingPatients, setLoadingPatients] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Determine partner email based on role and selection
  const partnerEmail = user?.role === 'patient' 
    ? (selectedDoctor?.email || queryPartnerEmail)
    : (selectedPatient?.email || queryPartnerEmail);

  // Format partner email to display name
  const getDisplayName = (email: string) => {
    if (selectedDoctor) return `Dr. ${selectedDoctor.full_name}`;
    if (partnerName) return partnerName;
    const namePart = email.split('@')[0];
    return namePart
      .split('.')
      .map(part => part.charAt(0).toUpperCase() + part.slice(1))
      .join(' ');
  };

  // Auto-scroll to bottom when new messages arrive
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch assigned doctors for patients
  useEffect(() => {
    if (!user || user.role !== 'patient' || !token) return;

    const fetchDoctors = async () => {
      setLoadingDoctors(true);
      try {
        console.log('[Chat] Fetching assigned doctors for patient:', user.email);
        // Use /users/doctors endpoint which returns doctors with assigned_patients info
        const res = await axios.get('http://127.0.0.1:8000/users/doctors', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        // Filter only doctors who have this patient in their assigned_patients list
        const filtered = res.data.filter((doctor: Doctor) => 
          doctor.assigned_patients && doctor.assigned_patients.includes(user.email)
        );
        
        setAssignedDoctors(filtered);
        console.log('[Chat] Assigned doctors found:', filtered.length, filtered.map((d: Doctor) => d.email));

        // If there's a query parameter, select that doctor
        if (queryPartnerEmail && typeof queryPartnerEmail === 'string') {
          const matchingDoctor = filtered.find((d: Doctor) => d.email === queryPartnerEmail);
          if (matchingDoctor) {
            setSelectedDoctor(matchingDoctor);
            console.log('[Chat] Auto-selected doctor from query:', matchingDoctor.email);
          }
        } else if (filtered.length > 0 && !selectedDoctor) {
          // Auto-select first doctor if none selected
          setSelectedDoctor(filtered[0]);
          console.log('[Chat] Auto-selected first doctor:', filtered[0].email);
        }
      } catch (error) {
        console.error('[Chat] Error fetching assigned doctors:', error);
        if (axios.isAxiosError(error)) {
          console.error('[Chat] Error details:', error.response?.data);
        }
        setAssignedDoctors([]);
      } finally {
        setLoadingDoctors(false);
      }
    };

    fetchDoctors();
  }, [user, token]);

  // Fetch assigned patients for doctors
  useEffect(() => {
    if (!user || user.role !== 'doctor' || !token) return;

    const fetchPatients = async () => {
      setLoadingPatients(true);
      try {
        console.log('[Chat] Fetching assigned patients for doctor:', user.email);
        // Use /doctor/patients endpoint which returns assigned patients
        const res = await axios.get('http://127.0.0.1:8000/doctor/patients', {
          headers: { Authorization: `Bearer ${token}` },
        });
        
        const patients = res.data;
        setAssignedPatients(patients);
        console.log('[Chat] Assigned patients found:', patients.length, patients.map((p: any) => p.email));

        // If there's a query parameter, select that patient
        if (queryPartnerEmail && typeof queryPartnerEmail === 'string') {
          const matchingPatient = patients.find((p: any) => p.email === queryPartnerEmail);
          if (matchingPatient) {
            setSelectedPatient(matchingPatient);
            console.log('[Chat] Auto-selected patient from query:', matchingPatient.email);
          }
        } else if (patients.length > 0 && !selectedPatient) {
          // Auto-select first patient if none selected
          setSelectedPatient(patients[0]);
          console.log('[Chat] Auto-selected first patient:', patients[0].email);
        }
      } catch (error) {
        console.error('[Chat] Error fetching assigned patients:', error);
        if (axios.isAxiosError(error)) {
          console.error('[Chat] Error details:', error.response?.data);
        }
        setAssignedPatients([]);
      } finally {
        setLoadingPatients(false);
      }
    };

    fetchPatients();
  }, [user, token]);

  // Fetch chat history
  useEffect(() => {
    if (!token || !user?.email || !partnerEmail || typeof partnerEmail !== 'string') {
      console.log('[Chat] Skipping fetch - missing data:', { 
        hasToken: !!token, 
        userEmail: user?.email, 
        partnerEmail 
      });
      setLoadingHistory(false);
      return;
    }

    console.log('[Chat] Fetching messages between:', user.email, 'and', partnerEmail);
    setLoadingHistory(true);
    const fetchHistory = async () => {
      try {
        const response = await axios.get(
          `http://127.0.0.1:8000/messages/${user.email}/${partnerEmail}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        console.log('[Chat] Messages received:', response.data);
        console.log('[Chat] Loaded', response.data.length, 'messages');
        setMessages(response.data);
        
        // Update latest message for this doctor
        if (response.data.length > 0) {
          const latest = response.data[response.data.length - 1];
          setLatestMessages(prev => ({
            ...prev,
            [partnerEmail]: latest.message.substring(0, 30) + (latest.message.length > 30 ? '...' : '')
          }));
        }
      } catch (error) {
        console.error('[Chat] Error loading history:', error);
        if (axios.isAxiosError(error)) {
          console.error('[Chat] Error details:', error.response?.data);
        }
      } finally {
        console.log('[Chat] Finished loading history');
        setLoadingHistory(false);
      }
    };

    fetchHistory();
  }, [token, user?.email, partnerEmail]);

  // Mark messages as read
  useEffect(() => {
    if (!token || !partnerEmail || typeof partnerEmail !== 'string') return;

    const markAsRead = async () => {
      try {
        await axios.patch(
          `http://127.0.0.1:8000/messages/mark-read/${partnerEmail}`,
          {},
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (error) {
        console.error('[Chat] Error marking as read:', error);
      }
    };

    markAsRead();
  }, [token, partnerEmail]);

  // WebSocket connection
  useEffect(() => {
    if (!user?.email) {
      console.log('[WebSocket] No user email, skipping connection');
      return;
    }

    console.log('[WebSocket] Connecting for user:', user.email);
    const websocket = new WebSocket(`ws://127.0.0.1:8000/ws/${user.email}`);

    websocket.onopen = () => {
      console.log('[WebSocket] Connected successfully');
      console.log('[WebSocket] Ready state:', websocket.readyState);
      setIsConnected(true);
    };

    websocket.onmessage = (event) => {
      const message: Message = JSON.parse(event.data);
      console.log('[WebSocket] Received message:', message);

      if (message.error) {
        console.error('[WebSocket] Error:', message.error);
        return;
      }

      // Add message to chat if it's part of current conversation
      if (
        (message.sender_email === partnerEmail && message.receiver_email === user.email) ||
        (message.sender_email === user.email && message.receiver_email === partnerEmail)
      ) {
        console.log('[WebSocket] Adding message to chat');
        setMessages((prev) => {
          // Avoid duplicates
          if (prev.some((m) => m._id === message._id)) {
            console.log('[WebSocket] Duplicate message, skipping');
            return prev;
          }
          return [...prev, message];
        });
      } else {
        console.log('[WebSocket] Message not for this conversation, ignoring');
      }
    };

    websocket.onerror = (error) => {
      console.error('[WebSocket] Error:', error);
      setIsConnected(false);
    };

    websocket.onclose = () => {
      console.log('[WebSocket] Disconnected');
      setIsConnected(false);
    };

    setWs(websocket);

    return () => {
      console.log('[WebSocket] Cleaning up connection');
      if (websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, [user?.email, partnerEmail]);

  const sendMessage = async () => {
    if (!newMessage.trim() || !ws || !partnerEmail || typeof partnerEmail !== 'string') return;

    if (ws.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Connection not open');
      return;
    }

    setIsSending(true);

    try {
      const messageData = {
        receiver_email: partnerEmail,
        message: newMessage.trim(),
      };

      ws.send(JSON.stringify(messageData));
      console.log('[WebSocket] Sent message:', messageData);

      setNewMessage('');
      inputRef.current?.focus();
    } catch (error) {
      console.error('[WebSocket] Error sending message:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: date.getFullYear() !== today.getFullYear() ? 'numeric' : undefined,
      });
    }
  };

  // Group messages by date
  const groupedMessages = messages.reduce((groups, message) => {
    const date = formatDate(message.timestamp);
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(message);
    return groups;
  }, {} as Record<string, Message[]>);

  if (!user || (!partnerEmail && user.role === 'doctor')) {
    return (
      <div className="container mx-auto p-4">
        <div className="text-center mt-8">
          <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <p className="text-slate-600 mb-2">
            {!user ? 'Please log in to access chat' : 'No chat partner selected'}
          </p>
          {!partnerEmail && user && (
            <p className="text-sm text-gray-500">
              Open chat from your dashboard or select a conversation partner
            </p>
          )}
          <Button
            onClick={() => router.push('/')}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white"
          >
            Go to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  // Patient view with doctor list sidebar
  if (user.role === 'patient') {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Left Sidebar - Doctor List */}
        <div className="w-1/4 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-slate-50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-blue-600" />
              Your Doctors
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {assignedDoctors.length} doctor{assignedDoctors.length !== 1 ? 's' : ''} available
            </p>
          </div>

          <div className="p-2">
            {loadingDoctors ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-blue-600" />
              </div>
            ) : assignedDoctors.length > 0 ? (
              <div className="space-y-1">
                {assignedDoctors.map((doctor) => (
                  <div
                    key={doctor.email}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedDoctor?.email === doctor.email
                        ? 'bg-green-100 border-2 border-green-400'
                        : 'hover:bg-blue-50 border border-transparent'
                    }`}
                    onClick={() => {
                      console.log('[Chat] Selected doctor:', doctor);
                      setSelectedDoctor(doctor);
                      setMessages([]);
                      setLoadingHistory(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {doctor.profile_photo_url ? (
                          <img
                            src={doctor.profile_photo_url}
                            alt={doctor.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-teal-500 flex items-center justify-center text-white font-bold">
                            {doctor.full_name.split(' ').map(n => n[0]).join('')}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          Dr. {doctor.full_name}
                        </p>
                        <p className="text-xs text-slate-600 truncate">
                          {doctor.specialization || 'Neurologist'}
                        </p>
                        {latestMessages[doctor.email] && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {latestMessages[doctor.email]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">No assigned doctors yet</p>
                <p className="text-xs text-gray-500 mb-4">
                  Visit 'View Doctors' to request supervision
                </p>
                <Button
                  onClick={() => router.push('/view-doctors')}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  View Doctors
                </Button>
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedDoctor ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="w-16 h-16 mb-4" />
              <p className="font-medium text-lg">No doctor selected</p>
              <p className="text-sm mt-2">Click a doctor on the left to start chatting</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="border-b bg-gradient-to-r from-blue-50 to-slate-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-blue-600 p-2 rounded-full">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800">
                        Dr. {selectedDoctor.full_name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                          }`}
                        />
                        <span className="text-xs text-slate-600">
                          {isConnected ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.back()}
                    className="text-slate-600 hover:bg-slate-100"
                  >
                    Back
                  </Button>
                </div>
              </div>

              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                {loadingHistory ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No messages yet. Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                      <div key={date}>
                        <div className="flex items-center justify-center my-4">
                          <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 border">
                            {date}
                          </span>
                        </div>
                        {dateMessages.map((message) => {
                          const isSender = message.sender_email === user.email;
                          return (
                            <div
                              key={message._id}
                              className={`flex mb-3 ${isSender ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${
                                  isSender
                                    ? 'bg-blue-600 text-white'
                                    : 'bg-white text-slate-800 border border-slate-200'
                                }`}
                              >
                                <p className="text-sm break-words whitespace-pre-wrap">
                                  {message.message}
                                </p>
                                <div
                                  className={`flex items-center gap-1 mt-1 text-xs ${
                                    isSender ? 'text-blue-100' : 'text-gray-500'
                                  }`}
                                >
                                  <span>{formatTime(message.timestamp)}</span>
                                  {isSender && message.delivered !== undefined && (
                                    <span>{message.delivered ? '✓✓' : '✓'}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t bg-white p-4">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={!isConnected || isSending}
                    className="flex-1 py-2 pl-3 pr-3 bg-white text-slate-900 placeholder:text-gray-400 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:border-gray-300"
                    style={{ 
                      backgroundColor: '#FFFFFF',
                      color: '#1e293b',
                      borderRadius: '8px',
                      paddingLeft: '12px'
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!isConnected || !newMessage.trim() || isSending}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
                {!isConnected && (
                  <p className="text-xs text-red-600 mt-2">
                    Connection lost. Please refresh the page.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Doctor view with patient list sidebar
  if (user.role === 'doctor') {
    return (
      <div className="flex h-screen bg-gray-50">
        {/* Left Sidebar - Patient List */}
        <div className="w-1/4 border-r border-gray-200 bg-white overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-gradient-to-r from-teal-50 to-blue-50">
            <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <MessageCircle className="h-5 w-5 text-teal-600" />
              My Patients
            </h2>
            <p className="text-xs text-slate-600 mt-1">
              {assignedPatients.length} patient{assignedPatients.length !== 1 ? 's' : ''} assigned
            </p>
          </div>

          <div className="p-2">
            {loadingPatients ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin text-teal-600" />
              </div>
            ) : assignedPatients.length > 0 ? (
              <div className="space-y-1">
                {assignedPatients.map((patient) => (
                  <div
                    key={patient.email}
                    className={`p-3 rounded-lg cursor-pointer transition-all ${
                      selectedPatient?.email === patient.email
                        ? 'bg-teal-100 border-2 border-teal-400'
                        : 'hover:bg-blue-50 border border-transparent'
                    }`}
                    onClick={() => {
                      console.log('[Chat] Selected patient:', patient);
                      setSelectedPatient(patient);
                      setMessages([]);
                      setLoadingHistory(true);
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex-shrink-0">
                        {patient.profile_photo_url ? (
                          <img
                            src={patient.profile_photo_url}
                            alt={patient.full_name}
                            className="w-10 h-10 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-blue-500 flex items-center justify-center text-white font-bold">
                            {patient.full_name.split(' ').map((n: string) => n[0]).join('')}
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-slate-900 truncate">
                          {patient.full_name}
                        </p>
                        <p className="text-xs text-slate-600 truncate">
                          {patient.email}
                        </p>
                        {latestMessages[patient.email] && (
                          <p className="text-xs text-gray-500 truncate mt-1">
                            {latestMessages[patient.email]}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 px-4">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-600 mb-2">No assigned patients yet</p>
                <p className="text-xs text-gray-500">
                  Patients will appear here once they request your supervision and you approve them.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {!selectedPatient ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <MessageCircle className="w-16 h-16 mb-4" />
              <p className="font-medium text-lg">No patient selected</p>
              <p className="text-sm mt-2">Click a patient on the left to start chatting</p>
            </div>
          ) : (
            <>
              {/* Chat Header */}
              <div className="border-b bg-gradient-to-r from-teal-50 to-blue-50 p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-teal-600 p-2 rounded-full">
                      <MessageCircle className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <h2 className="text-xl font-semibold text-slate-800">
                        {selectedPatient.full_name}
                      </h2>
                      <div className="flex items-center gap-2 mt-1">
                        <div
                          className={`h-2 w-2 rounded-full ${
                            isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                          }`}
                        />
                        <span className="text-xs text-slate-600">
                          {isConnected ? 'Online' : 'Offline'}
                        </span>
                      </div>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => router.back()}
                    className="text-slate-600 hover:bg-slate-100"
                  >
                    Back
                  </Button>
                </div>
              </div>

              {/* Messages Area - Reuse the same code from patient view */}
              <div className="flex-1 overflow-y-auto p-4 bg-slate-50">
                {loadingHistory ? (
                  <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin text-teal-600" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p className="text-gray-500">No messages yet. Start the conversation!</p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                      <div key={date}>
                        <div className="flex items-center justify-center my-4">
                          <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 border">
                            {date}
                          </span>
                        </div>
                        {dateMessages.map((message) => {
                          const isSender = message.sender_email === user.email;
                          return (
                            <div
                              key={message._id}
                              className={`flex mb-3 ${isSender ? 'justify-end' : 'justify-start'}`}
                            >
                              <div
                                className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${
                                  isSender
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-white text-slate-800 border border-slate-200'
                                }`}
                              >
                                <p className="text-sm break-words whitespace-pre-wrap">
                                  {message.message}
                                </p>
                                <div
                                  className={`flex items-center gap-1 mt-1 text-xs ${
                                    isSender ? 'text-teal-100' : 'text-gray-500'
                                  }`}
                                >
                                  <span>{formatTime(message.timestamp)}</span>
                                  {isSender && message.delivered !== undefined && (
                                    <span>{message.delivered ? '✓✓' : '✓'}</span>
                                  )}
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Message Input */}
              <div className="border-t bg-white p-4">
                <div className="flex gap-2">
                  <input
                    ref={inputRef}
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type a message..."
                    disabled={!isConnected || isSending}
                    className="flex-1 py-2 pl-3 pr-3 bg-white text-slate-900 placeholder:text-gray-400 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:border-gray-300"
                    style={{ 
                      backgroundColor: '#FFFFFF',
                      color: '#1e293b',
                      borderRadius: '8px',
                      paddingLeft: '12px'
                    }}
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!isConnected || !newMessage.trim() || isSending}
                    className="bg-teal-600 hover:bg-teal-700 text-white px-6"
                  >
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <>
                        <Send className="h-4 w-4 mr-2" />
                        Send
                      </>
                    )}
                  </Button>
                </div>
                {!isConnected && (
                  <p className="text-xs text-red-600 mt-2">
                    Connection lost. Please refresh the page.
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // Fallback for old doctor view (if needed)
  return (
    <div className="container mx-auto p-4 h-screen flex flex-col">
      <Card className="flex-1 flex flex-col shadow-lg">
        <CardHeader className="border-b bg-gradient-to-r from-blue-50 to-slate-50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-blue-600 p-2 rounded-full">
                <MessageCircle className="h-5 w-5 text-white" />
              </div>
              <div>
                <CardTitle className="text-xl">
                  {partnerEmail && typeof partnerEmail === 'string' 
                    ? getDisplayName(partnerEmail)
                    : 'Chat'}
                </CardTitle>
                <div className="flex items-center gap-2 mt-1">
                  <div
                    className={`h-2 w-2 rounded-full ${
                      isConnected ? 'bg-green-500 animate-pulse' : 'bg-gray-400'
                    }`}
                  />
                  <span className="text-xs text-slate-600">
                    {isConnected ? 'Online' : 'Offline'}
                  </span>
                </div>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
              className="text-slate-600 hover:bg-slate-100"
            >
              Back
            </Button>
          </div>
        </CardHeader>

        <CardContent className="flex-1 overflow-y-auto p-4 bg-slate-50">
          {loadingHistory ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <MessageCircle className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500">No messages yet. Start the conversation!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {Object.entries(groupedMessages).map(([date, dateMessages]) => (
                <div key={date}>
                  <div className="flex items-center justify-center my-4">
                    <span className="bg-white px-3 py-1 rounded-full text-xs text-gray-500 border">
                      {date}
                    </span>
                  </div>
                  {dateMessages.map((message) => {
                    const isSender = message.sender_email === user.email;
                    return (
                      <div
                        key={message._id}
                        className={`flex mb-3 ${isSender ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg px-4 py-2 shadow-sm ${
                            isSender
                              ? 'bg-blue-600 text-white'
                              : 'bg-white text-slate-800 border border-slate-200'
                          }`}
                        >
                          <p className="text-sm break-words whitespace-pre-wrap">
                            {message.message}
                          </p>
                          <div
                            className={`flex items-center gap-1 mt-1 text-xs ${
                              isSender ? 'text-blue-100' : 'text-gray-500'
                            }`}
                          >
                            <span>{formatTime(message.timestamp)}</span>
                            {isSender && message.delivered !== undefined && (
                              <span>{message.delivered ? '✓✓' : '✓'}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </CardContent>

        <div className="border-t bg-white p-4">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              disabled={!isConnected || isSending}
              className="flex-1 py-2 pl-3 pr-3 bg-white text-slate-900 placeholder:text-gray-400 border-2 border-blue-500 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:border-gray-300"
              style={{ 
                backgroundColor: '#FFFFFF',
                color: '#1e293b',
                borderRadius: '8px',
                paddingLeft: '12px'
              }}
            />
            <Button
              onClick={sendMessage}
              disabled={!isConnected || !newMessage.trim() || isSending}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6"
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4 mr-2" />
                  Send
                </>
              )}
            </Button>
          </div>
          {!isConnected && (
            <p className="text-xs text-red-600 mt-2">
              Connection lost. Please refresh the page.
            </p>
          )}
        </div>
      </Card>
    </div>
  );
}
