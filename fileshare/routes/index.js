var express = require('express');
var server = require('http').Server(express);
var io = require('socket.io')(server);

var app_clients = [];
var app_clients_nbr = 0;

server.listen(8080);

io.on('connection', function (socket) {
    console.log ('Connection attempt: ' + socket.id);
    app_clients [app_clients.length] = socket;
    var index = app_clients.length;
    var id = socket.id;
    ++app_clients_nbr;
    console.log ('Connection: total nbr connected clients: ' + app_clients_nbr);
    socket.on('fileshare', function (data) {
        sendMessage ('Server: emit fileshare parts', 'fileshare', data);
    });
    socket.on('fileshare-complete', function (data) {
        sendMessage ('Server: emit fileshare completed', 'fileshare-complete', data);
    });
    socket.on('disconnect', function () {
        console.log ('disconnect: ' + id);
        delete app_clients[index-1]
        --app_clients_nbr;
        console.log ('Disconnection: total nbr connected clients: ' + app_clients_nbr);
        sendMessage ('Server: emit welcome', 'welcome', { clients: app_clients_nbr });
    });
    sendMessage ('Server: emit welcome', 'welcome', { clients: app_clients_nbr });
});

function sendMessage(lbl, type, data) {
    console.log ('sendMessage: ' + lbl);
    for (var i = 0; i < app_clients.length; i++) {
        if (app_clients[i]!=undefined) {
            var s = app_clients[i];
            s.emit(type, data); 
        }
     }
}

var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Fileshare', instructions: 'Drop file here' });
});

module.exports = router;