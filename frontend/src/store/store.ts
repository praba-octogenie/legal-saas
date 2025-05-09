import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import uiReducer from './slices/uiSlice';
import clientReducer from './slices/clientSlice';
import caseReducer from './slices/caseSlice';
import documentReducer from './slices/documentSlice';
import courtProceedingReducer from './slices/courtProceedingSlice';
import legalResearchReducer from './slices/legalResearchSlice';
import billingReducer from './slices/billingSlice';
import communicationReducer from './slices/communicationSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ui: uiReducer,
    client: clientReducer,
    case: caseReducer,
    document: documentReducer,
    courtProceeding: courtProceedingReducer,
    legalResearch: legalResearchReducer,
    billing: billingReducer,
    communication: communicationReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // Ignore these action types
        ignoredActions: ['auth/login/fulfilled', 'auth/refreshToken/fulfilled'],
        // Ignore these field paths in all actions
        ignoredActionPaths: ['payload.headers', 'meta.arg.headers'],
        // Ignore these paths in the state
        ignoredPaths: ['auth.user', 'auth.token'],
      },
    }),
});

// Define the RootState type with proper typing for each slice
export interface RootState {
  auth: ReturnType<typeof authReducer>;
  ui: ReturnType<typeof uiReducer>;
  client: ReturnType<typeof clientReducer>;
  case: ReturnType<typeof caseReducer>;
  document: ReturnType<typeof documentReducer>;
  courtProceeding: ReturnType<typeof courtProceedingReducer>;
  legalResearch: ReturnType<typeof legalResearchReducer>;
  billing: ReturnType<typeof billingReducer>;
  communication: ReturnType<typeof communicationReducer>;
}

// Infer the `AppDispatch` type from the store itself
export type AppDispatch = typeof store.dispatch;