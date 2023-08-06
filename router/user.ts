
import express, { Request, Response } from 'express';
import NewsProvider from '../controller/news';
import path from 'path';
import multer, { FileFilterCallback } from 'multer';
import UserProvider from '../controller/users';
import sharp from 'sharp';
import fs from "fs"
import { peper_vals } from './authentification';
import crypto from 'crypto';


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'upload/cache');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const extension = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + extension);
    },
});

const imageFilter = function (req: Request,
    file: Express.Multer.File, cb: FileFilterCallback) {
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(null, false);
    }
    cb(null, true);
};


const upload = multer({ storage, fileFilter: imageFilter });


const News = new NewsProvider;
const Users = new UserProvider;

const user = express.Router();


user.get("/profile", async (req: Request, res: Response) => {
    const username: string | undefined = req.username;

    if (username == undefined)
        return res.sendStatus(400);

    const profile = await Users.getUserProfile(username);
    res.send(profile);
})

user.get('/profile/image', async (req: Request, res: Response) => {
    const username: string | undefined = req.username;

    if (username == undefined)
        return res.sendStatus(400);

    const profile = await Users.getUserProfile(username);
    if (profile == false)
        return res.sendStatus(400);

    var filePath: string;
    if (profile.profileImage == "") {
        filePath = filePath = path.join(__dirname, "..", "..",
            '/upload/profile/' + "user.png");
    } else {
        filePath = path.join(__dirname, "..", "..",
            '/upload/profile/' + profile.profileImage);
    }
    res.sendFile(filePath);
});

user.post('/profile/image', upload.single('image'), async (req, res) => {
    const file = req.file;
    if (!file) {
        return res.sendStatus(400);
    }
    if (req.username == undefined)
        return res.status(400).send('Error');

    try {

        await sharp(file.path)
            .resize(128, 128)
            .toFile('upload/profile/' + file.filename);
        Users.updateProfile(req.username, { newImagePath: file.filename })
        fs.unlinkSync(file.path);

        return res.status(200).send('Image uploaded and resized successfully!');
    } catch (error) {
        return res.status(500).send('Error resizing the image.');
    }
});

user.post('/password', async (req: Request, res: Response) => {
    if (req.body == undefined || req.username == undefined)
        return res.sendStatus(500);

    const newPassword: string | false = req.body.newPassword || false;
    const password: string | false = req.body.password || false;

    // check if password & username is definded
    if (newPassword == false || password == false)
        return res.status(401);

    const { hash, salt } = await Users.getCredentials(req.username);

    const peperArray = peper_vals.split('');

    const hashes = peperArray.map((char) => {

        const current_hash = crypto.createHash('sha512')
            .update(salt + password + char).digest("hex");

        return current_hash;
    });
    var found = hashes.find((h) => h == hash)
    if (found == undefined)
        return res.status(401).send("Error");

    const new_peper = peper_vals[Math.floor(Math.random() * peper_vals.length)];
    const new_salt = require('crypto').randomBytes(15).toString('hex');

    const new_hash = crypto.createHash('sha512')
        .update(new_salt + newPassword + new_peper).digest("hex");
    await Users.updateProfile(req.username, { hash: new_hash, salt: new_salt })
    res.sendStatus(200);
});

user.get("/news", async (req: Request, res: Response) => {
    const username: string | undefined = req.username;

    if (username == undefined)
        return res.sendStatus(401);

    const news = await News.read(username);
    res.send(news);
})

user.get("/news/all", async (req: Request, res: Response) => {
    const username: string | undefined = req.username;

    if (username == undefined)
        return res.sendStatus(401);

    const news = await News.read(username, false, true);
    res.send(news);
})

user.get("/news/readed", async (req: Request, res: Response) => {
    const username: string | undefined = req.username;

    console.log(username);

    if (username == undefined)
        return res.sendStatus(401);

    News.markReaded(username)
    res.sendStatus(200);
})

export default user;
