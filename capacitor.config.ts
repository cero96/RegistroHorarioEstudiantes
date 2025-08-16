// capacitor.config.ts
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.marcogomez.asistencias',
  appName: 'Registro de Asistencias',
  webDir: 'dist', // Carpeta de producción de tu app web
  server: {
    androidScheme: 'https', // Cambiar a 'http' si tu API no usa HTTPS
    allowNavigation: [
      'puce.estudioika.com', // tu API
      'localhost',           // para pruebas locales si las necesitas
      '10.0.2.2',            // IP del emulador Android para localhost
    ],
  },
};

export default config;
