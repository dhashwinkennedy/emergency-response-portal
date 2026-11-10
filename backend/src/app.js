import express from 'express';
import session from 'express-session';
import MongoStore from 'connect-mongo';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pinoHttp from 'pino-http';
import swaggerUi from 'swagger-ui-express';
import { env } from './config/env.js';
import routes from './routes.js';
import { loadUser, csrf, notFound, errors } from './middleware/index.js';
import { databaseReady } from './config/database.js';
import { corsOptions } from './utils/origin.js';

export const sessionMiddleware = session({
  name: env.sessionName,
  secret: env.sessionSecret,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({ mongoUrl: env.mongoUri, ttl: Math.floor(env.sessionAge / 1000) }),
  cookie: {
    httpOnly: true,
    secure: env.cookieSecure,
    sameSite: env.cookieSameSite,
    maxAge: env.sessionAge,
  },
});

export function createApp() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(pinoHttp());
  app.use(helmet());
  app.use(cors(corsOptions));
  app.options('*', cors(corsOptions));
  app.use(express.json({ limit: '100kb' }));
  app.use(sessionMiddleware);
  app.use(loadUser);
  app.use(csrf);
  app.use(rateLimit({ windowMs: 15 * 60e3, limit: 500, standardHeaders: true, legacyHeaders: false }));

  app.get('/healthz', (_q, res) => res.json({ success: true, data: { status: 'ok' } }));
  app.get('/readyz', (_q, res) =>
    res.status(databaseReady() ? 200 : 503).json({
      success: databaseReady(),
      data: { database: databaseReady() ? 'ready' : 'not ready' },
    })
  );

  const swagger = {
    openapi: '3.0.3',
    info: { title: 'Emergency Response API', version: '1.0.0' },
    servers: [{ url: env.prefix }],
    paths: {
      '/incidents': {
        post: {
          summary: 'Submit a normal incident with optional private evidence',
          requestBody: {
            required: true,
            content: {
              'multipart/form-data': {
                schema: {
                  type: 'object',
                  required: ['title', 'description', 'category', 'location', 'peopleAffected', 'severity'],
                  properties: {
                    title: { type: 'string' },
                    description: { type: 'string' },
                    category: { type: 'string' },
                    subcategory: { type: 'string' },
                    customCategory: { type: 'string' },
                    location: { type: 'string', description: 'JSON location object' },
                    peopleAffected: { type: 'integer' },
                    severity: { type: 'string' },
                    contactInfo: { type: 'string', description: 'JSON contact object' },
                    attachments: { type: 'array', items: { type: 'string', format: 'binary' } },
                  },
                },
              },
            },
          },
          responses: { 201: { description: 'Incident created' } },
        },
      },
      '/incidents/{incidentId}/attachments/{attachmentId}': {
        get: {
          summary: 'Download a private incident attachment',
          parameters: [
            { name: 'incidentId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'attachmentId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            200: { description: 'Attachment download' },
            403: { description: 'Forbidden' },
            404: { description: 'Not found' },
          },
        },
      },
    },
  };

  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swagger));
  app.use(env.prefix, routes);
  app.use(notFound);
  app.use(errors);
  return app;
}
