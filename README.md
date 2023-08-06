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


## User API

### Profile - GET

The API `/user/profile` will show you the profile.

### Profile-Image - GET/POST
The`/user/profile/image` will show you the profile-image.
If you want to update the profile image use the `POST` method.
The **field key** should be `image`.

### Password - POST
With this `/user/password` API you can update the password.
You need to send the new password and the old password, so that your password get successful changed.
```json
{
    "password":"[your-current-password]",
    "newPassword":"[Your-new-passwd]"
}
```

### News
This is the API part to get the news.
Use `/user/news` to get all not readed news. <br>
Use `/user/news/all` to get all news ever sended to you. <br>
Use `/user/news/readed` this will set all messages to readed. <br>

## Admin API
Only accessable by admins.

Test if you are admin use `/admin` `GET`

### Users - GET
This will show you all users.
API path: `/admin/users`

### News - GET
This will show all news, its not important who send them.
<br>

There are two params: `page`: [number], `pageSize` [number], because the API is dynamic.
Test it for more info.

### News - DELETE

This `API` allows you to delete a news article.
