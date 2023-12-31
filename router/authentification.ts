import express, { Request, Response } from 'express';
import crypto from 'crypto';
import tokenProvider from '../controller/jwt'
import UserProvider from '../controller/users';
import { checkPassword, createPassword, peper_vals } from '../controller/password';

const error = {
    "register": "There is an issue.. Try again!",
    "login": "Sorry but you cant login!",
    "username": "Username already there"
}
// secret encryption token

const tp = new tokenProvider();
const up = new UserProvider();


const auth = express.Router();

auth.get("/", (req: Request, res: Response) => {
    res.send(200);
})

auth.post("/register", async (req: Request, res: Response) => {

    // check if body is definded
    if (req.body == undefined)
        return res.status(400).send(error.register);

    const username: string | false = req.body.username || false;
    const password: string | false = req.body.password || false;

    // check if password & username is definded
    if (username == false || password == false)
        return res.status(400).send(error.register);

    // check if username exists => true if already there !
    if (await up.checkUsername(username))
        return res.status(409).send(error.username);

    const { hash, salt } = createPassword(password)

    await up.createNewUser(username, hash, salt);

    const access_token = tp.generate(username)
    res.status(200).json({ token: access_token })
})

auth.post("/login", async (req: Request, res: Response) => {

    // check if body is definded
    if (req.body == undefined)
        return res.status(401).send(error.login);

    const username: string | false = req.body.username || false;
    const password: string | false = req.body.password || false;

    // check if password & username is definded
    if (username == false || password == false)
        return res.status(401).send(error.login);

    // check if username exists
    if (await up.checkUsername(username) == false)
        return res.status(401).send(error.login);

    const isloggedIn = await checkPassword(username, password);

    if (isloggedIn == false) {
        return res.sendStatus(401);
    }
    // "Logged in"
    // send access token
    const access_token = tp.generate(username)
    res.status(200).json({ token: access_token })

})

auth.post('/refresh_token', async (req: Request, res: Response) => {
    try {
        // check if user send a token
        if (req.body == undefined)
            res.status(400).send(error.login)

        const token: string | false = req.body.token || false;

        // check if username exists
        if (token == false)
            return res.status(400).send(error.login);

        // check token
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
            return res.status(400).send(error.login);
        }


        // check if username exists => true if already there !
        const isUserThere = await up.checkUsername(user.name);
        if (!isUserThere)
            return res.status(400).send(error.username);
        const new_token = tp.generate(user.name);
        res.status(200).json(new_token);

    } catch (err) {
        return res.status(400).send(error.login);
    }
});

export default auth;
