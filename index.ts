import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import auth from './router/authentification';
import { checker } from './router/authReqCheck';
import { rateLimiterMiddleware } from './router/protection';
import cors from 'cors';
import admin from './router/admin';
import user from './router/user';
dotenv.config();

const app: Express = express();

const port = process.env.PORT;

app.use(cors({ origin: true, credentials: true, methods: 'GET,PUT,POST,OPTIONS', allowedHeaders: 'Content-Type,Authorization' }));
app.use(express.json());
app.use(rateLimiterMiddleware);
app.use("/auth", auth)
app.use(checker)
app.use("/admin", admin)
app.use("/user", user)


app.get('/check_connection', async (req: Request, res: Response) => {
    res.status(200).send("Your connection works !");
})

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});