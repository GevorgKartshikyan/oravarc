import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // base: '/Gevorg/booking-calendar-test/',
  build: {
    sourcemap: false,
  },
})
