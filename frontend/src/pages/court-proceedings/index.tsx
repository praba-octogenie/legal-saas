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
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Visibility as VisibilityIcon,
  Event as EventIcon,
  EventAvailable as EventAvailableIcon,
  EventBusy as EventBusyIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

// Types
interface CourtProceeding {
  id: string;
  caseId: string;
  caseTitle: string;
  court: string;
  date: string;
  time: string;
  purpose: string;
  status: string;
  judge: string;
  notes: string;
}

const CourtProceedingsPage = () => {
  const { t } = useTranslation(['common', 'dashboard']);
  const router = useRouter();
  const [proceedings, setProceedings] = useState<CourtProceeding[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchProceedings = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/court-proceedings');
        setProceedings(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching court proceedings:', err);
        setError(t('errorFetchingData'));
      } finally {
        setLoading(false);
      }
    };

    fetchProceedings();
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

  const filteredProceedings = proceedings.filter(
    (proceeding) =>
      proceeding.caseTitle.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proceeding.court.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proceeding.purpose.toLowerCase().includes(searchTerm.toLowerCase()) ||
      proceeding.judge.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewProceeding = (id: string) => {
    router.push(`/court-proceedings/${id}`);
  };

  const handleEditProceeding = (id: string) => {
    router.push(`/court-proceedings/${id}/edit`);
  };

  const handleDeleteProceeding = (id: string) => {
    // In a real app, this would be an API call
    // await axios.delete(`/api/court-proceedings/${id}`);
    setProceedings(proceedings.filter((proceeding) => proceeding.id !== id));
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <EventIcon color="primary" />;
      case 'completed':
        return <EventAvailableIcon color="success" />;
      case 'cancelled':
        return <EventBusyIcon color="error" />;
      default:
        return <EventIcon />;
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'scheduled':
        return <Chip label={t('scheduled')} color="primary" size="small" />;
      case 'completed':
        return <Chip label={t('completed')} color="success" size="small" />;
      case 'cancelled':
        return <Chip label={t('cancelled')} color="error" size="small" />;
      default:
        return <Chip label={status} size="small" />;
    }
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
          {t('courtProceedings')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => router.push('/court-proceedings/new')}
        >
          {t('newProceeding')}
        </Button>
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

      <Paper sx={{ width: '100%', overflow: 'hidden' }}>
        <TableContainer sx={{ maxHeight: 440 }}>
          <Table stickyHeader aria-label="sticky table">
            <TableHead>
              <TableRow>
                <TableCell>{t('status')}</TableCell>
                <TableCell>{t('date')}</TableCell>
                <TableCell>{t('time')}</TableCell>
                <TableCell>{t('case')}</TableCell>
                <TableCell>{t('court')}</TableCell>
                <TableCell>{t('purpose')}</TableCell>
                <TableCell>{t('judge')}</TableCell>
                <TableCell>{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredProceedings
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((proceeding) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={proceeding.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getStatusChip(proceeding.status)}
                      </Box>
                    </TableCell>
                    <TableCell>{format(new Date(proceeding.date), 'PPP')}</TableCell>
                    <TableCell>{proceeding.time}</TableCell>
                    <TableCell>{proceeding.caseTitle}</TableCell>
                    <TableCell>{proceeding.court}</TableCell>
                    <TableCell>{proceeding.purpose}</TableCell>
                    <TableCell>{proceeding.judge}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewProceeding(proceeding.id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleEditProceeding(proceeding.id)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteProceeding(proceeding.id)}
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
          count={filteredProceedings.length}
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

export default CourtProceedingsPage;