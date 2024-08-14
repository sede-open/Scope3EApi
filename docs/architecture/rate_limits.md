# Rate limiting

We have one unauthenticated endpoint for sending out contact emails from the public website. To minimise the risk of being attacked by robots, we've added a [rate limit](./src/middlewares/rateLimiter.ts) to the endpoint of 10 requests per minute per IP address. The rate limit is managed by [express-rate-limit](https://www.npmjs.com/package/express-rate-limit) library and the request counter is stored within our Azure Redis Cache.

If needed, the created middleware could also be used to rate limit other endpoints too.
