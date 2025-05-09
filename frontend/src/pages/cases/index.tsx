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
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

// Types
interface Case {
  id: string;
  title: string;
  caseNumber: string;
  court: string;
  clientName: string;
  status: string;
  nextHearingDate: string | null;
  createdAt: string;
}

const CasesPage = () => {
  const { t } = useTranslation(['common', 'dashboard']);
  const router = useRouter();
  const [cases, setCases] = useState<Case[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchCases = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/cases');
        setCases(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching cases:', err);
        setError(t('errorFetchingData'));
      } finally {
        setLoading(false);
      }
    };

    fetchCases();
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

  const filteredCases = cases.filter(
    (caseItem) =>
      caseItem.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.caseNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      caseItem.clientName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewCase = (id: string) => {
    router.push(`/cases/${id}`);
  };

  const handleEditCase = (id: string) => {
    router.push(`/cases/${id}/edit`);
  };

  const handleDeleteCase = (id: string) => {
    // In a real app, this would be an API call
    // await axios.delete(`/api/cases/${id}`);
    setCases(cases.filter((caseItem) => caseItem.id !== id));
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
          {t('cases')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => router.push('/cases/new')}
        >
          {t('newCase')}
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
                <TableCell>{t('caseNumber')}</TableCell>
                <TableCell>{t('title')}</TableCell>
                <TableCell>{t('client')}</TableCell>
                <TableCell>{t('court')}</TableCell>
                <TableCell>{t('status')}</TableCell>
                <TableCell>{t('nextHearing')}</TableCell>
                <TableCell>{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCases
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((caseItem) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={caseItem.id}>
                    <TableCell>{caseItem.caseNumber}</TableCell>
                    <TableCell>{caseItem.title}</TableCell>
                    <TableCell>{caseItem.clientName}</TableCell>
                    <TableCell>{caseItem.court}</TableCell>
                    <TableCell>
                      <Chip
                        label={caseItem.status}
                        color={
                          caseItem.status === 'active'
                            ? 'success'
                            : caseItem.status === 'pending'
                            ? 'warning'
                            : 'default'
                        }
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {caseItem.nextHearingDate
                        ? format(new Date(caseItem.nextHearingDate), 'PPP')
                        : '-'}
                    </TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewCase(caseItem.id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleEditCase(caseItem.id)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteCase(caseItem.id)}
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
          count={filteredCases.length}
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

export default CasesPage;