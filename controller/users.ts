import mongoose from "mongoose";
import { User } from "./database";

interface PropsUpdateProfile {
    newImagePath?: string,
    hash?: string,
    salt?: string
}
export default class UserProvider {
    getUserProfile = async (username: string) => {
        const user = await User.findOne({ username: username });

        if (user) {
            return {
                username: user.username,
                profileImage: user.profileImage || ""
            };
        }
        return false;
    }
    updateProfile = async (username: string, data: PropsUpdateProfile) => {
        const user = await User.findOne({ username: username });
        if (!user) {
            return false;
        }
        if (data.newImagePath) {
            user.profileImage = data.newImagePath;
        }
        if (data.hash && data.salt) {
            user.hash = data.hash;
            user.salt = data.salt;
        }
        await user.save();
        return true;
    }

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
    checkAdmin = async (username: string) => {
        const user = await User.findOne({ username: username });
        if (user) {
            if (user.admin == true) {
                return true;
            }
        }
        return false;
    }
}