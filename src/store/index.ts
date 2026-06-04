import { configureStore } from '@reduxjs/toolkit';
import { hospitalApi } from './slices/hospitalApi';

export const store = configureStore({
  reducer: {
    [hospitalApi.reducerPath]: hospitalApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(hospitalApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
