const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const cookieParser = require('cookie-parser');
const env = require('./config/env');
const errorHandler = require('./middlewares/error.middleware');
const AppError = require('./utils/appError');

// Module routes
const healthRoutes = require('./modules/health/health.routes');
const authRoutes = require('./modules/auth/auth.routes');
const usersRoutes = require('./modules/users/users.routes');
const orgsRoutes = require('./modules/organizations/organizations.routes');
const lecturersRoutes = require('./modules/lecturers/lecturers.routes');
const achievementsRoutes = require('./modules/achievements/achievements.routes');
const evidencesRoutes = require('./modules/evidences/evidences.routes');
const approvalsRoutes = require('./modules/approvals/approvals.routes');
const awardsRoutes = require('./modules/awards/awards.routes');
const reportsRoutes = require('./modules/reports/reports.routes');
const notificationsRoutes = require('./modules/notifications/notifications.routes');
const auditRoutes = require('./modules/audit/audit.routes');

const app = express();

// Security & Parsing Middlewares
app.use(helmet());
app.use(
  cors({
    origin: env.CORS_ORIGIN,
    credentials: true,
  })
);
app.use(cookieParser());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

if (env.NODE_ENV !== 'test') {
  app.use(morgan(env.NODE_ENV === 'development' ? 'dev' : 'combined'));
}

// Mount REST API routes
const apiRouter = express.Router();
apiRouter.use('/', healthRoutes);
apiRouter.use('/auth', authRoutes);
apiRouter.use('/users', usersRoutes);
apiRouter.use('/units', orgsRoutes);
apiRouter.use('/lecturers', lecturersRoutes);
apiRouter.use('/achievements', achievementsRoutes);
apiRouter.use('/evidences', evidencesRoutes);
apiRouter.use('/approvals', approvalsRoutes);
apiRouter.use('/awards', awardsRoutes);
apiRouter.use('/award-records', awardsRoutes);
apiRouter.use('/reports', reportsRoutes);
apiRouter.use('/notifications', notificationsRoutes);
apiRouter.use('/audit-logs', auditRoutes);

app.use(env.API_PREFIX, apiRouter);

// Root path friendly message
app.get('/', (req, res) => {
  res.json({
    name: 'Digital Achievement and Award Management API',
    version: '1.0.0',
    status: 'Running',
    docs: `${env.API_PREFIX}/health`,
  });
});

// Handle undefined routes
app.all('*', (req, res, next) => {
  next(new AppError(`Không tìm thấy đường dẫn ${req.originalUrl} trên máy chủ`, 404, 'NOT_FOUND'));
});

// Global Centralized Error Handler
app.use(errorHandler);

module.exports = app;
