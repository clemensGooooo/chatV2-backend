## Check Connection

### Server
To ckeck if the server is alive use `/auth` this will send you the status `200` if all success.

### Login
If you want to ckeck if you are logged in you can use `/check_connection` this will send you Status`200` if all is fine.

## Authentification

### Register - POST

You can create a account with the api `/auth/register`, there you must send the following creadentials in the body:
```json
{
    "username": "[your-name]",
    "password": "[secret-passoword]"
}
```
Your answer if everything wents fine is Status `200` and the access token !

### Login - POST

You can login in a account with the api `/auth/login`, there you must send the following creadentials:
```json
{
    "username": "[your-name]",
    "password": "[secret-passoword]"
}
```
Your answer if everything wents fine is Status `200` and the access token !

### Refresh Token - POST

If the token runs out of time you need a new token, you should send the old token for the now one, the token must be in the `req.body`:
```json
{
    "token": "[your-recent-token]"
}
```
Answer should be the new token in the body, Status `200`.

