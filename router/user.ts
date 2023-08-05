// There exist 2 groups of users, one group has just a single user, a admin, the second
// group has multible users. The admin has the path /admin just for his self 

import express, { Request, Response } from 'express';
import { User } from '../controller/database';
import NewsProvider from '../controller/news';

const News = new NewsProvider;
const user = express.Router();

user.get("/news", async (req: Request, res: Response) => {
    const username: string | undefined = req.username;
    if (username == undefined)
        return res.sendStatus(401);
    const news = await News.read(username);
    res.send(news);
})

user.put("/news/readed", async (req: Request, res: Response) => {
    const username: string | undefined = req.username;
    if (username == undefined)
        return res.sendStatus(401);
    News.markReaded(username)
    res.sendStatus(200);
})

export default user;
