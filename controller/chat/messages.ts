import { ChatMessages } from "../database"

const Welcome_Message = "Welcome to this new chat!"
export class MessageProvider {

    get = async (chatID: number, page: number, MAX_MESSAGES = 10) => {

        const documents = await ChatMessages.countDocuments({ chatID })

        var msgLength = MAX_MESSAGES;
        var skip = documents - page * msgLength;
        if (skip < 0) {
            if (skip <= -10) {
                return []
            }
            msgLength = msgLength + skip;
            skip = 0;
        }

        const chatMessages = await ChatMessages.find({ chatID }).
            sort({ timestamp: 1 }).skip(skip).limit(msgLength)


        const filteredMessages = chatMessages.map(message => {
            const filtered = { ...message.toObject() };


            if (filtered.type == "info") {
                if (filtered.message == "new") {
                    filtered.message = Welcome_Message;
                }
                if (filtered.message == "change") {
                    filtered.message = filtered.user+ " has changed the "+filtered.description
                }
            }

            if (filtered.hasOwnProperty('description')) {
                delete filtered.description;
            }
            return filtered;
        });

        return filteredMessages;

    }

    newChat = async (chatID: number) => {
        let newMessage = {
            user: "none",
            message: "new",
            timestamp: new Date(),
            chatID: chatID,
            type: "info",
            readed: [],
        };

        let insertedMessage = await ChatMessages.create(newMessage);
        await insertedMessage.save();
    }

    changeSettings = async (chatID: number,user: string,what: string) => {
        let newMessage = {
            user: user,
            message: "change",
            timestamp: new Date(),
            chatID: chatID,
            description: what,
            type: "info",
            
            readed: [],
        };

        let insertedMessage = await ChatMessages.create(newMessage);
        await insertedMessage.save();
    }
}