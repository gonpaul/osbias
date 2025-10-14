import swaggerJSDoc from 'swagger-jsdoc';
import { getServerApiBase } from './config/api';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Osbias AI Journal API',
      version: '0.1.0',
      description: 'API for cognitive journaling with ai copilot, built-in and user-defined frameworks',
    },
    servers: [
      {
        url: getServerApiBase() + '/api',
        description: 'Development server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
  },
  apis: ['./src/app/api/**/*.ts'], // paths to files containing OpenAPI definitions
};

export const swaggerSpec = swaggerJSDoc(options);