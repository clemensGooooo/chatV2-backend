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
    read = async (username: string, admin = false) => {
        let query = {};

        if (!admin) {
            query = {
                $or: [{ to: username }, { to: { $exists: false } }],
                readed: { $nin: [username] }
            };
        }

        const yourNews = await Messages.find(query);
        const editedNews = yourNews.map((msg) => {
            if (admin)
                return {
                    message: msg.message,
                    updatedAt: msg.updatedAt,
                    id: msg.id,
                    to: msg.to
                }
            else
                return {
                    message: msg.message,
                    updatedAt: msg.updatedAt
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
}