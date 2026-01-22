require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const cron = require('node-cron');
const path = require('path');
const fs = require('fs');
const NewsDatabase = require('./database');
const FeedParser = require('./feedParser');
const logger = require('./utils/logger');
const InputValidator = require('./utils/validator');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database and feed parser
const database = new NewsDatabase();
const feedParser = new FeedParser(database);

// Load valid sources from feeds.json (single source of truth)
const loadValidSources = () => {
  try {
    const feedsPath = path.join(__dirname, 'feeds.json');
    const data = JSON.parse(fs.readFileSync(feedsPath, 'utf8'));
    return data.feeds.map(feed => feed.source);
  } catch (error) {
    logger.error('Failed to load sources from feeds.json:', error);
    return [];
  }
};
const VALID_SOURCES = loadValidSources();

// Security Middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      imgSrc: ["'self'", "data:", "https:", "http:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN || '*',
  optionsSuccessStatus: 200,
  credentials: false
};
app.use(cors(corsOptions));

// Body parsing
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { success: false, error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const refreshLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit refresh to 5 requests per 15 minutes
  message: { success: false, error: 'Too many refresh requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to API routes
app.use('/api/', apiLimiter);

// Serve static files
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// Health check endpoint
app.get('/health', (req, res) => {
  try {
    const totalArticles = database.getTotalArticles();
    const uptime = process.uptime();

    res.json({
      status: 'healthy',
      uptime: Math.floor(uptime),
      database: {
        connected: true,
        articles: totalArticles
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(503).json({
      status: 'unhealthy',
      error: 'Service unavailable'
    });
  }
});

// API Routes
app.get('/api/articles', (req, res) => {
  try {
    const { limit, offset } = InputValidator.validatePagination(
      req.query.limit,
      req.query.offset
    );

    const articles = database.getArticles(limit, offset);
    const total = database.getTotalArticles();

    logger.info(`Fetched ${articles.length} articles (limit: ${limit}, offset: ${offset})`);

    res.json({
      success: true,
      count: articles.length,
      total,
      articles
    });
  } catch (error) {
    logger.error('Error fetching articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles'
    });
  }
});

app.get('/api/articles/recent', (req, res) => {
  try {
    const hours = InputValidator.validateHours(req.query.hours);
    const articles = database.getRecentArticles(hours);

    logger.info(`Fetched ${articles.length} articles from last ${hours} hours`);

    res.json({
      success: true,
      count: articles.length,
      articles
    });
  } catch (error) {
    logger.error('Error fetching recent articles:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch recent articles'
    });
  }
});

app.get('/api/articles/source/:source', (req, res) => {
  try {
    const source = InputValidator.validateSource(req.params.source, VALID_SOURCES);

    if (!source) {
      return res.status(400).json({
        success: false,
        error: 'Invalid source parameter'
      });
    }

    const { limit, offset } = InputValidator.validatePagination(req.query.limit, req.query.offset);
    const articles = database.getArticlesBySource(source, limit, offset);

    logger.info(`Fetched ${articles.length} articles from source: ${source}`);

    res.json({
      success: true,
      count: articles.length,
      articles
    });
  } catch (error) {
    logger.error('Error fetching articles by source:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch articles by source'
    });
  }
});

app.get('/api/sources', (req, res) => {
  try {
    const sources = database.getSources();

    res.json({
      success: true,
      sources
    });
  } catch (error) {
    logger.error('Error fetching sources:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch sources'
    });
  }
});

app.post('/api/refresh', refreshLimiter, async (req, res) => {
  try {
    logger.info('Manual refresh requested');
    const newArticles = await feedParser.fetchAllFeeds();

    logger.info(`Refresh complete: ${newArticles} new articles`);

    res.json({
      success: true,
      message: `Fetched ${newArticles} new articles`,
      newArticles
    });
  } catch (error) {
    logger.error('Error refreshing feeds:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to refresh feeds'
    });
  }
});

app.get('/api/stats', (req, res) => {
  try {
    const total = database.getTotalArticles();
    const sources = database.getSources();
    const recent = database.getRecentArticles(24);

    res.json({
      success: true,
      stats: {
        totalArticles: total,
        sources: sources,
        last24Hours: recent.length
      }
    });
  } catch (error) {
    logger.error('Error fetching stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch statistics'
    });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route not found'
  });
});

// Global error handler
app.use((err, req, res, next) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// Initial feed fetch on startup
logger.info('Performing initial feed fetch...');
feedParser.fetchAllFeeds()
  .then(count => {
    logger.info(`Initial fetch complete: ${count} articles loaded`);
  })
  .catch(error => {
    logger.error('Initial fetch failed:', error);
  });

// Schedule automatic updates every 30 minutes
const cronSchedule = process.env.CRON_SCHEDULE || '*/30 * * * *';
cron.schedule(cronSchedule, async () => {
  try {
    logger.info('Running scheduled feed update...');
    const count = await feedParser.fetchAllFeeds();
    logger.info(`Scheduled update complete: ${count} new articles`);
  } catch (error) {
    logger.error('Scheduled update failed:', error);
  }
});

// Start server
const server = app.listen(PORT, () => {
  logger.info(`🏈 Chiefs News Aggregator running on http://localhost:${PORT}`);
  logger.info(`📡 Auto-refresh enabled: ${cronSchedule}`);
  logger.info(`💾 Database: ${database.getTotalArticles()} articles stored`);
  logger.info(`🔒 Security: Helmet, CORS, and Rate Limiting enabled`);
});

// Graceful shutdown
const shutdown = (signal) => {
  logger.info(`${signal} received, shutting down gracefully...`);

  server.close(() => {
    logger.info('HTTP server closed');

    database.close();
    logger.info('Database connection closed');

    process.exit(0);
  });

  // Force shutdown after 10 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown('uncaughtException');
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

module.exports = app;
