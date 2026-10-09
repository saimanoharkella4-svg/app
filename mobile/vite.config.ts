import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      'react-native': 'react-native-web',
      'react-native-svg': path.resolve(__dirname, 'src/theme/svgWebAdapter.tsx'),
      'react-native-safe-area-context': path.resolve(__dirname, 'src/theme/safeAreaWebAdapter.tsx')
    }
  },
  server: {
    port: 3000,
    host: '127.0.0.1'
  }
});
