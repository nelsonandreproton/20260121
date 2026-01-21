const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const path = require('path');
const NewsDatabase = require('./database');
const FeedParser = require('./feedParser');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize database and feed parser
const database = new NewsDatabase();
const feedParser = new FeedParser(database);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'frontend')));

// API Routes
app.get('/api/articles', (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const offset = parseInt(req.query.offset) || 0;
    const articles = database.getArticles(limit, offset);
    res.json({
      success: true,
      count: articles.length,
      total: database.getTotalArticles(),
      articles
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/articles/recent', (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const articles = database.getRecentArticles(hours);
    res.json({
      success: true,
      count: articles.length,
      articles
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/articles/source/:source', (req, res) => {
  try {
    const source = req.params.source;
    const limit = parseInt(req.query.limit) || 20;
    const articles = database.getArticlesBySource(source, limit);
    res.json({
      success: true,
      count: articles.length,
      articles
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
    res.status(500).json({ success: false, error: error.message });
  }
});

app.post('/api/refresh', async (req, res) => {
  try {
    const newArticles = await feedParser.fetchAllFeeds();
    res.json({
      success: true,
      message: `Fetched ${newArticles} new articles`,
      newArticles
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
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
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve frontend
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'frontend', 'index.html'));
});

// Initial feed fetch on startup
console.log('Performing initial feed fetch...');
feedParser.fetchAllFeeds().then(count => {
  console.log(`Initial fetch complete: ${count} articles loaded`);
});

// Schedule automatic updates every 30 minutes
cron.schedule('*/30 * * * *', () => {
  console.log('Running scheduled feed update...');
  feedParser.fetchAllFeeds();
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🏈 Chiefs News Aggregator running on http://localhost:${PORT}`);
  console.log(`📡 Auto-refresh enabled: every 30 minutes`);
  console.log(`💾 Database: ${database.getTotalArticles()} articles stored\n`);
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down gracefully...');
  database.close();
  process.exit(0);
});
