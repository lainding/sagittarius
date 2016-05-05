#!/usr/bin/env node

const PushBullet = require('pushbullet');
const pusher = new PushBullet("o.eELy0gnDOu7vzOIBGi8QMxTw0AhZ3q7N");

const devices = [];
const myself = { name: "notifier" };
const publishedcommands = [];
const helpmessages = ['test'];

var init = function() {
    pusher.devices(function(err, response) {
        if (err) {
            console.log(err);
        }
        else {
            response.devices.forEach(function(d) {
                if (d.active) {
                    devices.push(d);
                    if (d.nickname == myself.name) {
                        console.log('find myself.');
                        myself.iden = d.iden;
                    }
                    // console.log(devices);
                }
            });
        
            if (myself.iden == undefined) {
                console.log("create myself.");
                createdevice(myself.name);
            }

        }
    })
    startwatcher();
    createstream();
}

var createstream = function() {
    var stream = pusher.stream();
    stream.connect();
    stream.on('connect', function() {
        console.log('stream connect.');
    })
    stream.on('tickle', function(type) {
        if (type == 'push') {
            getpushmessage(10);
        }
    })
}

var startwatcher = function() {
    var timer = setInterval(function() {
        for (var i = publishedcommands.length - 1; i >= 0; i--) {
            var pc = publishedcommands[i];
            if (pc.count < 100) {  // 100 毫秒timer， 100次后也就是10秒
                pc.count = pc.count + 1;
            }
            else {
                sendmessage(pc.from, { title: "Helps", body: helpmessages.join('\n') });
                processmessagedone(pc.iden);
                publishedcommands.splice(i, 1);
            }
        }
    }, 100);
}

var sendmessage = function(iden, message, type) {
    console.log('send message.');
    pusher.note(iden, message.title, message.body, function(err, response) {
        if (err) { 
            console.log(err);
        }
        else { 
            console.log(response);
        }
    });
}

var gettimestamp = function() { 
    return new Date().getTime() / 1000;
}

var getpushmessage = function(count) {
    var timestamp = gettimestamp();
    pusher.history({ "active": "true", "modified_after": timestamp - 900 }, function(err, response){
        if (err) {
            console.log(err);
        }
        else {
            // console.log(response.pushes.length);
            response.pushes.forEach(function(push) {
                // console.log(push);
                // console.log(push.dismissed);
                // console.log(push.target_device_iden)
                if (push.active && !push.dismissed && 
                    (push.target_device_iden == undefined || push.target_device_iden == myself.iden)) {
                        publishnotice({
                            iden: push.iden,
                            from: push.source_device_iden,
                            timestamp: timestamp,
                            title: push.title,
                            body: push.body,
                        });
                        // if (push.target_device_iden == myself.iden) {
                            // processmessagedone(push.iden);
                        // }
                    }
            })
        }
    })
}

var processmessagedone = function(iden) {
    pusher.updatePush(iden, { dismissed: true }, function(err, response) {
        if (err) {
            console.log(err);
        }
        else {
            // console.log(response);
        }
    })
}

var publishnotice = function(message) {
    message.count = 0;
    publishedcommands.push(message);

    console.log(message);
}

var createdevice = function(nickname) {
    pusher.createDevice(nickname, function(err, response) {
        if (err) {
            console.log(err);
        }
        else {
            if (response.nickname == nickname) {
                myself.iden = response.iden;
            }
        }
    })
}

init();
