import { CssBaseline, Box, Skeleton } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { Suspense } from 'react';
import { Provider } from 'react-redux';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { PersistGate } from 'redux-persist/integration/react';

import PrivateRouteWrapper from './components/custom/PrivateRouteWrapper';
import SessionProvider from './components/custom/SessionProvider';
import { routes as appRoutes } from './routes';

import './styles.css';
import { persistor, store } from './store';
import customTheme from './theme';

const enabledRoutes = appRoutes.filter((route) => route.enabled);

function App() {
  return (
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ThemeProvider theme={customTheme}>
          <CssBaseline />
          <SessionProvider>
            <BrowserRouter future={{ v7_startTransition: true }}>
              <Box
                display="flex"
                component="main"
                sx={{ flexGrow: 1, width: '100%', height: '100vh' }}
              >
                <Suspense fallback={<Skeleton variant="rectangular" width="100%" height="100%" />}>
                  <Routes>
                    {enabledRoutes.map((route) => (
                      <Route
                        key={route.key}
                        path={route.path}
                        element={
                          <PrivateRouteWrapper permissions={route.permissions}>
                            <route.component />
                          </PrivateRouteWrapper>
                        }
                      />
                    ))}
                  </Routes>
                </Suspense>
              </Box>
            </BrowserRouter>
          </SessionProvider>
        </ThemeProvider>
      </PersistGate>
    </Provider>
  );
}

export default App;
