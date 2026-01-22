import { configureStore } from '@reduxjs/toolkit'
import vtksReducer from './src/components/renderer/VTK/components/redux/vtksSlice'

export const store = configureStore({
  reducer: {
    vtksData:vtksReducer,
  },
})