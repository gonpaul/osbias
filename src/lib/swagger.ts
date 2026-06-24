import swaggerJSDoc from 'swagger-jsdoc';

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
        url: (process.env.NEXT_PUBLIC_BASE_URL || '') + '/api',
        description: process.env.NODE_ENV === 'production' ? 'Production server' : 'Development server',
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
  apis: ['./src/app/api/**/*.ts'],
};

// Generate once at startup, cache for production
let cachedSpec: object | null = null;

export function getSwaggerSpec() {
  if (cachedSpec) return cachedSpec;
  cachedSpec = swaggerJSDoc(options);
  return cachedSpec;
}