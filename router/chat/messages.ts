import express, { Request, Response } from "express";
import { MessageProvider } from "../../controller/chat/messages";
import { ChatMessages, Chats } from "../../controller/database";
import multer from 'multer';
import fs from "fs"
import path from 'path';


const Messages = new MessageProvider();
const route = express.Router();

const PAGE_SIZE = 10;

route.get('/get', async (req, res) => {

    try {
        const { chatID, page } = req.query as { chatID: string; page: string };

        const username = req.username;

        if (!chatID || !username) {
            return res.sendStatus(400);
        }

        const pageNumber = parseInt(page) || 1;
        const newChatID = parseInt(chatID);

        const existingChat = await Chats.findOne({ chatID });

        if (!existingChat) {
            return res.sendStatus(404);
        }

        if (!existingChat.members.includes(username)) {
            return res.sendStatus(403);
        }



        const data = await Messages.get(newChatID, pageNumber, PAGE_SIZE);

        return res.status(200).json(data);
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});


interface MessageData {
    chatID: number;
    type: 'file' | 'image' | 'text';
    message: string,
    to?: string;
}


const storageMessage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'upload/chat');
    },
    filename: function (req, file, cb) {
        const randomString = Math.random().toString(36).substring(7);
        const filename = `${randomString}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, filename);
    }
});

const uploadMessage = multer({
    storage: storageMessage,
    limits: {
        fileSize: 6 * 1024 * 1024
    }
});


route.post('/send', uploadMessage.single('file'), async (req: Request, res: Response) => {

    try {
        if (req.username === undefined) {
            return res.sendStatus(400);
        }

        const { chatID, type, message, to }: MessageData = req.body;

        if (!message || !chatID || !type || !['file', 'image', 'text'].includes(type)) {
            return res.sendStatus(400);
        }
        if (type === "file" || type === "image") {
            if (!req.file) {
                return res.sendStatus(400);
            }
        }

        if (req.file && type != "file" && req.file && type != "image") {
            fs.unlinkSync(req.file.path);
            return res.sendStatus(400);
        }

        let final_message = {
            user: req.username,
            message: message,
            timestamp: new Date(),
            chatID: chatID,
            type: type,
            to: to,
            readed: [],
            description: req.file ? req.file.filename : undefined
        };

        const existingChat = await Chats.findOne({ chatID });

        if (!existingChat) {
            return res.sendStatus(404);
        }

        existingChat.lastInteraction = new Date;

        await existingChat.save();

        let insertedMessage = await ChatMessages.create(final_message);
        await insertedMessage.save();

        if (insertedMessage.hasOwnProperty('description')) {
            delete insertedMessage.description;
        }
        res.status(200).send(insertedMessage);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

export default route;

