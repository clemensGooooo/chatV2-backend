import express, { Express, Request, Response } from 'express';
import dotenv from 'dotenv';
import auth from './router/authentification';
import { checker } from './router/authReqCheck';
dotenv.config();

const app: Express = express();

const port = process.env.PORT;

app.use(express.json());

app.use("/auth", auth)

app.use(checker)

app.get('/check_connection', async (req: Request, res: Response) => {
    res.send("Your connection works !");
})

app.listen(port, () => {
    console.log(`⚡️[server]: Server is running at http://localhost:${port}`);
});