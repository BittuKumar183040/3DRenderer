import { configureStore } from '@reduxjs/toolkit'
import vtksReducer from './src/components/renderer/Studio/vtk/components/redux/vtksSlice'

export const store = configureStore({
  reducer: {
    vtksData:vtksReducer,
  },
})