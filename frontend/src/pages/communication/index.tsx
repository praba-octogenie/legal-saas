import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetServerSideProps } from 'next';
import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Container,
  Grid,
  IconButton,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  Tabs,
  Tab,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  Message as MessageIcon,
  Chat as ChatIcon,
  VideoCall as VideoCallIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

// Types
interface Communication {
  id: string;
  type: string;
  subject: string;
  content: string;
  clientId: string;
  clientName: string;
  caseId: string | null;
  caseTitle: string | null;
  date: string;
  status: string;
  direction: string;
  attachments: number;
}

const CommunicationPage = () => {
  const { t } = useTranslation(['common', 'dashboard']);
  const router = useRouter();
  const [communications, setCommunications] = useState<Communication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [tabValue, setTabValue] = useState(0);

  useEffect(() => {
    const fetchCommunications = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/communication');
        setCommunications(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching communications:', err);
        setError(t('errorFetchingData'));
      } finally {
        setLoading(false);
      }
    };

    fetchCommunications();
  }, [t]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearch = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    setPage(0);
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const filteredCommunications = communications
    .filter(
      (comm) =>
        (tabValue === 0 || // All
          (tabValue === 1 && comm.type === 'email') || // Email
          (tabValue === 2 && comm.type === 'phone') || // Phone
          (tabValue === 3 && comm.type === 'sms')) && // SMS
        (comm.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comm.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
          comm.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (comm.caseTitle && comm.caseTitle.toLowerCase().includes(searchTerm.toLowerCase())))
    );

  const handleViewCommunication = (id: string) => {
    router.push(`/communication/${id}`);
  };

  const handleEditCommunication = (id: string) => {
    router.push(`/communication/${id}/edit`);
  };

  const handleDeleteCommunication = (id: string) => {
    // In a real app, this would be an API call
    // await axios.delete(`/api/communications/${id}`);
    setCommunications(communications.filter((comm) => comm.id !== id));
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email':
        return <EmailIcon color="primary" />;
      case 'phone':
        return <PhoneIcon color="success" />;
      case 'sms':
        return <MessageIcon color="info" />;
      case 'chat':
        return <ChatIcon color="secondary" />;
      case 'video':
        return <VideoCallIcon color="warning" />;
      default:
        return <MessageIcon />;
    }
  };

  const getDirectionChip = (direction: string) => {
    return direction === 'incoming' ? (
      <Chip label={t('incoming')} color="info" size="small" />
    ) : (
      <Chip label={t('outgoing')} color="secondary" size="small" />
    );
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Typography color="error" variant="h6">
          {error}
        </Typography>
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4" gutterBottom>
          {t('communication')}
        </Typography>
        <Box>
          <Button
            variant="contained"
            color="primary"
            startIcon={<EmailIcon />}
            onClick={() => router.push('/communication/email/new')}
            sx={{ mr: 1 }}
          >
            {t('newEmail')}
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<PhoneIcon />}
            onClick={() => router.push('/communication/phone/new')}
          >
            {t('logCall')}
          </Button>
        </Box>
      </Box>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label={t('search')}
                variant="outlined"
                value={searchTerm}
                onChange={handleSearch}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ mr: 1 }} />,
                }}
              />
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          variant="fullWidth"
        >
          <Tab label={t('all')} />
          <Tab label={t('email')} />
          <Tab label={t('phone')} />
          <Tab label={t('sms')} />
        </Tabs>
      </Paper>

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell>{t('type')}</TableCell>
                <TableCell>{t('direction')}</TableCell>
                <TableCell>{t('subject')}</TableCell>
                <TableCell>{t('client')}</TableCell>
                <TableCell>{t('case')}</TableCell>
                <TableCell>{t('date')}</TableCell>
                <TableCell>{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCommunications
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((comm) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={comm.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getTypeIcon(comm.type)}
                        <Typography variant="body2" sx={{ ml: 1 }}>
                          {comm.type.charAt(0).toUpperCase() + comm.type.slice(1)}
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>{getDirectionChip(comm.direction)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {comm.subject}
                      </Typography>
                    </TableCell>
                    <TableCell>{comm.clientName}</TableCell>
                    <TableCell>{comm.caseTitle || '-'}</TableCell>
                    <TableCell>{format(new Date(comm.date), 'PPP p')}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewCommunication(comm.id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleEditCommunication(comm.id)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteCommunication(comm.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          rowsPerPageOptions={[10, 25, 100]}
          component="div"
          count={filteredCommunications.length}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Paper>
    </Container>
  );
};

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common', 'dashboard'])),
    },
  };
};

export default CommunicationPage;