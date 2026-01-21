const Database = require('better-sqlite3');
const path = require('path');

class NewsDatabase {
  constructor() {
    const dbPath = path.join(__dirname, '..', 'news.db');
    this.db = new Database(dbPath);
    this.init();
  }

  init() {
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

    // Create index for faster queries
    this.db.exec(`
      CREATE INDEX IF NOT EXISTS idx_pubDate ON articles(pubDate DESC);
      CREATE INDEX IF NOT EXISTS idx_source ON articles(source);
    `);
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
