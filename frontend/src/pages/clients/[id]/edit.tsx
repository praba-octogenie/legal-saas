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
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  Divider,
  FormControlLabel,
  Switch,
  CircularProgress,
  Tabs,
  Tab,
  Card,
  CardContent,
  IconButton,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  Delete as DeleteIcon,
  VerifiedUser as VerifiedIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
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

interface ClientFormData {
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
  };
  notes?: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

const CLIENT_CATEGORIES = [
  'regular',
  'vip',
  'corporate',
  'government',
  'pro-bono',
  'one-time',
];

const ID_TYPES = [
  'Aadhaar Card',
  'PAN Card',
  'Passport',
  'Driving License',
  'Voter ID',
  'GST Registration',
  'Company Registration',
];

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

const EditClientPage = () => {
  const { t } = useTranslation(['clients', 'common']);
  const router = useRouter();
  const { id } = router.query;
  
  // State
  const [client, setClient] = useState<Client | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tabValue, setTabValue] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  
  // Fetch client data
  useEffect(() => {
    if (id) {
      fetchClientData();
    }
  }, [id]);
  
  const fetchClientData = async () => {
    try {
      setLoading(true);
      const response = await axios.get<Client>(`/api/clients/${id}`);
      setClient(response.data);
      setError(null);
    } catch (err) {
      console.error('Error fetching client data:', err);
      setError(t('errorFetchingClientData', { ns: 'clients' }));
    } finally {
      setLoading(false);
    }
  };
  
  // Form validation schema
  const validationSchema = Yup.object({
    name: Yup.string().required(t('nameRequired', { ns: 'clients' })),
    email: Yup.string().email(t('invalidEmail', { ns: 'clients' })).required(t('emailRequired', { ns: 'clients' })),
    phone: Yup.string().required(t('phoneRequired', { ns: 'clients' })),
    type: Yup.string().oneOf(['individual', 'corporate']).required(t('typeRequired', { ns: 'clients' })),
    category: Yup.string().required(t('categoryRequired', { ns: 'clients' })),
    contactInfo: Yup.object({
      address: Yup.object({
        street: Yup.string().required(t('streetRequired', { ns: 'clients' })),
        city: Yup.string().required(t('cityRequired', { ns: 'clients' })),
        state: Yup.string().required(t('stateRequired', { ns: 'clients' })),
        postalCode: Yup.string().required(t('postalCodeRequired', { ns: 'clients' })),
        country: Yup.string().required(t('countryRequired', { ns: 'clients' })),
      }),
      alternatePhone: Yup.string().optional(),
      alternateEmail: Yup.string().email(t('invalidEmail', { ns: 'clients' })).optional(),
    }),
    kycDetails: Yup.object({
      idType: Yup.string().optional(),
      idNumber: Yup.string().optional(),
    }),
  });
  
  // Form initialization
  const formik = useFormik<ClientFormData>({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      type: 'individual',
      category: 'regular',
      kycVerified: false,
      contactInfo: {
        address: {
          street: '',
          city: '',
          state: '',
          postalCode: '',
          country: 'India',
        },
        alternatePhone: '',
        alternateEmail: '',
      },
      kycDetails: {
        idType: '',
        idNumber: '',
      },
      notes: '',
    },
    validationSchema,
    onSubmit: async (values) => {
      await handleSubmit(values);
    },
    enableReinitialize: true,
  });
  
  // Update form values when client data is loaded
  useEffect(() => {
    if (client) {
      formik.setValues({
        name: client.name,
        email: client.email,
        phone: client.phone,
        type: client.type,
        category: client.category,
        kycVerified: client.kycVerified,
        contactInfo: {
          address: {
            street: client.contactInfo.address.street,
            city: client.contactInfo.address.city,
            state: client.contactInfo.address.state,
            postalCode: client.contactInfo.address.postalCode,
            country: client.contactInfo.address.country,
          },
          alternatePhone: client.contactInfo.alternatePhone || '',
          alternateEmail: client.contactInfo.alternateEmail || '',
        },
        kycDetails: {
          idType: client.kycDetails.idType || '',
          idNumber: client.kycDetails.idNumber || '',
        },
        notes: client.notes || '',
      });
    }
  }, [client]);
  
  // Handlers
  const handleSubmit = async (values: ClientFormData) => {
    try {
      setSaving(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('client', JSON.stringify(values));
      
      // Append files if any
      files.forEach((file) => {
        formData.append('documents', file);
      });
      
      // Submit form
      await axios.put(`/api/clients/${id}`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success(t('clientUpdatedSuccess', { ns: 'clients' }));
      router.push(`/clients/${id}`);
    } catch (err) {
      console.error('Error updating client:', err);
      toast.error(t('clientUpdateError', { ns: 'clients' }));
    } finally {
      setSaving(false);
    }
  };
  
  const handleCancel = () => {
    router.push(`/clients/${id}`);
  };
  
  const handleTabChange = (_: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };
  
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files) {
      const newFiles = Array.from(event.target.files);
      setFiles((prevFiles) => [...prevFiles, ...newFiles]);
    }
  };
  
  const handleRemoveFile = (index: number) => {
    setFiles((prevFiles) => prevFiles.filter((_, i) => i !== index));
  };
  
  const handleVerifyKyc = async () => {
    try {
      setSaving(true);
      await axios.post(`/api/clients/${id}/verify-kyc`);
      toast.success(t('kycVerifiedSuccess', { ns: 'clients' }));
      fetchClientData();
    } catch (err) {
      console.error('Error verifying KYC:', err);
      toast.error(t('kycVerificationError', { ns: 'clients' }));
    } finally {
      setSaving(false);
    }
  };
  
  const handleDeleteDocument = async (documentId: string) => {
    if (confirm(t('deleteDocumentConfirmation', { ns: 'clients' }))) {
      try {
        await axios.delete(`/api/documents/${documentId}`);
        toast.success(t('documentDeletedSuccess', { ns: 'clients' }));
        fetchClientData();
      } catch (err) {
        console.error('Error deleting document:', err);
        toast.error(t('documentDeleteError', { ns: 'clients' }));
      }
    }
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
        <Typography variant="h4">{t('editClient', { ns: 'clients' })}</Typography>
      </Box>
      
      <Paper sx={{ mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="client edit tabs">
          <Tab label={t('basicInformation', { ns: 'clients' })} id="client-tab-0" aria-controls="client-tabpanel-0" />
          <Tab label={t('contactInformation', { ns: 'clients' })} id="client-tab-1" aria-controls="client-tabpanel-1" />
          <Tab label={t('kycDetails', { ns: 'clients' })} id="client-tab-2" aria-controls="client-tabpanel-2" />
        </Tabs>
        
        <form onSubmit={formik.handleSubmit}>
          <TabPanel value={tabValue} index={0}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="name"
                  name="name"
                  label={t('name', { ns: 'clients' })}
                  value={formik.values.name}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.name && Boolean(formik.errors.name)}
                  helperText={formik.touched.name && formik.errors.name}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="email"
                  name="email"
                  label={t('email', { ns: 'clients' })}
                  value={formik.values.email}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.email && Boolean(formik.errors.email)}
                  helperText={formik.touched.email && formik.errors.email}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="phone"
                  name="phone"
                  label={t('phone', { ns: 'clients' })}
                  value={formik.values.phone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={formik.touched.phone && Boolean(formik.errors.phone)}
                  helperText={formik.touched.phone && formik.errors.phone}
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={formik.touched.type && Boolean(formik.errors.type)}>
                  <InputLabel id="type-label">{t('clientType', { ns: 'clients' })}</InputLabel>
                  <Select
                    labelId="type-label"
                    id="type"
                    name="type"
                    value={formik.values.type}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label={t('clientType', { ns: 'clients' })}
                  >
                    <MenuItem value="individual">{t('individual', { ns: 'clients' })}</MenuItem>
                    <MenuItem value="corporate">{t('corporate', { ns: 'clients' })}</MenuItem>
                  </Select>
                  {formik.touched.type && formik.errors.type && (
                    <FormHelperText>{formik.errors.type}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth error={formik.touched.category && Boolean(formik.errors.category)}>
                  <InputLabel id="category-label">{t('category', { ns: 'clients' })}</InputLabel>
                  <Select
                    labelId="category-label"
                    id="category"
                    name="category"
                    value={formik.values.category}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    label={t('category', { ns: 'clients' })}
                  >
                    {CLIENT_CATEGORIES.map((category) => (
                      <MenuItem key={category} value={category}>
                        {t(category, { ns: 'clients' })}
                      </MenuItem>
                    ))}
                  </Select>
                  {formik.touched.category && formik.errors.category && (
                    <FormHelperText>{formik.errors.category}</FormHelperText>
                  )}
                </FormControl>
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="notes"
                  name="notes"
                  label={t('notes', { ns: 'clients' })}
                  multiline
                  rows={4}
                  value={formik.values.notes}
                  onChange={formik.handleChange}
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  id="contactInfo.address.street"
                  name="contactInfo.address.street"
                  label={t('street', { ns: 'clients' })}
                  value={formik.values.contactInfo.address.street}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.contactInfo?.address?.street &&
                    Boolean(formik.errors.contactInfo?.address?.street)
                  }
                  helperText={
                    formik.touched.contactInfo?.address?.street &&
                    formik.errors.contactInfo?.address?.street
                  }
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="contactInfo.address.city"
                  name="contactInfo.address.city"
                  label={t('city', { ns: 'clients' })}
                  value={formik.values.contactInfo.address.city}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.contactInfo?.address?.city &&
                    Boolean(formik.errors.contactInfo?.address?.city)
                  }
                  helperText={
                    formik.touched.contactInfo?.address?.city &&
                    formik.errors.contactInfo?.address?.city
                  }
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="contactInfo.address.state"
                  name="contactInfo.address.state"
                  label={t('state', { ns: 'clients' })}
                  value={formik.values.contactInfo.address.state}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.contactInfo?.address?.state &&
                    Boolean(formik.errors.contactInfo?.address?.state)
                  }
                  helperText={
                    formik.touched.contactInfo?.address?.state &&
                    formik.errors.contactInfo?.address?.state
                  }
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="contactInfo.address.postalCode"
                  name="contactInfo.address.postalCode"
                  label={t('postalCode', { ns: 'clients' })}
                  value={formik.values.contactInfo.address.postalCode}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.contactInfo?.address?.postalCode &&
                    Boolean(formik.errors.contactInfo?.address?.postalCode)
                  }
                  helperText={
                    formik.touched.contactInfo?.address?.postalCode &&
                    formik.errors.contactInfo?.address?.postalCode
                  }
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="contactInfo.address.country"
                  name="contactInfo.address.country"
                  label={t('country', { ns: 'clients' })}
                  value={formik.values.contactInfo.address.country}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.contactInfo?.address?.country &&
                    Boolean(formik.errors.contactInfo?.address?.country)
                  }
                  helperText={
                    formik.touched.contactInfo?.address?.country &&
                    formik.errors.contactInfo?.address?.country
                  }
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  {t('additionalContactInfo', { ns: 'clients' })}
                </Typography>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="contactInfo.alternatePhone"
                  name="contactInfo.alternatePhone"
                  label={t('alternatePhone', { ns: 'clients' })}
                  value={formik.values.contactInfo.alternatePhone}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.contactInfo?.alternatePhone &&
                    Boolean(formik.errors.contactInfo?.alternatePhone)
                  }
                  helperText={
                    formik.touched.contactInfo?.alternatePhone &&
                    formik.errors.contactInfo?.alternatePhone
                  }
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="contactInfo.alternateEmail"
                  name="contactInfo.alternateEmail"
                  label={t('alternateEmail', { ns: 'clients' })}
                  value={formik.values.contactInfo.alternateEmail}
                  onChange={formik.handleChange}
                  onBlur={formik.handleBlur}
                  error={
                    formik.touched.contactInfo?.alternateEmail &&
                    Boolean(formik.errors.contactInfo?.alternateEmail)
                  }
                  helperText={
                    formik.touched.contactInfo?.alternateEmail &&
                    formik.errors.contactInfo?.alternateEmail
                  }
                />
              </Grid>
            </Grid>
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">{t('kycStatus', { ns: 'clients' })}</Typography>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formik.values.kycVerified}
                        onChange={(e) => {
                          if (!formik.values.kycVerified) {
                            handleVerifyKyc();
                          } else {
                            formik.setFieldValue('kycVerified', e.target.checked);
                          }
                        }}
                        disabled={saving}
                      />
                    }
                    label={formik.values.kycVerified ? t('verified', { ns: 'clients' }) : t('pending', { ns: 'clients' })}
                  />
                </Box>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel id="idType-label">{t('idType', { ns: 'clients' })}</InputLabel>
                  <Select
                    labelId="idType-label"
                    id="kycDetails.idType"
                    name="kycDetails.idType"
                    value={formik.values.kycDetails.idType}
                    onChange={formik.handleChange}
                    label={t('idType', { ns: 'clients' })}
                  >
                    {ID_TYPES.map((type) => (
                      <MenuItem key={type} value={type}>
                        {type}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  id="kycDetails.idNumber"
                  name="kycDetails.idNumber"
                  label={t('idNumber', { ns: 'clients' })}
                  value={formik.values.kycDetails.idNumber}
                  onChange={formik.handleChange}
                />
              </Grid>
              
              <Grid item xs={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle1" gutterBottom>
                  {t('documents', { ns: 'clients' })}
                </Typography>
                
                {client.kycDetails.documents && client.kycDetails.documents.length > 0 ? (
                  <Grid container spacing={2} sx={{ mb: 2 }}>
                    {client.kycDetails.documents.map((document) => (
                      <Grid item xs={12} sm={6} md={4} key={document.id}>
                        <Card>
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                              <Typography variant="subtitle1">{document.name}</Typography>
                              <IconButton
                                size="small"
                                color="error"
                                onClick={() => handleDeleteDocument(document.id)}
                              >
                                <DeleteIcon />
                              </IconButton>
                            </Box>
                            <Typography variant="body2" color="text.secondary">
                              {document.type}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {t('uploaded', { ns: 'clients' })}: {format(new Date(document.uploadedAt), 'PPP')}
                            </Typography>
                            <Button
                              variant="outlined"
                              size="small"
                              sx={{ mt: 1 }}
                              href={document.url}
                              target="_blank"
                            >
                              {t('view', { ns: 'common' })}
                            </Button>
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                ) : (
                  <Typography color="text.secondary" sx={{ mb: 2 }}>
                    {t('noDocuments', { ns: 'clients' })}
                  </Typography>
                )}
                
                <Button
                  variant="outlined"
                  component="label"
                >
                  {t('uploadNewDocuments', { ns: 'clients' })}
                  <input
                    type="file"
                    hidden
                    multiple
                    onChange={handleFileChange}
                  />
                </Button>
                
                {files.length > 0 && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="subtitle2" gutterBottom>
                      {t('selectedFiles', { ns: 'clients' })}:
                    </Typography>
                    <Grid container spacing={1}>
                      {files.map((file, index) => (
                        <Grid item xs={12} key={index}>
                          <Card variant="outlined">
                            <CardContent sx={{ py: 1, '&:last-child': { pb: 1 } }}>
                              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <Typography variant="body2">
                                  {file.name} ({(file.size / 1024).toFixed(2)} KB)
                                </Typography>
                                <Button
                                  size="small"
                                  color="error"
                                  onClick={() => handleRemoveFile(index)}
                                >
                                  {t('remove', { ns: 'common' })}
                                </Button>
                              </Box>
                            </CardContent>
                          </Card>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                )}
              </Grid>
              
              {client.kycVerified && (
                <Grid item xs={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="subtitle1" gutterBottom>
                    {t('verificationDetails', { ns: 'clients' })}
                  </Typography>
                  <Grid container spacing={2}>
                    {client.kycDetails.verificationDate && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>{t('verificationDate', { ns: 'clients' })}:</strong>{' '}
                          {format(new Date(client.kycDetails.verificationDate), 'PPP')}
                        </Typography>
                      </Grid>
                    )}
                    {client.kycDetails.verifiedBy && (
                      <Grid item xs={12} sm={6}>
                        <Typography variant="body2">
                          <strong>{t('verifiedBy', { ns: 'clients' })}:</strong> {client.kycDetails.verifiedBy}
                        </Typography>
                      </Grid>
                    )}
                  </Grid>
                </Grid>
              )}
            </Grid>
          </TabPanel>
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', p: 3 }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
            >
              {t('cancel', { ns: 'common' })}
            </Button>
            
            <Button
              type="submit"
              variant="contained"
              color="primary"
              startIcon={<SaveIcon />}
              disabled={saving}
            >
              {saving && <CircularProgress size={24} sx={{ mr: 1 }} />}
              {t('save', { ns: 'common' })}
            </Button>
          </Box>
        </form>
      </Paper>
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

export default EditClientPage;