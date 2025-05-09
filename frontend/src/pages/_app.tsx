import { useEffect } from 'react';
import type { AppProps } from 'next/app';
import { ThemeProvider, CssBaseline } from '@mui/material';
import { Provider } from 'react-redux';
import { appWithTranslation } from 'next-i18next';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { store } from '@/store/store';
import theme from '@/styles/theme';
import '@/styles/globals.css';
import Layout from '@/components/layout/Layout';
import AuthGuard from '@/components/auth/AuthGuard';

function MyApp({ Component, pageProps, router }: AppProps) {
  // Check if the page requires authentication
  const isAuthPage = router.pathname.startsWith('/auth');

  useEffect(() => {
    // Remove the server-side injected CSS
    const jssStyles = document.querySelector('#jss-server-side');
    if (jssStyles) {
      jssStyles.parentElement?.removeChild(jssStyles);
    }
  }, []);

  return (
    <Provider store={store}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <ToastContainer position="top-right" autoClose={5000} />
        {isAuthPage ? (
          <Component {...pageProps} />
        ) : (
          <AuthGuard>
            <Layout>
              <Component {...pageProps} />
            </Layout>
          </AuthGuard>
        )}
      </ThemeProvider>
    </Provider>
  );
}

export default appWithTranslation(MyApp);