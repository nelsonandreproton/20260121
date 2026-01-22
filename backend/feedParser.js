const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
const InputValidator = require('./utils/validator');

// Allowed domains for RSS feeds
const ALLOWED_FEED_DOMAINS = [
  'chiefs.com',
  'www.chiefs.com',
  'arrowheadpride.com',
  'www.arrowheadpride.com',
  'arrowheadaddict.com',
  'www.arrowheadaddict.com',
  'bleacherreport.com',
  'cbssports.com',
  'www.cbssports.com',
  'nfl.com',
  'www.nfl.com',
  'chiefsdigest.com',
  'www.chiefsdigest.com',
  'fox4kc.com',
  'www.fox4kc.com',
  'ksn.com',
  'www.ksn.com',
  'kshb.com',
  'www.kshb.com',
  'nfltraderumors.co',
  'www.nfltraderumors.co',
  'theguardian.com',
  'www.theguardian.com',
  'espn.com',
  'www.espn.com',
  'chiefswire.usatoday.com',
  'usatoday.com'
];

class FeedParser {
  constructor(database) {
    this.parser = new Parser({
      timeout: 30000, // 30 second timeout
      customFields: {
        item: [
          ['media:content', 'mediaContent'],
          ['media:thumbnail', 'mediaThumbnail'],
          ['enclosure', 'enclosure']
        ]
      }
    });
    this.database = database;
    this.feeds = this.loadFeeds();
  }

  loadFeeds() {
    try {
      const feedsPath = path.join(__dirname, 'feeds.json');
      const data = fs.readFileSync(feedsPath, 'utf8');
      const feeds = JSON.parse(data).feeds;

      // Validate all feed URLs
      const validFeeds = feeds.filter(feed => {
        if (!InputValidator.isValidFeedUrl(feed.url, ALLOWED_FEED_DOMAINS)) {
          logger.warn(`Invalid or unauthorized feed URL: ${feed.url}`);
          return false;
        }
        return true;
      });

      logger.info(`Loaded ${validFeeds.length} valid feeds`);
      return validFeeds;
    } catch (error) {
      logger.error('Error loading feeds:', error);
      return [];
    }
  }

  extractImageUrl(item) {
    try {
      // Try different image sources in RSS feeds
      if (item.enclosure && item.enclosure.url) {
        const url = item.enclosure.url;
        if (InputValidator.isValidUrl(url)) {
          return url;
        }
      }

      if (item.mediaThumbnail && item.mediaThumbnail.$) {
        const url = item.mediaThumbnail.$.url;
        if (InputValidator.isValidUrl(url)) {
          return url;
        }
      }

      if (item.mediaContent && item.mediaContent.$) {
        const url = item.mediaContent.$.url;
        if (InputValidator.isValidUrl(url)) {
          return url;
        }
      }

      // Try to extract from content
      if (item.content && typeof item.content === 'string') {
        const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
        if (imgMatch && InputValidator.isValidUrl(imgMatch[1])) {
          return imgMatch[1];
        }
      }
    } catch (error) {
      logger.debug('Error extracting image URL:', error.message);
    }

    return null;
  }

  sanitizeArticleData(item, feedConfig) {
    // Extract and validate data
    const title = (item.title || 'No title').substring(0, 500);
    const link = item.link || item.guid;
    const description = (item.contentSnippet || item.description || '').substring(0, 2000);
    // Convert date to ISO format for proper sorting
    const rawDate = item.isoDate || item.pubDate || new Date().toISOString();
    const pubDate = new Date(rawDate).toISOString();
    const source = feedConfig.source;
    const imageUrl = this.extractImageUrl(item);

    // Create article object
    const article = {
      title,
      link,
      description,
      pubDate,
      source,
      imageUrl
    };

    // Validate article
    const validation = InputValidator.validateArticle(article);
    if (!validation.isValid) {
      logger.debug(`Invalid article data: ${validation.errors.join(', ')}`);
      return null;
    }

    return article;
  }

  async parseFeed(feedConfig, retryCount = 0) {
    const maxRetries = 3;
    const retryDelay = Math.pow(2, retryCount) * 1000; // Exponential backoff

    try {
      logger.info(`Fetching feed: ${feedConfig.name} (attempt ${retryCount + 1}/${maxRetries + 1})`);

      const feed = await this.parser.parseURL(feedConfig.url);
      let newArticlesCount = 0;
      let skippedArticles = 0;

      for (const item of feed.items) {
        const article = this.sanitizeArticleData(item, feedConfig);

        if (!article) {
          skippedArticles++;
          continue;
        }

        const inserted = this.database.insertArticle(article);
        if (inserted) {
          newArticlesCount++;
        }
      }

      logger.info(
        `${feedConfig.name}: ${newArticlesCount} new articles added, ${skippedArticles} skipped`
      );
      return newArticlesCount;

    } catch (error) {
      logger.error(`Error parsing feed ${feedConfig.name}:`, error.message);

      // Retry with exponential backoff
      if (retryCount < maxRetries) {
        logger.info(`Retrying ${feedConfig.name} in ${retryDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, retryDelay));
        return this.parseFeed(feedConfig, retryCount + 1);
      }

      logger.error(`Failed to fetch ${feedConfig.name} after ${maxRetries + 1} attempts`);
      return 0;
    }
  }

  async fetchAllFeeds() {
    logger.info('=== Starting feed fetch ===');
    const startTime = Date.now();

    if (this.feeds.length === 0) {
      logger.warn('No valid feeds configured');
      return 0;
    }

    let totalNew = 0;
    const results = [];

    // Fetch feeds in parallel with a concurrency limit
    const concurrencyLimit = 3; // Max 3 feeds at a time
    for (let i = 0; i < this.feeds.length; i += concurrencyLimit) {
      const batch = this.feeds.slice(i, i + concurrencyLimit);
      const batchResults = await Promise.all(
        batch.map(feedConfig => this.parseFeed(feedConfig))
      );
      results.push(...batchResults);
      totalNew += batchResults.reduce((sum, count) => sum + count, 0);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    logger.info(`=== Fetch complete: ${totalNew} new articles in ${duration}s ===`);

    return totalNew;
  }

  /**
   * Reload feeds from config file (useful for adding new feeds without restart)
   */
  reloadFeeds() {
    this.feeds = this.loadFeeds();
    logger.info('Feeds configuration reloaded');
  }
}

module.exports = FeedParser;
