const validator = require('validator');

class InputValidator {
  /**
   * Validate and sanitize pagination parameters
   */
  static validatePagination(limit, offset) {
    const sanitizedLimit = parseInt(limit) || 50;
    const sanitizedOffset = parseInt(offset) || 0;

    // Enforce maximum limits
    const maxLimit = 100;
    const maxOffset = 10000;

    return {
      limit: Math.min(Math.max(sanitizedLimit, 1), maxLimit),
      offset: Math.min(Math.max(sanitizedOffset, 0), maxOffset)
    };
  }

  /**
   * Validate hours parameter
   */
  static validateHours(hours) {
    const sanitizedHours = parseInt(hours) || 24;

    // Between 1 and 168 hours (7 days)
    return Math.min(Math.max(sanitizedHours, 1), 168);
  }

  /**
   * Validate source parameter against whitelist
   */
  static validateSource(source, validSources) {
    if (!source || typeof source !== 'string') {
      return null;
    }

    // Trim the source first
    const trimmed = source.trim();

    // Check if it's in the whitelist (exact match)
    if (validSources.includes(trimmed)) {
      return trimmed;
    }

    return null;
  }

  /**
   * Validate URL
   */
  static isValidUrl(url) {
    if (!url || typeof url !== 'string') {
      return false;
    }

    try {
      const urlObj = new URL(url);
      // Only allow http and https protocols
      return urlObj.protocol === 'http:' || urlObj.protocol === 'https:';
    } catch (error) {
      return false;
    }
  }

  /**
   * Validate feed URL against whitelist of domains
   */
  static isValidFeedUrl(url, allowedDomains = []) {
    if (!this.isValidUrl(url)) {
      return false;
    }

    // If no whitelist, accept valid URLs
    if (allowedDomains.length === 0) {
      return true;
    }

    try {
      const urlObj = new URL(url);
      const hostname = urlObj.hostname.toLowerCase();

      // Check if hostname or any parent domain is in the whitelist
      return allowedDomains.some(domain => {
        const normalizedDomain = domain.toLowerCase();
        return hostname === normalizedDomain || hostname.endsWith(`.${normalizedDomain}`);
      });
    } catch (error) {
      return false;
    }
  }

  /**
   * Sanitize text content
   */
  static sanitizeText(text, maxLength = 10000) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Escape HTML entities and trim
    let sanitized = validator.escape(text.trim());

    // Limit length
    if (sanitized.length > maxLength) {
      sanitized = sanitized.substring(0, maxLength);
    }

    return sanitized;
  }

  /**
   * Validate article data before inserting into database
   */
  static validateArticle(article) {
    const errors = [];

    // Title is required
    if (!article.title || typeof article.title !== 'string' || article.title.trim().length === 0) {
      errors.push('Title is required');
    }

    // Link must be a valid URL
    if (!this.isValidUrl(article.link)) {
      errors.push('Invalid article link');
    }

    // Source is required
    if (!article.source || typeof article.source !== 'string' || article.source.trim().length === 0) {
      errors.push('Source is required');
    }

    // Image URL must be valid if provided
    if (article.imageUrl && !this.isValidUrl(article.imageUrl)) {
      errors.push('Invalid image URL');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}

module.exports = InputValidator;
