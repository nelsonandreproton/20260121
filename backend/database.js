const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

class NewsDatabase {
  constructor() {
    try {
      const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '..', 'news.db');

      // Ensure database directory exists
      const dbDir = path.dirname(dbPath);
      if (!fs.existsSync(dbDir)) {
        fs.mkdirSync(dbDir, { recursive: true });
      }

      this.db = new Database(dbPath, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : null
      });

      // Enable WAL mode for better concurrency
      this.db.pragma('journal_mode = WAL');

      this.init();
    } catch (error) {
      console.error('Failed to initialize database:', error);
      throw error;
    }
  }

  init() {
    try {
      // Create articles table
      this.db.exec(`
        CREATE TABLE IF NOT EXISTS articles (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          title TEXT NOT NULL,
          link TEXT UNIQUE NOT NULL,
          description TEXT,
          pubDate TEXT,
          source TEXT,
          imageUrl TEXT,
          createdAt DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      // Create indexes for faster queries
      this.db.exec(`
        CREATE INDEX IF NOT EXISTS idx_pubDate ON articles(pubDate DESC);
        CREATE INDEX IF NOT EXISTS idx_source ON articles(source);
        CREATE INDEX IF NOT EXISTS idx_createdAt ON articles(createdAt DESC);
      `);

      console.log('Database initialized successfully');
    } catch (error) {
      console.error('Failed to initialize database schema:', error);
      throw error;
    }
  }

  insertArticle(article) {
    const stmt = this.db.prepare(`
      INSERT OR IGNORE INTO articles (title, link, description, pubDate, source, imageUrl)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    try {
      const info = stmt.run(
        article.title,
        article.link,
        article.description,
        article.pubDate,
        article.source,
        article.imageUrl || null
      );
      return info.changes > 0; // Returns true if inserted, false if duplicate
    } catch (error) {
      console.error('Error inserting article:', error.message);
      return false;
    }
  }

  getArticles(limit = 50, offset = 0) {
    const stmt = this.db.prepare(`
      SELECT * FROM articles
      ORDER BY pubDate DESC
      LIMIT ? OFFSET ?
    `);
    return stmt.all(limit, offset);
  }

  getArticlesBySource(source, limit = 20) {
    const stmt = this.db.prepare(`
      SELECT * FROM articles
      WHERE source = ?
      ORDER BY pubDate DESC
      LIMIT ?
    `);
    return stmt.all(source, limit);
  }

  getRecentArticles(hours = 24) {
    const stmt = this.db.prepare(`
      SELECT * FROM articles
      WHERE datetime(pubDate) >= datetime('now', '-' || ? || ' hours')
      ORDER BY pubDate DESC
    `);
    return stmt.all(hours);
  }

  getTotalArticles() {
    const stmt = this.db.prepare('SELECT COUNT(*) as count FROM articles');
    return stmt.get().count;
  }

  getSources() {
    const stmt = this.db.prepare(`
      SELECT DISTINCT source, COUNT(*) as count
      FROM articles
      GROUP BY source
      ORDER BY count DESC
    `);
    return stmt.all();
  }

  close() {
    this.db.close();
  }
}

module.exports = NewsDatabase;
