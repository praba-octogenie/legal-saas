import React, { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'next-i18next';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Chip,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Tooltip,
  Menu,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  SelectChangeEvent,
} from '@mui/material';
import {
  Send as SendIcon,
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  ContentCopy as CopyIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Gavel as GavelIcon,
  Description as DocumentIcon,
  Book as BookIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { toast } from 'react-toastify';
import ReactMarkdown from 'react-markdown';

import AIService from '@/services/aiService';

// Types
interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  citations?: {
    text: string;
    source: string;
    url?: string;
  }[];
  relevantStatutes?: {
    name: string;
    section: string;
    text: string;
  }[];
  loading?: boolean;
}

interface AILegalAssistantProps {
  initialContext?: string;
  initialQuestion?: string;
  caseId?: string;
  documentId?: string;
  onSaveResearch?: (data: { question: string; answer: string; citations: any[] }) => void;
}

const AILegalAssistant: React.FC<AILegalAssistantProps> = ({
  initialContext,
  initialQuestion,
  caseId,
  documentId,
  onSaveResearch,
}) => {
  const { t } = useTranslation(['legal-research', 'common']);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'system',
      content: t('welcomeMessage', { ns: 'legal-research' }),
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState(initialQuestion || '');
  const [loading, setLoading] = useState(false);
  const [jurisdiction, setJurisdiction] = useState<string>('india');
  const [temperature, setTemperature] = useState<number>(0.3);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Initialize with initial question if provided
  useEffect(() => {
    if (initialQuestion) {
      handleSendMessage();
    }
  }, []);
  
  const handleSendMessage = async () => {
    if (!input.trim()) return;
    
    // Add user message
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };
    
    // Add placeholder for assistant message
    const assistantMessageId = (Date.now() + 1).toString();
    const assistantMessage: Message = {
      id: assistantMessageId,
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      loading: true,
    };
    
    setMessages([...messages, userMessage, assistantMessage]);
    setInput('');
    setLoading(true);
    
    try {
      // Get context from previous messages
      const context = messages
        .filter((msg) => msg.role !== 'system')
        .map((msg) => `${msg.role}: ${msg.content}`)
        .join('\n\n');
      
      // Get AI response
      const response = await AIService.askLegalQuestion(
        input,
        initialContext ? `${initialContext}\n\n${context}` : context,
        {
          temperature,
          jurisdiction,
        }
      );
      
      // Update assistant message with response
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: response.answer,
                citations: response.citations,
                relevantStatutes: response.relevantStatutes,
                loading: false,
              }
            : msg
        )
      );
      
      // Save research if callback provided
      if (onSaveResearch) {
        onSaveResearch({
          question: input,
          answer: response.answer,
          citations: response.citations,
        });
      }
    } catch (error) {
      console.error('Error getting AI response:', error);
      
      // Update assistant message with error
      setMessages((prevMessages) =>
        prevMessages.map((msg) =>
          msg.id === assistantMessageId
            ? {
                ...msg,
                content: t('aiResponseError', { ns: 'legal-research' }),
                loading: false,
              }
            : msg
        )
      );
      
      toast.error(t('aiResponseError', { ns: 'legal-research' }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  const handleCopyMessage = (content: string) => {
    navigator.clipboard.writeText(content);
    toast.success(t('copiedToClipboard', { ns: 'common' }));
  };
  
  const handleDeleteMessage = (id: string) => {
    setMessages((prevMessages) => prevMessages.filter((msg) => msg.id !== id));
  };
  
  const handleClearConversation = () => {
    setMessages([
      {
        id: '0',
        role: 'system',
        content: t('welcomeMessage', { ns: 'legal-research' }),
        timestamp: new Date(),
      },
    ]);
    setAnchorEl(null);
  };
  
  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleMenuClose = () => {
    setAnchorEl(null);
  };
  
  const handleSettingsOpen = () => {
    setSettingsOpen(true);
    setAnchorEl(null);
  };
  
  const handleSettingsClose = () => {
    setSettingsOpen(false);
  };
  
  const handleJurisdictionChange = (event: SelectChangeEvent) => {
    setJurisdiction(event.target.value);
  };
  
  const handleTemperatureChange = (event: SelectChangeEvent) => {
    setTemperature(Number(event.target.value));
  };
  
  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Typography variant="h6">{t('legalAssistant', { ns: 'legal-research' })}</Typography>
        <Box>
          <Tooltip title={t('settings', { ns: 'common' })}>
            <IconButton onClick={handleSettingsOpen}>
              <SettingsIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('more', { ns: 'common' })}>
            <IconButton onClick={handleMenuOpen}>
              <MoreVertIcon />
            </IconButton>
          </Tooltip>
        </Box>
        
        {/* Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleClearConversation}>
            <ListItemIcon>
              <DeleteIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('clearConversation', { ns: 'legal-research' })} />
          </MenuItem>
          <MenuItem onClick={handleSettingsOpen}>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText primary={t('settings', { ns: 'common' })} />
          </MenuItem>
        </Menu>
        
        {/* Settings Dialog */}
        <Menu
          anchorEl={anchorEl}
          open={settingsOpen}
          onClose={handleSettingsClose}
          PaperProps={{
            sx: { width: 300, p: 2 },
          }}
        >
          <Typography variant="h6" gutterBottom>
            {t('settings', { ns: 'common' })}
          </Typography>
          <Divider sx={{ mb: 2 }} />
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="jurisdiction-label">
              {t('jurisdiction', { ns: 'legal-research' })}
            </InputLabel>
            <Select
              labelId="jurisdiction-label"
              value={jurisdiction}
              label={t('jurisdiction', { ns: 'legal-research' })}
              onChange={handleJurisdictionChange}
            >
              <MenuItem value="india">India</MenuItem>
              <MenuItem value="delhi">Delhi</MenuItem>
              <MenuItem value="maharashtra">Maharashtra</MenuItem>
              <MenuItem value="karnataka">Karnataka</MenuItem>
              <MenuItem value="tamil_nadu">Tamil Nadu</MenuItem>
              <MenuItem value="west_bengal">West Bengal</MenuItem>
            </Select>
          </FormControl>
          
          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel id="temperature-label">
              {t('creativity', { ns: 'legal-research' })}
            </InputLabel>
            <Select
              labelId="temperature-label"
              value={temperature.toString()}
              label={t('creativity', { ns: 'legal-research' })}
              onChange={handleTemperatureChange}
            >
              <MenuItem value="0.1">{t('precise', { ns: 'legal-research' })}</MenuItem>
              <MenuItem value="0.3">{t('balanced', { ns: 'legal-research' })}</MenuItem>
              <MenuItem value="0.7">{t('creative', { ns: 'legal-research' })}</MenuItem>
            </Select>
          </FormControl>
          
          <Button
            variant="contained"
            onClick={handleSettingsClose}
            fullWidth
          >
            {t('save', { ns: 'common' })}
          </Button>
        </Menu>
      </Box>
      
      {/* Messages */}
      <Box
        sx={{
          flexGrow: 1,
          overflow: 'auto',
          p: 2,
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {messages.map((message) => (
          <Box
            key={message.id}
            sx={{
              display: 'flex',
              flexDirection: 'column',
              alignSelf: message.role === 'user' ? 'flex-end' : 'flex-start',
              maxWidth: '80%',
            }}
          >
            <Card
              variant="outlined"
              sx={{
                bgcolor: message.role === 'user' ? 'primary.light' : 'background.paper',
                borderRadius: 2,
              }}
            >
              <CardContent>
                {message.loading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                    <CircularProgress size={24} />
                  </Box>
                ) : (
                  <>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Chip
                        size="small"
                        label={
                          message.role === 'user'
                            ? t('you', { ns: 'common' })
                            : message.role === 'assistant'
                            ? t('assistant', { ns: 'legal-research' })
                            : t('system', { ns: 'common' })
                        }
                        color={
                          message.role === 'user'
                            ? 'primary'
                            : message.role === 'assistant'
                            ? 'secondary'
                            : 'default'
                        }
                      />
                      {message.role !== 'system' && (
                        <Box>
                          <Tooltip title={t('copy', { ns: 'common' })}>
                            <IconButton
                              size="small"
                              onClick={() => handleCopyMessage(message.content)}
                            >
                              <CopyIcon fontSize="small" />
                            </IconButton>
                          </Tooltip>
                          {message.role === 'user' && (
                            <Tooltip title={t('delete', { ns: 'common' })}>
                              <IconButton
                                size="small"
                                onClick={() => handleDeleteMessage(message.id)}
                              >
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          )}
                        </Box>
                      )}
                    </Box>
                    <Box sx={{ mt: 1 }}>
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </Box>
                    
                    {/* Citations */}
                    {message.citations && message.citations.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          {t('citations', { ns: 'legal-research' })}:
                        </Typography>
                        <List dense>
                          {message.citations.map((citation, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <GavelIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={citation.source}
                                secondary={citation.text}
                              />
                              {citation.url && (
                                <Tooltip title={t('openSource', { ns: 'legal-research' })}>
                                  <IconButton
                                    size="small"
                                    component="a"
                                    href={citation.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <BookIcon fontSize="small" />
                                  </IconButton>
                                </Tooltip>
                              )}
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                    
                    {/* Relevant Statutes */}
                    {message.relevantStatutes && message.relevantStatutes.length > 0 && (
                      <Box sx={{ mt: 2 }}>
                        <Typography variant="subtitle2" gutterBottom>
                          {t('relevantStatutes', { ns: 'legal-research' })}:
                        </Typography>
                        <List dense>
                          {message.relevantStatutes.map((statute, index) => (
                            <ListItem key={index}>
                              <ListItemIcon>
                                <DocumentIcon fontSize="small" />
                              </ListItemIcon>
                              <ListItemText
                                primary={`${statute.name} - ${statute.section}`}
                                secondary={statute.text}
                              />
                            </ListItem>
                          ))}
                        </List>
                      </Box>
                    )}
                  </>
                )}
              </CardContent>
            </Card>
            <Typography variant="caption" sx={{ mt: 0.5, alignSelf: 'flex-end' }}>
              {message.timestamp.toLocaleTimeString()}
            </Typography>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>
      
      {/* Input */}
      <Paper
        elevation={3}
        sx={{
          p: 2,
          borderTop: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder={t('askLegalQuestion', { ns: 'legal-research' }) || 'Ask a legal question...'}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            disabled={loading}
            InputProps={{
              endAdornment: (
                <IconButton>
                  <AttachFileIcon />
                </IconButton>
              ),
            }}
          />
          <Button
            variant="contained"
            color="primary"
            endIcon={<SendIcon />}
            onClick={handleSendMessage}
            disabled={!input.trim() || loading}
          >
            {t('send', { ns: 'common' })}
          </Button>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
          {t('aiDisclaimer', { ns: 'legal-research' })}
        </Typography>
      </Paper>
    </Box>
  );
};

export default AILegalAssistant;