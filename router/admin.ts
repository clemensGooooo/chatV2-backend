// There exist 2 groups of users, one group has just a single user, a admin, the second
// group has multible users. The admin has the path /admin just for his self 

import express, { Request, Response } from 'express';
import { User } from '../controller/database';
import NewsProvider from '../controller/news';
import UserProvider from '../controller/users';

const News = new NewsProvider;
const Users = new UserProvider;

const admin = express.Router();

admin.use(async (req: Request, res: Response, next) => {
    if (req.username == undefined)
        return res.sendStatus(401);

    const admin = await Users.checkAdmin(req.username);
    if (admin)
        return next();
    res.sendStatus(401)
})
admin.get("/", (req: Request, res: Response) => {
    res.status(200).send("You are admin!");
})

admin.get("/users", async (req: Request, res: Response) => {
    const users = await User.find({}, {})

    const c_users = users.map(obj => {
        const new_obj = {
            username: obj.username,
            admin: obj.admin || false
        }
        return new_obj;
    });
    res.send(c_users)
})

admin.post("/news/new", async (req: Request, res: Response) => {
    if (req.body == undefined)
        return res.status(400).send("Not worked");

    const message: string | false = req.body.message || false;
    const to: string | false = req.body.to || false;
    if (message == false)
        return res.status(400).send("Not worked");

    if (to == false)
        await News.send(message);

    else {
        if (await Users.checkUsername(to) == false)
            return res.status(400).send("Not worked");
        await News.sendTo(message, to);
    }
    res.status(200).send("Message sended !")
})

admin.get("/news/all", async (req: Request, res: Response) => {
    const username: string | undefined = req.username;
    if (username == undefined)
        return res.sendStatus(401);
    const news = await News.read("", true);
    res.send(news);
})

admin.delete("/news/delete", async (req: Request, res: Response) => {
    if (req.body == undefined)
        return res.sendStatus(400);

    const id: string | undefined = req.body.id;
    if (id == undefined)
        return res.sendStatus(400);
    const deleted = await News.delete(id);
    if (deleted)
        return res.sendStatus(200);
    res.sendStatus(400);
})

export default admin;
