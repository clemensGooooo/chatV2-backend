import jwt from 'jsonwebtoken';


const temp_secret = "b4a4b1c71a55c539111f0deccfbadeb4fae5ffca3c142d538ce81828212fca0f708e53b6e9a442caeda03cf94063889e79a5b3d016015a2e2c8919cb777d2fe6"
const token_secret: string = process.env.TOKEN_SECRET || temp_secret;

export default class tokenProvider {

    generate = (username: string) => {
        const accessToken = jwt.sign(
            { name: username },
            token_secret,
            { expiresIn: '1800s' });
        return accessToken;
    }

    check = (token: string, callback: (err: boolean, user?: string) => void) => {
        jwt.verify(token, token_secret, (err: any, user: any) => {
            if (err) {
                callback(true);
            } else {
                callback(false, user);
            }
        });
    };
}

