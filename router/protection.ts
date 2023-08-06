import { Request, Response, NextFunction } from 'express';
import { RateLimiterMemory } from 'rate-limiter-flexible';

// Create a rate limiter => 100 req per 60s
const rateLimiter = new RateLimiterMemory({
  points: 20,
  duration: 5,
});


export const rateLimiterMiddleware = (req: Request, res: Response, next: NextFunction) => {
  rateLimiter.consume(req.ip)
    .then(() => {

      next();
    })
    .catch(() => {

      res.status(429).send('Too Many Requests');
    });
};
