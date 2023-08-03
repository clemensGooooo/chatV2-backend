import express, { Express, Request, Response } from 'express';
import tokenProvider from '../controller/jwt';

const tp = new tokenProvider();

export const checker = async (req: Request, res: Response, next: () => void) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        if (token == null) return res.sendStatus(401);

        const user: { name: string } = await new Promise((resolve, reject) => {
            tp.check(token, (err, user: any) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(user);
                }
            });
        });

        if (!user) {
            return res.sendStatus(400);
        }
        next();
    } catch (err) {
        return res.sendStatus(400);
    }
}