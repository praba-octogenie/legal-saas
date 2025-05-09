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
  Stepper,
  Step,
  StepLabel,
  Card,
  CardContent,
} from '@mui/material';
import {
  Save as SaveIcon,
  Cancel as CancelIcon,
  ArrowBack as BackIcon,
  ArrowForward as NextIcon,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import axios from 'axios';
import { toast } from 'react-toastify';

// Types
interface ClientFormData {
  name: string;
  email: string;
  phone: string;
  type: 'individual' | 'corporate';
  category: string;
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
    documents?: File[];
  };
  notes?: string;
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

const NewClientPage = () => {
  const { t } = useTranslation(['clients', 'common']);
  const router = useRouter();
  
  // State
  const [loading, setLoading] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [files, setFiles] = useState<File[]>([]);
  
  // Form validation schema
  const validationSchema = [
    // Step 1: Basic Information
    Yup.object({
      name: Yup.string().required(t('nameRequired', { ns: 'clients' })),
      email: Yup.string().email(t('invalidEmail', { ns: 'clients' })).required(t('emailRequired', { ns: 'clients' })),
      phone: Yup.string().required(t('phoneRequired', { ns: 'clients' })),
      type: Yup.string().oneOf(['individual', 'corporate']).required(t('typeRequired', { ns: 'clients' })),
      category: Yup.string().required(t('categoryRequired', { ns: 'clients' })),
    }),
    
    // Step 2: Contact Information
    Yup.object({
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
    }),
    
    // Step 3: KYC Details
    Yup.object({
      kycDetails: Yup.object({
        idType: Yup.string().optional(),
        idNumber: Yup.string().optional(),
      }),
    }),
  ];
  
  // Form initialization
  const formik = useFormik<ClientFormData>({
    initialValues: {
      name: '',
      email: '',
      phone: '',
      type: 'individual',
      category: 'regular',
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
        documents: [],
      },
      notes: '',
    },
    validationSchema: validationSchema[activeStep],
    onSubmit: async (values) => {
      await handleSubmit(values);
    },
  });
  
  // Handlers
  const handleSubmit = async (values: ClientFormData) => {
    try {
      setLoading(true);
      
      // Create FormData for file upload
      const formData = new FormData();
      formData.append('client', JSON.stringify(values));
      
      // Append files if any
      files.forEach((file) => {
        formData.append('documents', file);
      });
      
      // Submit form
      const response = await axios.post('/api/clients', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      
      toast.success(t('clientCreatedSuccess', { ns: 'clients' }));
      router.push(`/clients/${response.data.id}`);
    } catch (err) {
      console.error('Error creating client:', err);
      toast.error(t('clientCreateError', { ns: 'clients' }));
    } finally {
      setLoading(false);
    }
  };
  
  const handleNext = () => {
    if (activeStep === validationSchema.length - 1) {
      formik.handleSubmit();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };
  
  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };
  
  const handleCancel = () => {
    router.push('/clients');
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
  
  // Step content
  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
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
          </Grid>
        );
      
      case 1:
        return (
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
        );
      
      case 2:
        return (
          <Grid container spacing={3}>
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
              <Typography variant="subtitle1" gutterBottom>
                {t('uploadDocuments', { ns: 'clients' })}
              </Typography>
              <Button
                variant="outlined"
                component="label"
                sx={{ mt: 1 }}
              >
                {t('chooseFiles', { ns: 'clients' })}
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
            
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
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
        );
      
      default:
        return null;
    }
  };
  
  const steps = [
    t('basicInformation', { ns: 'clients' }),
    t('contactInformation', { ns: 'clients' }),
    t('kycDetails', { ns: 'clients' }),
  ];
  
  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">{t('addNewClient', { ns: 'clients' })}</Typography>
      </Box>
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        
        <form onSubmit={formik.handleSubmit}>
          {getStepContent(activeStep)}
          
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 3 }}>
            <Button
              variant="outlined"
              startIcon={<CancelIcon />}
              onClick={handleCancel}
            >
              {t('cancel', { ns: 'common' })}
            </Button>
            
            <Box>
              {activeStep > 0 && (
                <Button
                  variant="outlined"
                  startIcon={<BackIcon />}
                  onClick={handleBack}
                  sx={{ mr: 1 }}
                >
                  {t('back', { ns: 'common' })}
                </Button>
              )}
              
              <Button
                variant="contained"
                color="primary"
                endIcon={activeStep === steps.length - 1 ? <SaveIcon /> : <NextIcon />}
                onClick={handleNext}
                disabled={loading}
              >
                {loading && <CircularProgress size={24} sx={{ mr: 1 }} />}
                {activeStep === steps.length - 1
                  ? t('save', { ns: 'common' })
                  : t('next', { ns: 'common' })}
              </Button>
            </Box>
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

export default NewClientPage;