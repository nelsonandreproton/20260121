const Parser = require('rss-parser');
const fs = require('fs');
const path = require('path');

class FeedParser {
  constructor(database) {
    this.parser = new Parser({
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
    const feedsPath = path.join(__dirname, 'feeds.json');
    const data = fs.readFileSync(feedsPath, 'utf8');
    return JSON.parse(data).feeds;
  }

  extractImageUrl(item) {
    // Try different image sources in RSS feeds
    if (item.enclosure && item.enclosure.url) {
      return item.enclosure.url;
    }
    if (item.mediaThumbnail && item.mediaThumbnail.$) {
      return item.mediaThumbnail.$.url;
    }
    if (item.mediaContent && item.mediaContent.$) {
      return item.mediaContent.$.url;
    }
    // Try to extract from content
    if (item.content) {
      const imgMatch = item.content.match(/<img[^>]+src="([^">]+)"/);
      if (imgMatch) return imgMatch[1];
    }
    return null;
  }

  async parseFeed(feedConfig) {
    try {
      console.log(`Fetching feed: ${feedConfig.name}`);
      const feed = await this.parser.parseURL(feedConfig.url);

      let newArticlesCount = 0;

      for (const item of feed.items) {
        const article = {
          title: item.title || 'No title',
          link: item.link || item.guid,
          description: item.contentSnippet || item.description || '',
          pubDate: item.pubDate || item.isoDate || new Date().toISOString(),
          source: feedConfig.source,
          imageUrl: this.extractImageUrl(item)
        };

        const inserted = this.database.insertArticle(article);
        if (inserted) newArticlesCount++;
      }

      console.log(`${feedConfig.name}: ${newArticlesCount} new articles added`);
      return newArticlesCount;
    } catch (error) {
      console.error(`Error parsing feed ${feedConfig.name}:`, error.message);
      return 0;
    }
  }

  async fetchAllFeeds() {
    console.log('\n=== Starting feed fetch ===');
    const startTime = Date.now();

    let totalNew = 0;
    for (const feedConfig of this.feeds) {
      const count = await this.parseFeed(feedConfig);
      totalNew += count;
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`=== Fetch complete: ${totalNew} new articles in ${duration}s ===\n`);

    return totalNew;
  }
}

module.exports = FeedParser;
