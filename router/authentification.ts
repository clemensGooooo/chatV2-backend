import express, { Request, Response } from 'express';
import crypto from 'crypto';
import tokenProvider from '../controller/jwt'
import UserProvider from '../controller/users';

const error = {
    "register": "There is an issue.. Try again!",
    "login": "Sorry but you cant login!",
    "username": "Username already there"
}
// secret encryption token

const tp = new tokenProvider();
const up = new UserProvider();
export const peper_vals = "ABCDEFGHIGKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"; // all letters as peppers


const auth = express.Router();

auth.get("/",(req: Request,res: Response) => {
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

    const peper = peper_vals[Math.floor(Math.random() * peper_vals.length)];
    const salt = require('crypto').randomBytes(15).toString('hex');

    const hash = crypto.createHash('sha512')
        .update(salt + password + peper).digest("hex");

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

    const { hash, salt } = await up.getCredentials(username);

    const peperArray = peper_vals.split('');

    const hashes = peperArray.map((char) => {

        const current_hash = crypto.createHash('sha512')
            .update(salt + password + char).digest("hex");

        return current_hash;
    });
    var found = hashes.find((h) => h == hash)
    if (found == undefined)
        return res.status(401).send(error.login);

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
