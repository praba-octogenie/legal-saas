import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import axios from 'axios';
import { toast } from 'react-toastify';

import { RootState } from '../store';
import { Message, Conversation, Notification, PaginatedResponse } from '@/types';

// Define types
interface CommunicationState {
  messages: Message[];
  conversations: Conversation[];
  selectedConversation: Conversation | null;
  notifications: Notification[];
  unreadNotificationsCount: number;
  totalMessages: number;
  totalConversations: number;
  totalNotifications: number;
  loading: boolean;
  error: string | null;
}

// Define initial state
const initialState: CommunicationState = {
  messages: [],
  conversations: [],
  selectedConversation: null,
  notifications: [],
  unreadNotificationsCount: 0,
  totalMessages: 0,
  totalConversations: 0,
  totalNotifications: 0,
  loading: false,
  error: null,
};

// Async thunks for conversations
export const fetchConversations = createAsyncThunk(
  'communication/fetchConversations',
  async ({ 
    limit = 10, 
    offset = 0
  }: { 
    limit?: number; 
    offset?: number;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.get<PaginatedResponse<Conversation>>('/api/communication/conversations', {
        params: {
          limit,
          offset,
        },
      });
      
      return {
        conversations: response.data.data,
        total: response.data.total,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch conversations'
      );
    }
  }
);

export const fetchConversationById = createAsyncThunk(
  'communication/fetchConversationById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get<Conversation>(`/api/communication/conversations/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch conversation'
      );
    }
  }
);

export const createConversation = createAsyncThunk(
  'communication/createConversation',
  async (conversationData: {
    title?: string;
    type: 'direct' | 'group' | 'case' | 'client';
    participants: string[];
    caseId?: string;
    clientId?: string;
    metadata?: Record<string, any>;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.post<Conversation>('/api/communication/conversations', conversationData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to create conversation'
      );
    }
  }
);

// Async thunks for messages
export const fetchMessages = createAsyncThunk(
  'communication/fetchMessages',
  async ({ 
    conversationId,
    limit = 50, 
    offset = 0
  }: { 
    conversationId: string;
    limit?: number; 
    offset?: number;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.get<PaginatedResponse<Message>>(`/api/communication/conversations/${conversationId}/messages`, {
        params: {
          limit,
          offset,
        },
      });
      
      return {
        messages: response.data.data,
        total: response.data.total,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch messages'
      );
    }
  }
);

export const sendMessage = createAsyncThunk(
  'communication/sendMessage',
  async (messageData: {
    content: string;
    contentType?: 'text' | 'html' | 'markdown';
    messageType?: 'chat' | 'email' | 'sms' | 'notification';
    recipientId?: string;
    clientId?: string;
    caseId?: string;
    conversationId?: string;
    attachments?: File[];
    metadata?: Record<string, any>;
  }, { rejectWithValue }) => {
    try {
      // Create FormData if there are attachments
      if (messageData.attachments && messageData.attachments.length > 0) {
        const formData = new FormData();
        
        // Append message data
        formData.append('message', JSON.stringify({
          content: messageData.content,
          contentType: messageData.contentType || 'text',
          messageType: messageData.messageType || 'chat',
          recipientId: messageData.recipientId,
          clientId: messageData.clientId,
          caseId: messageData.caseId,
          conversationId: messageData.conversationId,
          metadata: messageData.metadata,
        }));
        
        // Append attachments
        messageData.attachments.forEach((file) => {
          formData.append('attachments', file);
        });
        
        const response = await axios.post<Message>('/api/communication/messages', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
        
        return response.data;
      } else {
        // Send without FormData if no attachments
        const response = await axios.post<Message>('/api/communication/messages', {
          content: messageData.content,
          contentType: messageData.contentType || 'text',
          messageType: messageData.messageType || 'chat',
          recipientId: messageData.recipientId,
          clientId: messageData.clientId,
          caseId: messageData.caseId,
          conversationId: messageData.conversationId,
          metadata: messageData.metadata,
        });
        
        return response.data;
      }
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to send message'
      );
    }
  }
);

// Async thunks for notifications
export const fetchNotifications = createAsyncThunk(
  'communication/fetchNotifications',
  async ({ 
    limit = 10, 
    offset = 0
  }: { 
    limit?: number; 
    offset?: number;
  }, { rejectWithValue }) => {
    try {
      const response = await axios.get<PaginatedResponse<Notification>>('/api/communication/notifications', {
        params: {
          limit,
          offset,
        },
      });
      
      return {
        notifications: response.data.data,
        total: response.data.total,
      };
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to fetch notifications'
      );
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'communication/markNotificationAsRead',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.patch<Notification>(`/api/communication/notifications/${id}/read`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to mark notification as read'
      );
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'communication/markAllNotificationsAsRead',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.patch<{ count: number }>('/api/communication/notifications/read-all');
      return response.data.count;
    } catch (error: any) {
      return rejectWithValue(
        error.response?.data?.error || 'Failed to mark all notifications as read'
      );
    }
  }
);

// Create slice
const communicationSlice = createSlice({
  name: 'communication',
  initialState,
  reducers: {
    clearCommunicationError: (state) => {
      state.error = null;
    },
    clearSelectedConversation: (state) => {
      state.selectedConversation = null;
    },
    addMessage: (state, action: PayloadAction<Message>) => {
      // Add a new message (e.g., from WebSocket)
      state.messages.unshift(action.payload);
      state.totalMessages += 1;
    },
    addNotification: (state, action: PayloadAction<Notification>) => {
      // Add a new notification (e.g., from WebSocket)
      state.notifications.unshift(action.payload);
      state.totalNotifications += 1;
      if (action.payload.status === 'unread') {
        state.unreadNotificationsCount += 1;
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch conversations
      .addCase(fetchConversations.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversations.fulfilled, (state, action: PayloadAction<{ conversations: Conversation[]; total: number }>) => {
        state.conversations = action.payload.conversations;
        state.totalConversations = action.payload.total;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchConversations.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Fetch conversation by ID
      .addCase(fetchConversationById.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchConversationById.fulfilled, (state, action: PayloadAction<Conversation>) => {
        state.selectedConversation = action.payload;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchConversationById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Create conversation
      .addCase(createConversation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(createConversation.fulfilled, (state, action: PayloadAction<Conversation>) => {
        state.conversations.unshift(action.payload);
        state.totalConversations += 1;
        state.selectedConversation = action.payload;
        state.loading = false;
        state.error = null;
        toast.success('Conversation created successfully');
      })
      .addCase(createConversation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Fetch messages
      .addCase(fetchMessages.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchMessages.fulfilled, (state, action: PayloadAction<{ messages: Message[]; total: number }>) => {
        state.messages = action.payload.messages;
        state.totalMessages = action.payload.total;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchMessages.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Send message
      .addCase(sendMessage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(sendMessage.fulfilled, (state, action: PayloadAction<Message>) => {
        state.messages.unshift(action.payload);
        state.totalMessages += 1;
        state.loading = false;
        state.error = null;
      })
      .addCase(sendMessage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      })
      
      // Fetch notifications
      .addCase(fetchNotifications.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action: PayloadAction<{ notifications: Notification[]; total: number }>) => {
        state.notifications = action.payload.notifications;
        state.totalNotifications = action.payload.total;
        state.unreadNotificationsCount = action.payload.notifications.filter(n => n.status === 'unread').length;
        state.loading = false;
        state.error = null;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Mark notification as read
      .addCase(markNotificationAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markNotificationAsRead.fulfilled, (state, action: PayloadAction<Notification>) => {
        state.notifications = state.notifications.map((notification) => {
          if (notification.id === action.payload.id) {
            if (notification.status === 'unread' && action.payload.status === 'read') {
              state.unreadNotificationsCount -= 1;
            }
            return action.payload;
          }
          return notification;
        });
        state.loading = false;
        state.error = null;
      })
      .addCase(markNotificationAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Mark all notifications as read
      .addCase(markAllNotificationsAsRead.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(markAllNotificationsAsRead.fulfilled, (state) => {
        state.notifications = state.notifications.map((notification) => ({
          ...notification,
          status: 'read',
        }));
        state.unreadNotificationsCount = 0;
        state.loading = false;
        state.error = null;
        toast.success('All notifications marked as read');
      })
      .addCase(markAllNotificationsAsRead.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        toast.error(action.payload as string);
      });
  },
});

// Export actions and reducer
export const { 
  clearCommunicationError, 
  clearSelectedConversation,
  addMessage,
  addNotification
} = communicationSlice.actions;

export const selectConversations = (state: RootState) => state.communication.conversations;
export const selectSelectedConversation = (state: RootState) => state.communication.selectedConversation;
export const selectMessages = (state: RootState) => state.communication.messages;
export const selectNotifications = (state: RootState) => state.communication.notifications;
export const selectUnreadNotificationsCount = (state: RootState) => state.communication.unreadNotificationsCount;
export const selectTotalConversations = (state: RootState) => state.communication.totalConversations;
export const selectTotalMessages = (state: RootState) => state.communication.totalMessages;
export const selectTotalNotifications = (state: RootState) => state.communication.totalNotifications;
export const selectCommunicationLoading = (state: RootState) => state.communication.loading;
export const selectCommunicationError = (state: RootState) => state.communication.error;

export default communicationSlice.reducer;