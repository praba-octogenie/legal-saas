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
  Download as DownloadIcon,
  Description as DescriptionIcon,
  PictureAsPdf as PdfIcon,
  Image as ImageIcon,
  InsertDriveFile as FileIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { format } from 'date-fns';

// Types
interface Document {
  id: string;
  title: string;
  fileName: string;
  fileType: string;
  fileSize: number;
  caseId: string | null;
  caseName: string | null;
  clientId: string | null;
  clientName: string | null;
  uploadedBy: string;
  uploadedAt: string;
}

const DocumentsPage = () => {
  const { t } = useTranslation(['common', 'dashboard']);
  const router = useRouter();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/documents');
        setDocuments(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching documents:', err);
        setError(t('errorFetchingData'));
      } finally {
        setLoading(false);
      }
    };

    fetchDocuments();
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

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.fileName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.caseName && doc.caseName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (doc.clientName && doc.clientName.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleViewDocument = (id: string) => {
    router.push(`/documents/${id}`);
  };

  const handleEditDocument = (id: string) => {
    router.push(`/documents/${id}/edit`);
  };

  const handleDeleteDocument = (id: string) => {
    // In a real app, this would be an API call
    // await axios.delete(`/api/documents/${id}`);
    setDocuments(documents.filter((doc) => doc.id !== id));
  };

  const handleDownloadDocument = (id: string) => {
    // In a real app, this would trigger a download
    console.log(`Downloading document ${id}`);
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileType: string) => {
    switch (fileType) {
      case 'pdf':
        return <PdfIcon />;
      case 'image':
        return <ImageIcon />;
      case 'document':
        return <DescriptionIcon />;
      default:
        return <FileIcon />;
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
          {t('documents')}
        </Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={() => router.push('/documents/upload')}
        >
          {t('uploadDocument')}
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
                <TableCell>{t('type')}</TableCell>
                <TableCell>{t('title')}</TableCell>
                <TableCell>{t('fileName')}</TableCell>
                <TableCell>{t('fileSize')}</TableCell>
                <TableCell>{t('case')}</TableCell>
                <TableCell>{t('client')}</TableCell>
                <TableCell>{t('uploadedAt')}</TableCell>
                <TableCell>{t('actions')}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredDocuments
                .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                .map((doc) => (
                  <TableRow hover role="checkbox" tabIndex={-1} key={doc.id}>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        {getFileIcon(doc.fileType)}
                      </Box>
                    </TableCell>
                    <TableCell>{doc.title}</TableCell>
                    <TableCell>{doc.fileName}</TableCell>
                    <TableCell>{formatFileSize(doc.fileSize)}</TableCell>
                    <TableCell>{doc.caseName || '-'}</TableCell>
                    <TableCell>{doc.clientName || '-'}</TableCell>
                    <TableCell>{format(new Date(doc.uploadedAt), 'PPP')}</TableCell>
                    <TableCell>
                      <IconButton
                        size="small"
                        color="primary"
                        onClick={() => handleViewDocument(doc.id)}
                      >
                        <VisibilityIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="secondary"
                        onClick={() => handleEditDocument(doc.id)}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="info"
                        onClick={() => handleDownloadDocument(doc.id)}
                      >
                        <DownloadIcon />
                      </IconButton>
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteDocument(doc.id)}
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
          count={filteredDocuments.length}
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

export default DocumentsPage;