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
            admin: obj.admin || false,
            createdAt: obj.createdAt,
            updatedAt: obj.updatedAt
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


admin.get("/news", async (req: Request, res: Response) => {
    
    if (req.query == undefined)
        return res.sendStatus(400);

    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 10;

    if (pageSize > 200)
        return res.status(500).send("Pagesize too large !");
    
    const data = await News.readPage(page, pageSize);

    res.status(200).send(data);
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
