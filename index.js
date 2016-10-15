var express     = require('express'),
    tls         = require('tls'),
    fs          = require('fs'),
    url         = require('url'),
    app         = express(),
    fs          = require('fs'),
    bodyParser  = require('body-parser')
    port        = process.env.PORT || 3000;

var http        = require('http').Server(app),
    io          = require('socket.io')();

// attach http to the io socket
io.attach(http);

http.listen(port,function(){
    console.log('Express HTTP server listening on port %d',port);
});

// https.listen(sslPort, function(){
//   console.log("Express HTTPS server listening on port " + sslPort);
// });

// parse application/x-www-form-urlencoded
// app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.urlencoded({extended:true}));

// Routing
app.use(express.static(__dirname + '/public'));

// send a message view POST
app.post('/push',function(req, res){

    // console.log("[200] " + req.method + " to " + req.url);

    try{
        // if post to lobby or global
        if (req.body.lobby)
            io.sockets.to(req.body.lobby).emit('new message',{message:req.body.message,username:'server'});
        else
            io.sockets.emit('new message',{message:req.body.message,username:'server'});
        res.json({'success':true});
    }
    catch(e){
        res.json({'success':false});
    }

});

// return array of users connected
app.get('/get-users',function(req,res){
    var users = [];
    for (var key in io.sockets.adapter.sids ){
        var connectedClient = io.sockets.connected[key],
            returnClient    = {'id':connectedClient.conn.id,'rooms':[],'username':connectedClient.username};

        for (var room in connectedClient.rooms){
            if (connectedClient.rooms[room] !== returnClient.id)
                returnClient.rooms.push(connectedClient.rooms[room]);
        }
        users.push(returnClient);
    }
    res.json(users);
});

// Chatroom

// usernames and count
var usernames       = {},
    numUsers        = {};


io.on('connection',function(socket){

    var lobby     = url.parse(socket.handshake.url, true).query.lobby,
        addedUser   = false;

    if (!numUsers[lobby])
        numUsers[lobby] = 0;
    if (!usernames[lobby])
        usernames[lobby] = {};

    socket.join(lobby);

    // when the client emits 'new message'
    socket.on('new message',function(data){
        // emit the message to the other subscribers
        if (socket.username === data.username){
        socket.broadcast.to(lobby).emit('new message',{
            username    : socket.username,
            message     : data
        });} else{
        socket.broadcast.to(lobby).emit('new message',{
            username    : "anonymous",
            message     : data
        });}
    });

    // when client emits add user
    socket.on('add user',function(username){
        // we store the user in the socket session for this client
        socket.username = username;
        // add the client's username to the global list
        if(Object.keys(usernames[lobby]).indexOf(username) === -1){
            usernames[lobby][username] = username;
            ++numUsers[lobby];
            addedUser = true;
            socket.emit('login',{
                numUsers        : numUsers[lobby],
                participants    : usernames[lobby]
            });
            // echo globally (all clients) that a person has connected
            socket.broadcast.to(lobby).emit('user joined',{
                username : "anonymous",
                numUsers : numUsers[lobby]
            });
        } else {
            socket.emit('bad-login');
        }
    });

    // when client emits typing
    socket.on('typing',function(){
        socket.broadcast.to(lobby).emit('typing',{
            username:"anonymous"
        });
    });

    // when client emits stop typing
    socket.on('stop typing',function(){
        socket.broadcast.to(lobby).emit('stop typing',{
            username:"anonymous"
        });
    });

    // when the user disconnects
    socket.on('disconnect', function(){
        // remove the username
        if (addedUser){
            delete usernames[lobby][socket.username];
            --numUsers[lobby];
            // echo globally that the client left
            socket.broadcast.to(lobby).emit('user left',{
                username : "anonymous",
                numUsers : numUsers[lobby]
            });
        }
    });
});