import User from "./database";


export default class UserProvider {
    checkUsername = async (username: string): Promise<boolean> => {
        const existingUser = await User.findOne({ username: username });

            if (existingUser) {
                return true;
            }
            return false;
    }

    createNewUser = async (username: string, hash: string, salt: string) => {
        let user = await User.create({ username: username, hash: hash, salt: salt });
        await user.save();
        return;
    }

    getCredentials = async (username: string) => {
        const existingUser = await User.findOne({ username: username });
        if (existingUser) {
            return existingUser;
        }
        throw new Error('Password not available !');
    }
}