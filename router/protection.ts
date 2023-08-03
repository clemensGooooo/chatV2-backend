import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Create a rate limiter => 100 req per 60s
const rateLimiter = new RateLimiterMemory({
  points: 20, // 100 points
  duration: 5, // Per 60 seconds
});

// Middleware function for rate limiting
export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  rateLimiter.consume(req.ip)
    .then(() => {
      // If the request is allowed by the rate limiter, proceed to the next middleware
      next();
    })
    .catch(() => {
      // If the request exceeds the rate limit, respond with a 429 status code (Too Many Requests)
      res.status(429).send('Too Many Requests');
    });
};
