import express, { Request, Response } from 'express';
import multer from 'multer';
import { ChatMessages, Chats, User } from '../controller/database';
import UserProvider from '../controller/users';
import path from 'path';
import fs from "fs"
import sharp from 'sharp';
const UserP = new UserProvider;

function generateRandomChatID() {
    return Math.floor(Math.random() * 10000000);
}

async function isChatIDUnique(chatID: number) {
    const chatExists = await Chats.exists({ chatID });
    return !chatExists;
}

const blackList: string[] = [];

const chat = express.Router();


interface CreateChatRequest {
    name: string;
    members: string[];
    chatText: string | undefined;
}

chat.post('/createChat', async (req, res) => {
    try {
        const { name, members, chatText }: CreateChatRequest = req.body;

        if (!name || !members || typeof chatText != "string") {
            return res.sendStatus(400);
        }
        if (req.username == undefined || members.includes(req.username) == false) {
            return res.sendStatus(400);
        }

        if (members.length == 1) {
            return res.sendStatus(400);
        }

        const allMembersExist = await Promise.all(members.map((member: string) =>
            UserP.checkUsername(member)));

        if (!allMembersExist.every(exists => exists)) {
            return res.sendStatus(400);
        }

        let chatID: number;
        do {
            chatID = generateRandomChatID();
        } while (!await isChatIDUnique(chatID));


        let newChat = await Chats.create({
            chatID: chatID,
            name: name,
            members: members,
            chatText: chatText ? chatText : "Description",
            changed: new Date(),
            lastInteraction: new Date()
        });

        await newChat.save();
        return res.status(201).json({ id: newChat.chatID });
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});

chat.get('/getChatInfo', async (req, res) => {
    try {
        const { chatID } = req.query;

        if (!chatID) {
            return res.sendStatus(400);
        }

        const existingChat = await Chats.findOne({ chatID });

        if (!existingChat) {
            return res.sendStatus(404);
        }

        if (!req.username) {
            return res.sendStatus(400);
        }

        if (!existingChat.members.includes(req.username)) {
            return res.sendStatus(403);
        }

        const chatInfo = {
            chatID: existingChat.chatID,
            name: existingChat.name,
            members: existingChat.members,
            lastInteraction: existingChat.lastInteraction,
            image: existingChat.image ? true : false,
            chatText: existingChat.chatText
        };

        return res.status(200).json(chatInfo);
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});

const storageGroupChat = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'upload/chats');
    },
    filename: function (req, file, cb) {
        const randomString = Math.random().toString(36).substring(7);
        const filename = `${randomString}_${Date.now()}${path.extname(file.originalname)}`;
        cb(null, filename);
    }
});

const uploadGroupProfile = multer({
    storage: storageGroupChat,
    limits: {
        fileSize: 6 * 1024 * 1024
    }
});

chat.post('/uploadGroupImage', uploadGroupProfile.single('image'), async (req, res) => {
    try {

        if (!req.file) {
            return res.sendStatus(400);
        }

        const { chatID } = req.body;

        const id = Number(chatID);
        if (typeof (id) != "number") {
            fs.unlinkSync(req.file.path);
            return res.sendStatus(400);
        }

        if (req.username == undefined) {
            fs.unlinkSync(req.file.path);
            return res.sendStatus(401);
        }


        const chat = await Chats.findOne({ chatID: id, members: req.username });

        if (!chat) {
            fs.unlinkSync(req.file.path);
            return res.sendStatus(400)
        }

        await sharp(req.file.path)
            .resize(128, 128)
            .toFile(path.join('upload/chats', 'thumbnail_' + req.file.filename));

        if (chat.image) {
            fs.unlinkSync("upload/chats/" + chat.image);
        }


        chat.image = 'thumbnail_' + req.file.filename;
        chat.changed = new Date;
        chat.lastInteraction = new Date;

        fs.unlinkSync(req.file.path);

        await chat.save();

        return res.sendStatus(201);

    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});

chat.get('/getProfile/:chatID', async (req, res) => {
    try {
        const chatID = Number(req.params.chatID);

        if (!chatID) {
            return res.sendStatus(400);
        }

        const chat = await Chats.findOne({ chatID: chatID });


        if (!chat || !chat.image) {
            return res.sendStatus(404);
        }

        const imageName = chat.image;


        const imagePath = path.join('upload/chats', `${imageName}`);

        if (fs.existsSync(imagePath)) {
            const imageStream = fs.createReadStream(imagePath);
            res.setHeader('Content-Type', 'image/jpeg');
            imageStream.pipe(res);
        } else {
            return res.sendStatus(404);
        }
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});

interface EditChatNameRequest {
    chatID: number;
    newName: string;
}

chat.put('/editChatName', async (req, res) => {
    try {
        const { chatID, newName }: EditChatNameRequest = req.body;

        if (!chatID || !newName) {
            return res.sendStatus(400);
        }

        const existingChat = await Chats.findOne({ chatID });

        if (!existingChat) {
            return res.sendStatus(404);
        }

        if (req.username == undefined) {
            return res.sendStatus(400);
        }

        if (!existingChat.members.includes(req.username)) {
            return res.sendStatus(403);
        }

        existingChat.name = newName;
        existingChat.changed = new Date();
        existingChat.lastInteraction = new Date();

        await existingChat.save();

        return res.sendStatus(200);
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});

interface EditChatTextRequest {
    chatID: number,
    text: string
}

chat.put('/editChatText', async (req, res) => {
    try {
        const { chatID, text }: EditChatTextRequest = req.body;

        if (!chatID || !text) {
            return res.sendStatus(400);
        }

        const existingChat = await Chats.findOne({ chatID });

        if (!existingChat) {
            return res.sendStatus(404);
        }

        if (req.username == undefined) {
            return res.sendStatus(400);
        }

        if (!existingChat.members.includes(req.username)) {
            return res.sendStatus(403);
        }

        existingChat.chatText = text;
        existingChat.changed = new Date();
        existingChat.lastInteraction = new Date();

        await existingChat.save();

        return res.sendStatus(200);
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});

chat.delete('/deleteChat', async (req, res) => {
    try {
        const { chatID } = req.query;

        if (!chatID) {
            return res.sendStatus(400);
        }

        let existingChat = await Chats.findOne({ chatID });

        if (req.username == undefined) {
            return res.sendStatus(400);
        }

        if (!existingChat) {
            return res.sendStatus(404);
        }

        if (!existingChat.members.includes(req.username)) {
            return res.sendStatus(403);
        }

        await Chats.deleteOne({ chatID });
        await ChatMessages.deleteMany({ chatID });

        return res.sendStatus(200);
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});

chat.get('/getChats', async (req, res) => {
    try {
        const username: string | undefined = req.username;

        if (!username) {
            return res.sendStatus(400);
        }

        const userChats = await Chats.find({ members: username });

        const chats = userChats.map(chat => {
            return {
                name: chat.name,
                chatID: chat.chatID,
                image: chat.image ? true : false,
                lastInteraction: chat.lastInteraction
            }
        })

        return res.status(200).json(chats);
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

chat.post('/send', uploadMessage.single('file'), async (req: Request, res: Response) => {

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
        res.sendStatus(200);
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

const PAGE_SIZE = 10;

chat.get('/getChatMessages', async (req, res) => {
    try {
        const { chatID, page } = req.query as { chatID: string; page: string };
        const username = req.username;

        if (!chatID || !username) {
            return res.sendStatus(400);
        }

        const pageNumber = parseInt(page) || 1;
        const skipCount = (pageNumber - 1) * PAGE_SIZE;

        const existingChat = await Chats.findOne({ chatID });

        if (!existingChat) {
            return res.sendStatus(404);
        }

        if (!existingChat.members.includes(username)) {
            return res.sendStatus(403);
        }

        const chatMessages = await ChatMessages.find({ chatID })
            .sort({ timestamp: -1 })
            .skip(skipCount)
            .limit(PAGE_SIZE);

        const sanitizedMessages = chatMessages.map(message => {
            const sanitizedMessage = { ...message.toObject() };
            if (sanitizedMessage.hasOwnProperty('description')) {
                delete sanitizedMessage.description;
            }
            return sanitizedMessage;
        });

        return res.status(200).json(sanitizedMessages);
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});


chat.get('/getImage/:messageId', async (req, res) => {
    try {
        const messageId = req.params.messageId;

        if (!messageId) {
            return res.sendStatus(400);
        }

        const message = await ChatMessages.findById({ _id: messageId });


        if (!message || !message.description) {
            return res.sendStatus(404);
        }

        const imageName = message.description;


        const imagePath = path.join('upload/chat', `${imageName}`);

        if (fs.existsSync(imagePath)) {
            const imageStream = fs.createReadStream(imagePath);
            res.setHeader('Content-Type', 'image/jpeg');
            imageStream.pipe(res);
        } else {
            return res.sendStatus(404);
        }
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});


chat.delete('/deleteMessage', async (req, res) => {
    try {
        const { messageID } = req.body;

        if (!messageID || !req.username) {
            return res.sendStatus(400);
        }

        const messageToDelete = await ChatMessages.findOne({ _id: messageID });

        if (!messageToDelete) {
            return res.sendStatus(404);
        }

        const chatID = messageToDelete.chatID;
        const existingChat = await Chats.findOne({ chatID });

        if (!existingChat) {
            return res.sendStatus(404);
        }

        if (messageToDelete.user != req.username) {
            return res.sendStatus(403);
        }

        await ChatMessages.deleteOne({ _id: messageID });

        return res.sendStatus(200);
    } catch (error) {
        console.error(error);
        return res.sendStatus(500);
    }
});

chat.get('/getUsernames', async (req, res) => {
    const { name } = req.query;

    if (typeof name !== "string" || name.length < 2 && name.length < 300) {
        return res.sendStatus(400);
    }

    try {
        const users = await User.find({ username: { $regex: name, $options: 'i' } });
        const usernames = users.map(user => user.username);

        res.json(usernames);
    } catch (error) {
        console.error(error);
        res.sendStatus(500);
    }
});

export default chat;

