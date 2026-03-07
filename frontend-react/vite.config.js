import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/v1': 'http://localhost:3000',
            '/v2': 'http://localhost:3000',
            '/v3': 'http://localhost:3000'
        }
    }
});
