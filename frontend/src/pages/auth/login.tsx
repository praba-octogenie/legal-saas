import { useState, useEffect } from 'react';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import { GetStaticProps } from 'next';
import {
  Avatar,
  Button,
  TextField,
  FormControlLabel,
  Checkbox,
  Link,
  Paper,
  Box,
  Grid,
  Typography,
  InputAdornment,
  IconButton,
  Alert,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  SelectChangeEvent,
} from '@mui/material';
import {
  LockOutlined as LockOutlinedIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import { useFormik } from 'formik';
import * as Yup from 'yup';

import { login } from '@/store/slices/authSlice';
import { setLanguage } from '@/store/slices/uiSlice';
import { getTenantSubdomain, setTenantSubdomain } from '@/utils/auth';
import { AppDispatch } from '@/store/store';

const Login = () => {
  const { t, i18n } = useTranslation('auth');
  const router = useRouter();
  const dispatch = useDispatch<AppDispatch>();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [language, setLanguageState] = useState(i18n.language || 'en');
  const [subdomain, setSubdomainState] = useState(getTenantSubdomain() || 'demo');
  const [isLocalhost, setIsLocalhost] = useState(false);
  
  // Check if running on localhost after component mount
  useEffect(() => {
    setIsLocalhost(window.location.hostname === 'localhost');
  }, []);
  
  // Check for query parameters
  useEffect(() => {
    if (router.query.registered === 'true') {
      setSuccess(t('registrationSuccessful') as string);
    }
  }, [router.query, t]);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email(t('invalidEmail') as string)
      .required(t('emailRequired') as string),
    password: Yup.string()
      .min(6, t('passwordMinLength') as string)
      .required(t('passwordRequired') as string),
  });

  const formik = useFormik({
    initialValues: {
      email: '',
      password: '',
      remember: false,
    },
    validationSchema,
    onSubmit: async (values) => {
      try {
        setError(null);
        
        // Set tenant subdomain for local development
        setTenantSubdomain(subdomain);
        
        // Dispatch login action
        await dispatch(login({
          email: values.email,
          password: values.password,
        })).unwrap();
        
        // Redirect to dashboard on success
        router.push('/dashboard');
      } catch (err: any) {
        setError(err.message || t('loginFailed'));
      }
    },
  });

  const handleTogglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLanguageChange = (event: SelectChangeEvent) => {
    const newLang = event.target.value;
    setLanguageState(newLang);
    i18n.changeLanguage(newLang);
    dispatch(setLanguage(newLang));
  };

  const handleSubdomainChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSubdomainState(event.target.value);
  };

  return (
    <Grid container component="main" sx={{ height: '100vh' }}>
      <Grid
        item
        xs={false}
        sm={4}
        md={7}
        sx={{
          backgroundImage: 'url(/images/login-bg.jpg)',
          backgroundRepeat: 'no-repeat',
          backgroundColor: (t) =>
            t.palette.mode === 'light' ? t.palette.grey[50] : t.palette.grey[900],
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      />
      <Grid item xs={12} sm={8} md={5} component={Paper} elevation={6} square>
        <Box
          sx={{
            my: 8,
            mx: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <LockOutlinedIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            {t('signIn')}
          </Typography>
          
          <Box sx={{ mt: 2, width: '100%', display: 'flex', justifyContent: 'flex-end' }}>
            <FormControl variant="outlined" size="small" sx={{ width: 120 }}>
              <InputLabel id="language-select-label">{t('language')}</InputLabel>
              <Select
                labelId="language-select-label"
                id="language-select"
                value={language}
                onChange={handleLanguageChange}
                label={t('language')}
              >
                <MenuItem value="en">English</MenuItem>
                <MenuItem value="hi">हिन्दी</MenuItem>
                <MenuItem value="bn">বাংলা</MenuItem>
                <MenuItem value="te">తెలుగు</MenuItem>
                <MenuItem value="ta">தமிழ்</MenuItem>
                <MenuItem value="mr">मराठी</MenuItem>
                <MenuItem value="gu">ગુજરાતી</MenuItem>
                <MenuItem value="kn">ಕನ್ನಡ</MenuItem>
                <MenuItem value="ml">മലയാളം</MenuItem>
                <MenuItem value="pa">ਪੰਜਾਬੀ</MenuItem>
                <MenuItem value="ur">اردو</MenuItem>
              </Select>
            </FormControl>
          </Box>
          
          {error && (
            <Alert severity="error" sx={{ mt: 2, width: '100%' }}>
              {error}
            </Alert>
          )}
          
          {success && (
            <Alert severity="success" sx={{ mt: 2, width: '100%' }}>
              {success}
            </Alert>
          )}
          
          <Box component="form" noValidate onSubmit={formik.handleSubmit} sx={{ mt: 1, width: '100%' }}>
            {isLocalhost && (
              <TextField
                margin="normal"
                fullWidth
                id="subdomain"
                label={t('tenantSubdomain')}
                name="subdomain"
                value={subdomain}
                onChange={handleSubdomainChange}
                helperText={t('subdomainHelp')}
              />
            )}
            
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label={t('email')}
              name="email"
              autoComplete="email"
              autoFocus
              value={formik.values.email}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.email && Boolean(formik.errors.email)}
              helperText={formik.touched.email && formik.errors.email}
            />
            
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label={t('password')}
              type={showPassword ? 'text' : 'password'}
              id="password"
              autoComplete="current-password"
              value={formik.values.password}
              onChange={formik.handleChange}
              onBlur={formik.handleBlur}
              error={formik.touched.password && Boolean(formik.errors.password)}
              helperText={formik.touched.password && formik.errors.password}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="toggle password visibility"
                      onClick={handleTogglePasswordVisibility}
                      edge="end"
                    >
                      {showPassword ? <VisibilityOff /> : <Visibility />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            
            <FormControlLabel
              control={
                <Checkbox
                  value="remember"
                  color="primary"
                  checked={formik.values.remember}
                  onChange={formik.handleChange}
                  name="remember"
                />
              }
              label={t('rememberMe')}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
              disabled={formik.isSubmitting}
            >
              {formik.isSubmitting ? t('signingIn') : t('signIn')}
            </Button>
            
            <Grid container>
              <Grid item xs>
                <Link href="/auth/forgot-password" variant="body2">
                  {t('forgotPassword')}
                </Link>
              </Grid>
              <Grid item>
                <Link href="/auth/register" variant="body2">
                  {t('noAccount')}
                </Link>
              </Grid>
            </Grid>
            
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 5 }}>
              &copy; {new Date().getFullYear()} Legal CRM
            </Typography>
          </Box>
        </Box>
      </Grid>
    </Grid>
  );
};

export const getStaticProps: GetStaticProps = async ({ locale }) => {
  return {
    props: {
      ...(await serverSideTranslations(locale || 'en', ['common', 'auth'])),
    },
  };
};

export default Login;