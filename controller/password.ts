import crypto from 'crypto';
import UserProvider from './users';

interface PasswordReturn {
    hash: string,
    salt: string
}

const up = new UserProvider;

export const peper_vals = "ABCDEFGHIGKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz"; // all letters as peppers

export const createPassword = (password: string) => {
    const peper = peper_vals[Math.floor(Math.random() * peper_vals.length)];
    const salt = require('crypto').randomBytes(15).toString('hex');

    const hash = crypto.createHash('sha512')
        .update(salt + password + peper).digest("hex");
    return { hash, salt } as PasswordReturn;
}

export const checkPassword = async (username: string, password: string) => {
    const { hash, salt } = await up.getCredentials(username);

    const peperArray = peper_vals.split('');

    const hashes = peperArray.map((char) => {

        const current_hash = crypto.createHash('sha512')
            .update(salt + password + char).digest("hex");

        return current_hash;
    });
    var found = hashes.find((h) => h == hash)
    if (found == undefined)
        return false;
    
    return true;
}