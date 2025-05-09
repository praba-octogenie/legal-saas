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
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  CheckCircle as CheckCircleIcon,
  PendingActions as PendingIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

// Types
interface Invoice {
  id: string;
  invoiceNumber: string;
  clientId: string;
  clientName: string;
  caseId: string | null;
  caseTitle: string | null;
  amount: number;
  tax: number;
  totalAmount: number;
  status: string;
  dueDate: string;
  issueDate: string;
  paymentDate: string | null;
  description: string;
}

const BillingPage = () => {
  const { t } = useTranslation(['common', 'dashboard']);
  const router = useRouter();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchInvoices = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/billing/invoices');
        setInvoices(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching invoices:', err);
        setError(t('errorFetchingData'));
      } finally {
        setLoading(false);
      }
    };

    fetchInvoices();
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

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      invoice.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (invoice.caseTitle && invoice.caseTitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      invoice.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleViewInvoice = (id: string) => {
    router.push(`/billing/${id}`);
  };

  const handleEditInvoice = (id: string) => {
    router.push(`/billing/${id}/edit`);
  };

  const handleDeleteInvoice = (id: string) => {
    // In a real app, this would be an API call
    // await axios.delete(`/api/billing/invoices/${id}`);
    setInvoices(invoices.filter((invoice) => invoice.id !== id));
  };

  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'paid':
        return <CheckCircleIcon color="success" />;
      case 'pending':
        return <PendingIcon color="warning" />;
      case 'overdue':
        return <MoneyIcon color="error" />;
      case 'cancelled':
        return <CancelIcon color="action" />;
      default:
        return <ReceiptIcon />;
    }
  };

  const getStatusChip = (status: string) => {
    switch (status) {
      case 'paid':
        return <Chip label={t('paid')} color="success" size="small" />;
      case 'pending':
        return <Chip label={t('pending')} color="warning" size="small" />;
      case 'overdue':
        return <Chip label={t('overdue')} color="error" size="small" />;
      case 'cancelled':
        return <Chip label={t('cancelled')} color="default" size="small" />;
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
          {t('billing')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => router.push('/billing/new')}
        >
          {t('newInvoice')}
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
                <TableCell>{t('invoiceNumber')}</TableCell>
                <TableCell>{t('client')}</TableCell>
                <TableCell>{t('case')}</TableCell>
                <TableCell>{t('issueDate')}</TableCell>
                <TableCell>{t('dueDate')}</TableCell>
                <TableCell>{t('amount')}</TableCell>
                <TableCell>{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((invoice) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={invoice.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getStatusChip(invoice.status)}
                      </Box>
                    </TableCell>
                    <TableCell>{invoice.invoiceNumber}</TableCell>
                    <TableCell>{invoice.clientName}</TableCell>
                    <TableCell>{invoice.caseTitle || '-'}</TableCell>
                    <TableCell>{format(new Date(invoice.issueDate), 'PPP')}</TableCell>
                    <TableCell>{format(new Date(invoice.dueDate), 'PPP')}</TableCell>
                    <TableCell>{formatCurrency(invoice.totalAmount)}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewInvoice(invoice.id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleEditInvoice(invoice.id)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteInvoice(invoice.id)}
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
          count={filteredInvoices.length}
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

export default BillingPage;