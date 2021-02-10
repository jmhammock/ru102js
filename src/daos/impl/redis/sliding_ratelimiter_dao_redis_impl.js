const shortId = require('shortid');
const redis = require('./redis_client');
/* eslint-disable no-unused-vars */
const keyGenerator = require('./redis_key_generator');
const timeUtils = require('../../../utils/time_utils');
/* eslint-enable */

/* eslint-disable no-unused-vars */

// Challenge 7
const hitSlidingWindow = async (name, opts) => {
  const client = redis.getClient();
  const rateLimiterKey = keyGenerator.getRateLimiterKey(name, opts.interval, opts.maxHits);
  const transaction = client.multi();

  // START Challenge #7
  const now = timeUtils.getCurrentTimestampMillis();
  transaction.zadd(rateLimiterKey, now, `${now}-${shortId.generate()}`);
  transaction.zremrangebyscore(rateLimiterKey, 0, now - opts.interval);
  transaction.zcard(rateLimiterKey);

  const results = await transaction.execAsync();
  return parseInt(results[2], 10) > opts.maxHits ? -1 : opts.maxHits - parseInt(results[2], 10);
  // END Challenge #7
};

/* eslint-enable */

module.exports = {
  /**
   * Record a hit against a unique resource that is being
   * rate limited.  Will return 0 when the resource has hit
   * the rate limit.
   * @param {string} name - the unique name of the resource.
   * @param {Object} opts - object containing interval and maxHits details:
   *   {
   *     interval: 1,
   *     maxHits: 5
   *   }
   * @returns {Promise} - Promise that resolves to number of hits remaining,
   *   or 0 if the rate limit has been exceeded..
   */
  hit: hitSlidingWindow,
};
