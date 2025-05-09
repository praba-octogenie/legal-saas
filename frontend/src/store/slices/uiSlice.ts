import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { RootState } from '../store';

// Define types
interface UiState {
  sidebarOpen: boolean;
  darkMode: boolean;
  language: string;
  loading: {
    [key: string]: boolean;
  };
}

// Define initial state
const initialState: UiState = {
  sidebarOpen: true,
  darkMode: false,
  language: 'en',
  loading: {},
};

// Create slice
const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleDarkMode: (state) => {
      state.darkMode = !state.darkMode;
      localStorage.setItem('darkMode', state.darkMode.toString());
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      state.darkMode = action.payload;
      localStorage.setItem('darkMode', state.darkMode.toString());
    },
    setLanguage: (state, action: PayloadAction<string>) => {
      state.language = action.payload;
      localStorage.setItem('language', action.payload);
    },
    setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      const { key, isLoading } = action.payload;
      state.loading[key] = isLoading;
    },
  },
});

// Export actions and reducer
export const {
  toggleSidebar,
  setSidebarOpen,
  toggleDarkMode,
  setDarkMode,
  setLanguage,
  setLoading,
} = uiSlice.actions;

export const selectUi = (state: RootState) => state.ui;
export const selectSidebarOpen = (state: RootState) => state.ui.sidebarOpen;
export const selectDarkMode = (state: RootState) => state.ui.darkMode;
export const selectLanguage = (state: RootState) => state.ui.language;
export const selectLoading = (key: string) => (state: RootState) => state.ui.loading[key] || false;

export default uiSlice.reducer;