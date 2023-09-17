import express, { Request, Response } from 'express';
import multer from 'multer';
import { ChatMessages, Chats, User } from '../controller/database';
import UserProvider from '../controller/users';
import path from 'path';
import fs from "fs"
import sharp from 'sharp';
import route from './messages';
import { MessageProvider } from '../controller/chat/messages';
const UserP = new UserProvider;

const Messages = new MessageProvider();
function generateRandomChatID() {
    return Math.floor(Math.random() * 10000000);
}

async function isChatIDUnique(chatID: number) {
    const chatExists = await Chats.exists({ chatID });
    return !chatExists;
}


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

        Messages.newChat(chatID)
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

        await Messages.changeSettings(chatID,req.username, "name of the chat")
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

chat.put('/editChatDescription', async (req, res) => {
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
        await Messages.changeSettings(chatID,req.username, "description")

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


chat.use("/messages",route)


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

