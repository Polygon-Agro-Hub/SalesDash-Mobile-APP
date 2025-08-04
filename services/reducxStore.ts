import { configureStore } from '@reduxjs/toolkit';

import inputReducer from '../store/navSlice'; // New slice for input state

const store = configureStore({
  reducer: {
   
    input: inputReducer, // Add the input reducer
  },
});

export default store;
export type RootState = ReturnType<typeof store.getState>; 
export type AppDispatch = typeof store.dispatch;