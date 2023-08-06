import { Messages } from "./database";


// news with no atributt to is sended to everyone
export default class NewsProvider {
    send = async (message: string) => {
        const newMessage = await Messages.create({
            message: message
        });
        await newMessage.save()
    }
    // to is the username
    sendTo = async (message: string, to: string) => {
        const newMessage = await Messages.create({
            to: to,
            message: message
        });
        await newMessage.save()
    }
    read = async (username: string, admin = false, all = false) => {
        let query = {};

        if (!admin) {
            query = {
                $or: [{ to: username }, { to: { $exists: false } }],
                readed: { $nin: [username] }
            };
        }

        if (all) {
            query = {
                $or: [{ to: username }, { to: { $exists: false } }],
            };
        }
        const yourNews = await Messages.find(query);
        const editedNews = yourNews.map((msg) => {
            if (admin)
                return {
                    message: msg.message,
                    updatedAt: msg.updatedAt,
                    createdAt: msg.createdAt,
                    id: msg.id,
                    to: msg.to
                }
            else
                return {
                    message: msg.message,
                    createdAt: msg.createdAt
                }
        })
        return editedNews;
    }
    markReaded = async (username: string) => {
        const yourNews = await Messages.find({ $or: [{ to: username }, { to: { $exists: false } }], username: { $nin: ["Tom"] } });

        const promises = yourNews.map(async (msg) => {
            if (!msg.readed) {
                msg.readed = [username];
            } else if (!msg.readed.includes(username)) {
                msg.readed.push(username);
            }
            await msg.save();
        });

        await Promise.all(promises);
        return true;
    }
    delete = async (id: String) => {
        try {
            const deletedMessage = await Messages.findByIdAndDelete(id);
            if (!deletedMessage) {
                return false;
            }
            return true;
        } catch (err) {
            return false;
        }
    }
    readPage = async (page: number, pageSize: number) => {
        const startIndex = (page - 1) * pageSize;

        const data = await Messages.find().skip(startIndex).limit(pageSize);

        return {
            currentPage: page,
            pageSize: pageSize,
            totalPages: Math.ceil(await Messages.countDocuments() / pageSize),
            data: data,
        }
    }
}