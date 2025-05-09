import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSideProps } from 'next';
import {
  Box,
  Typography,
  Button,
  Paper,
  Grid,
  Tabs,
  Tab,
  Divider,
  Chip,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Card,
  CardContent,
  CardHeader,
  CircularProgress,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Business as BusinessIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  VerifiedUser as VerifiedIcon,
  GppBad as UnverifiedIcon,
  Gavel as CaseIcon,
  Description as DocumentIcon,
  Receipt as InvoiceIcon,
  Message as MessageIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

// Types
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'individual' | 'corporate';
  category: string;
  kycVerified: boolean;
  contactInfo: {
    address: {
      street: string;
      city: string;
      state: string;
      postalCode: string;
      country: string;
    };
    alternatePhone?: string;
    alternateEmail?: string;
  };
  kycDetails: {
    idType?: string;
    idNumber?: string;
    verificationDate?: string;
    verifiedBy?: string;
    documents?: {
      id: string;
      name: string;
      url: string;
      type: string;
      uploadedAt: string;
    }[];
  };
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface Case {
  id: string;
  title: string;
  caseNumber: string;
  court: string;
  status: string;
  nextHearingDate?: string;
}

interface Document {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
}

interface Invoice {
  id: string;
  invoiceNumber: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  status: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const TabPanel = (props: TabPanelProps) => {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`client-tabpanel-${index}`}
      aria-labelledby={`client-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
};

const ClientDetailPage = () => {
  const { t } = useTranslation(['clients', 'common']);
  const router = useRouter();
  const { id } = router.query;
  
  // State
  const [client, setClient] = useState<Client | null>(null);
  const [cases, setCases] = useState<Case[]>([]);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  
  // Fetch client data
  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);
  
  const fetchClientData = async () => {
    try {
      setLoading(true);
      
      // Fetch client details
      const clientResponse = await axios.get<Client>(`/api/clients/${id}`);
      setClient(clientResponse.data);
      
      // Fetch related cases
      const casesResponse = await axios.get<{ cases: Case[]; total: number }>(`/api/cases`, {
        params: { clientId: id, limit: 5 },
      });
      setCases(casesResponse.data.cases);
      
      // Fetch related documents
      const documentsResponse = await axios.get<{ documents: Document[]; total: number }>(`/api/documents`, {
        params: { clientId: id, limit: 5 },
      });
      setDocuments(documentsResponse.data.documents);
      
      // Fetch related invoices
      const invoicesResponse = await axios.get<{ invoices: Invoice[]; total: number }>(`/api/billing/invoices`, {
        params: { clientId: id, limit: 5 },
      });
      setInvoices(invoicesResponse.data.invoices);
      
      setError(null);
    } catch (err) {
      console.error('Error fetching client data:', err);
      setError(t('errorFetchingClientData', { ns: 'clients' }));
    } finally {
      setLoading(false);
    }
  };
  
  // Handlers
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleEdit = () => {
    router.push(`/clients/${id}/edit`);
  };
  
  const handleDelete = async () => {
    if (confirm(t('deleteClientConfirmation', { ns: 'clients' }))) {
      try {
        await axios.delete(`/api/clients/${id}`);
        toast.success(t('clientDeletedSuccess', { ns: 'clients' }));
        router.push('/clients');
      } catch (err) {
        console.error('Error deleting client:', err);
        toast.error(t('clientDeleteError', { ns: 'clients' }));
      }
    }
  };
  
  const handleNewCase = () => {
    router.push(`/cases/new?clientId=${id}`);
  };
  
  const handleNewDocument = () => {
    router.push(`/documents/new?clientId=${id}`);
  };
  
  const handleNewInvoice = () => {
    router.push(`/billing/invoices/new?clientId=${id}`);
  };
  
  const handleNewMessage = () => {
    router.push(`/communication?clientId=${id}`);
  };
  
  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
        <CircularProgress />
      </Box>
    );
  }
  
  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error">{error}</Typography>
      </Box>
    );
  }
  
  if (!client) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography>{t('clientNotFound', { ns: 'clients' })}</Typography>
      </Box>
    );
  }
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Avatar
            sx={{
              bgcolor: client.type === 'individual' ? 'primary.main' : 'secondary.main',
              width: 56,
              height: 56,
              mr: 2,
            }}
          >
            {client.type === 'individual' ? <PersonIcon /> : <BusinessIcon />}
          </Avatar>
          <Box>
            <Typography variant="h4">{client.name}</Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
              <Chip
                label={client.type === 'individual' ? t('individual', { ns: 'clients' }) : t('corporate', { ns: 'clients' })}
                size="small"
                color="primary"
                sx={{ mr: 1 }}
              />
              <Chip
                label={client.category}
                size="small"
                color="secondary"
                sx={{ mr: 1 }}
              />
              <Chip
                icon={client.kycVerified ? <VerifiedIcon /> : <UnverifiedIcon />}
                label={client.kycVerified ? t('verified', { ns: 'clients' }) : t('pending', { ns: 'clients' })}
                color={client.kycVerified ? 'success' : 'warning'}
                size="small"
              />
            </Box>
          </Box>
        </Box>
        <Box>
          <Tooltip title={t('edit', { ns: 'common' })}>
            <IconButton onClick={handleEdit}>
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title={t('delete', { ns: 'common' })}>
            <IconButton onClick={handleDelete}>
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
      
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('contactInformation', { ns: 'clients' })}
            </Typography>
            <List dense>
              <ListItem>
                <ListItemIcon>
                  <EmailIcon />
                </ListItemIcon>
                <ListItemText primary={t('email', { ns: 'clients' })} secondary={client.email} />
              </ListItem>
              <ListItem>
                <ListItemIcon>
                  <PhoneIcon />
                </ListItemIcon>
                <ListItemText primary={t('phone', { ns: 'clients' })} secondary={client.phone} />
              </ListItem>
              {client.contactInfo.alternatePhone && (
                <ListItem>
                  <ListItemIcon>
                    <PhoneIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('alternatePhone', { ns: 'clients' })} secondary={client.contactInfo.alternatePhone} />
                </ListItem>
              )}
              {client.contactInfo.alternateEmail && (
                <ListItem>
                  <ListItemIcon>
                    <EmailIcon />
                  </ListItemIcon>
                  <ListItemText primary={t('alternateEmail', { ns: 'clients' })} secondary={client.contactInfo.alternateEmail} />
                </ListItem>
              )}
              <ListItem>
                <ListItemIcon>
                  <LocationIcon />
                </ListItemIcon>
                <ListItemText
                  primary={t('address', { ns: 'clients' })}
                  secondary={`${client.contactInfo.address.street}, ${client.contactInfo.address.city}, ${client.contactInfo.address.state}, ${client.contactInfo.address.postalCode}, ${client.contactInfo.address.country}`}
                />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              {t('kycInformation', { ns: 'clients' })}
            </Typography>
            {client.kycVerified ? (
              <List dense>
                {client.kycDetails.idType && (
                  <ListItem>
                    <ListItemText primary={t('idType', { ns: 'clients' })} secondary={client.kycDetails.idType} />
                  </ListItem>
                )}
                {client.kycDetails.idNumber && (
                  <ListItem>
                    <ListItemText primary={t('idNumber', { ns: 'clients' })} secondary={client.kycDetails.idNumber} />
                  </ListItem>
                )}
                {client.kycDetails.verificationDate && (
                  <ListItem>
                    <ListItemText
                      primary={t('verificationDate', { ns: 'clients' })}
                      secondary={format(new Date(client.kycDetails.verificationDate), 'PPP')}
                    />
                  </ListItem>
                )}
                {client.kycDetails.verifiedBy && (
                  <ListItem>
                    <ListItemText primary={t('verifiedBy', { ns: 'clients' })} secondary={client.kycDetails.verifiedBy} />
                  </ListItem>
                )}
              </List>
            ) : (
              <Box sx={{ p: 2, textAlign: 'center' }}>
                <Typography color="warning.main">
                  {t('kycPending', { ns: 'clients' })}
                </Typography>
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{ mt: 1 }}
                  onClick={handleEdit}
                >
                  {t('completeKyc', { ns: 'clients' })}
                </Button>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>
      
      <Box sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="client tabs">
            <Tab label={t('cases', { ns: 'clients' })} id="client-tab-0" aria-controls="client-tabpanel-0" />
            <Tab label={t('documents', { ns: 'clients' })} id="client-tab-1" aria-controls="client-tabpanel-1" />
            <Tab label={t('invoices', { ns: 'clients' })} id="client-tab-2" aria-controls="client-tabpanel-2" />
            <Tab label={t('notes', { ns: 'clients' })} id="client-tab-3" aria-controls="client-tabpanel-3" />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">{t('recentCases', { ns: 'clients' })}</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<CaseIcon />}
              onClick={handleNewCase}
            >
              {t('newCase', { ns: 'clients' })}
            </Button>
          </Box>
          
          {cases.length === 0 ? (
            <Typography>{t('noCases', { ns: 'clients' })}</Typography>
          ) : (
            <Grid container spacing={2}>
              {cases.map((caseItem) => (
                <Grid item xs={12} key={caseItem.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{caseItem.title}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {caseItem.caseNumber} - {caseItem.court}
                      </Typography>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Chip
                          label={caseItem.status}
                          size="small"
                          color={
                            caseItem.status === 'active'
                              ? 'success'
                              : caseItem.status === 'pending'
                              ? 'warning'
                              : 'default'
                          }
                        />
                        {caseItem.nextHearingDate && (
                          <Typography variant="body2">
                            {t('nextHearing', { ns: 'clients' })}: {format(new Date(caseItem.nextHearingDate), 'PPP')}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">{t('recentDocuments', { ns: 'clients' })}</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<DocumentIcon />}
              onClick={handleNewDocument}
            >
              {t('uploadDocument', { ns: 'clients' })}
            </Button>
          </Box>
          
          {documents.length === 0 ? (
            <Typography>{t('noDocuments', { ns: 'clients' })}</Typography>
          ) : (
            <Grid container spacing={2}>
              {documents.map((document) => (
                <Grid item xs={12} sm={6} md={4} key={document.id}>
                  <Card>
                    <CardContent>
                      <Typography variant="h6">{document.name}</Typography>
                      <Typography variant="body2" color="text.secondary">
                        {document.type} - {(document.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        {t('uploaded', { ns: 'clients' })}: {format(new Date(document.uploadedAt), 'PPP')}
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">{t('recentInvoices', { ns: 'clients' })}</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<InvoiceIcon />}
              onClick={handleNewInvoice}
            >
              {t('createInvoice', { ns: 'clients' })}
            </Button>
          </Box>
          
          {invoices.length === 0 ? (
            <Typography>{t('noInvoices', { ns: 'clients' })}</Typography>
          ) : (
            <Grid container spacing={2}>
              {invoices.map((invoice) => (
                <Grid item xs={12} key={invoice.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                        <Typography variant="h6">{invoice.invoiceNumber}</Typography>
                        <Typography variant="h6">₹{invoice.amount.toLocaleString()}</Typography>
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                        <Typography variant="body2" color="text.secondary">
                          {t('issued', { ns: 'clients' })}: {format(new Date(invoice.issueDate), 'PPP')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {t('due', { ns: 'clients' })}: {format(new Date(invoice.dueDate), 'PPP')}
                        </Typography>
                      </Box>
                      <Box sx={{ mt: 1 }}>
                        <Chip
                          label={invoice.status}
                          size="small"
                          color={
                            invoice.status === 'paid'
                              ? 'success'
                              : invoice.status === 'overdue'
                              ? 'error'
                              : invoice.status === 'partially_paid'
                              ? 'warning'
                              : 'default'
                          }
                        />
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="h6">{t('notes', { ns: 'clients' })}</Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<MessageIcon />}
              onClick={handleNewMessage}
            >
              {t('sendMessage', { ns: 'clients' })}
            </Button>
          </Box>
          
          <Paper sx={{ p: 2 }}>
            {client.notes ? (
              <Typography>{client.notes}</Typography>
            ) : (
              <Typography color="text.secondary">{t('noNotes', { ns: 'clients' })}</Typography>
            )}
          </Paper>
        </TabPanel>
      </Box>
    </Box>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common', 'clients'])),
    },
  };
};

export default ClientDetailPage;