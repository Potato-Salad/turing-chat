# Imitationga.me

This is a chatroom redesigned for Imitationga.me. The original source was found at (https://github.com/Automattic/socket.io/tree/master/examples/chat).

## How to use

```
$ npm install
$ node .
```

And point your browser to `http://localhost:3000`

## Features

- Multiple users can join a chat room by each entering a unique username
on website load.
- Users can type chat messages to the chat room.
- A notification is sent to all users when a user joins or leaves
the chatroom.
- All users are anonymous to one another.

## Enhancements
- If a user tries to join with the same username it will not allow them
- User can select a room to go into
- A REST point is available to receive calls from a third party (ie:server side) and send messages to clients

### Simple CURL Example
```
curl -X POST 127.0.0.1:3000/push -d "message"="sI AM COMING FROM CURL" -d "channel"="channel_a"
```