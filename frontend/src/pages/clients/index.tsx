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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  CircularProgress,
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import api from '@/utils/api';
import { toast } from 'react-toastify';

// Types
interface Client {
  id: string;
  name: string;
  email: string;
  phone: string;
  type: 'individual' | 'corporate';
  category: string;
  kycVerified: boolean;
  createdAt: string;
}

interface ClientsResponse {
  clients: Client[];
  total: number;
}

const ClientsPage = () => {
  const { t } = useTranslation('clients');
  const router = useRouter();
  
  // State
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalClients, setTotalClients] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<string | null>(null);
  
  // Fetch clients
  useEffect(() => {
    fetchClients();
  }, [page, rowsPerPage, searchQuery]);
  
  const fetchClients = async () => {
    try {
      setLoading(true);
      const response = await api.get<ClientsResponse>('/clients', {
        params: {
          limit: rowsPerPage,
          offset: page * rowsPerPage,
          search: searchQuery || undefined,
        },
      });
      
      setClients(response.data.clients);
      setTotalClients(response.data.total);
      setError(null);
    } catch (err) {
      console.error('Error fetching clients:', err);
      setError(t('errorFetchingClients'));
    } finally {
      setLoading(false);
    }
  };
  
  // Handlers
  const handleChangePage = (_: unknown, newPage: number) => {
    setPage(newPage);
  };
  
  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };
  
  const handleAddClient = () => {
    router.push('/clients/new');
  };
  
  const handleViewClient = (id: string) => {
    router.push(`/clients/${id}`);
  };
  
  const handleEditClient = (id: string) => {
    router.push(`/clients/${id}/edit`);
  };
  
  const handleDeleteClick = (id: string) => {
    setClientToDelete(id);
    setDeleteDialogOpen(true);
  };
  
  const handleDeleteConfirm = async () => {
    if (!clientToDelete) return;
    
    try {
      await api.delete(`/clients/${clientToDelete}`);
      toast.success(t('clientDeletedSuccess'));
      fetchClients();
    } catch (err) {
      console.error('Error deleting client:', err);
      toast.error(t('clientDeleteError'));
    } finally {
      setDeleteDialogOpen(false);
      setClientToDelete(null);
    }
  };
  
  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setClientToDelete(null);
  };
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">{t('clients')}</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleAddClient}
        >
          {t('addClient')}
        </Button>
      </Box>
      
      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ p: 2 }}>
          <TextField
            fullWidth
            variant="outlined"
            placeholder={t('searchClients') || 'Search clients...'}
            value={searchQuery}
            onChange={handleSearchChange}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <Tooltip title={t('advancedFilters')}>
                    <IconButton>
                      <FilterIcon />
                    </IconButton>
                  </Tooltip>
                </InputAdornment>
              ),
            }}
          />
        </Box>
        
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Box sx={{ p: 3 }}>
            <Typography color="error">{error}</Typography>
          </Box>
        ) : (
          <>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>{t('name')}</TableCell>
                    <TableCell>{t('email')}</TableCell>
                    <TableCell>{t('phone')}</TableCell>
                    <TableCell>{t('type')}</TableCell>
                    <TableCell>{t('category')}</TableCell>
                    <TableCell>{t('kycStatus')}</TableCell>
                    <TableCell>{t('actions')}</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {clients.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} align="center">
                        {t('noClientsFound')}
                      </TableCell>
                    </TableRow>
                  ) : (
                    clients.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>{client.name}</TableCell>
                        <TableCell>{client.email}</TableCell>
                        <TableCell>{client.phone}</TableCell>
                        <TableCell>
                          {client.type === 'individual' ? t('individual') : t('corporate')}
                        </TableCell>
                        <TableCell>{client.category}</TableCell>
                        <TableCell>
                          <Chip
                            label={client.kycVerified ? t('verified') : t('pending')}
                            color={client.kycVerified ? 'success' : 'warning'}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title={t('view')}>
                            <IconButton
                              size="small"
                              onClick={() => handleViewClient(client.id)}
                            >
                              <ViewIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('edit')}>
                            <IconButton
                              size="small"
                              onClick={() => handleEditClient(client.id)}
                            >
                              <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={t('delete')}>
                            <IconButton
                              size="small"
                              onClick={() => handleDeleteClick(client.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
            
            <TablePagination
              rowsPerPageOptions={[5, 10, 25, 50]}
              component="div"
              count={totalClients}
              rowsPerPage={rowsPerPage}
              page={page}
              onPageChange={handleChangePage}
              onRowsPerPageChange={handleChangeRowsPerPage}
              labelRowsPerPage={t('rowsPerPage')}
            />
          </>
        )}
      </Paper>
      
      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
      >
        <DialogTitle>{t('confirmDelete')}</DialogTitle>
        <DialogContent>
          <DialogContentText>
            {t('deleteClientConfirmation')}
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>{t('cancel')}</Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            {t('delete')}
          </Button>
        </DialogActions>
      </Dialog>
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

export default ClientsPage;