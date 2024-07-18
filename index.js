const ws = require('ws');

const serv = new ws.Server({ port: 9000 });
console.log("log:\u001b[32m Server created\u001b[37m");

class player{
    constructor(side){
        this.alive = true;
        this.asid = -1;
        this.pos = [0.0, 0.0, 0.0];
        this.rot = 0.0;
        this.wlvl = 0;
        this.ready = false;
        this.side = side;
    }
}

var plnum = 0

var players = [];

var env = 0;

for(var i = 0; i != 10; i++){
    players.push(new player(0));
}

var pawns = [];

for(var i = 0; i != 18; i++){
    pawns.push(true);
}

var started = false;

function oncon(wsClient){
    if(started){
        wsClient.close();
    }
    var side1 = false;
    var side2 = false;
    var totwlvl = 0;
    plnum+=1;
    if (plnum > 10){
        wsClient.close();
    }
    var asignid = 0;
    for(var i = 0; i != 10; i+=1){
        if (players[i].asid === -1) {
            asignid = i;
            players[i].asid = i;
            break;
        }
    } 
    console.log("log:\u001b[32m New connection, asignid=" + asignid + "\u001b[37m");
    wsClient.send('id='+asignid);
    wsClient.on('message', function(message) {
        console.log("log:\u001b[36m recived: "+message+"\u001b[37m");
        const dism = String(message).split('=');
        if (dism[0] == 'r' || dism[0] == 'n'){
            var activepl = 0;
            for(var i = 0; i != 10; i+=1){
                if(players[i].ready && players[i].asid != -1){
                    activepl+=1;
                    if (players[i].side === 0){
                        side1 = true;
                    }
                    if (players[i].side === 1){
                        side2 = true;
                    }
                }
            }
            if(activepl === plnum && side1 === true && side2 === true){
                wsClient.send('r');
                console.log("log:\u001b[36m Everyone is ready, starting...\u001b[37m");
                started = true;
            }else{
                wsClient.send('nr');
            }

            if (dism[0] == 'r'){
                players[asignid].ready = true;
                players[asignid].side = Number(dism[1]);
            }
            if (dism[0] == 'n'){
                players[asignid].ready = false;
                players[asignid].side = Number(dism[1]);
            }
        }

        if(dism[0] === 'd'){
            players[asignid].pos[0] = Number(dism[1]);
            players[asignid].pos[1] = Number(dism[2]);
            players[asignid].pos[2] = Number(dism[3]);
            players[asignid].rot = Number(dism[4]);
            players[asignid].wlvl = Number(dism[5]);
            if(dism.length > 5){
                for(var i = 6; i != 24;i+=2){
                    if(Number(dism[i+1]) > -1 && Boolean(Number(dism[i])) === false){
                        players[Number(dism[i+1])].alive = false;
                        console.log("log:\u001b[32m a player was killed\u001b[37m");
                    }
                }
                for(var i = 24; i != 42;i+=1){
                    if(Number(dism[i]) === 0){
                        pawns[i-24] = 0;
                    }
                }
            }
            var sendmsg = 'd';
            var s1a = 0;
            var s2a = 0;
            for(var i = 0; i != 10; i+=1){
                if(i !== asignid){
                    sendmsg += '='+players[i].pos[0]+'='+players[i].pos[1]+'='+players[i].pos[2]+'='+players[i].rot+'='+players[i].side+'='+Number(players[i].alive)+'='+Number(players[i].asid);
                }
                totwlvl += players[i].wlvl;
                if (players[i].side === 0 && players[i].alive && players[i].asid != -1){
                    s1a+=1;
                }
                if (players[i].side === 1 && players[i].alive && players[i].asid != -1){
                    s2a+=1;
                }
            }
            if(totwlvl > 100){
                totwlvl = 100;
            }
            sendmsg += '='+totwlvl+'='+env+'='+Number(players[asignid].alive);
            for(var i = 0; i != 18; i+=1){
                sendmsg += '='+pawns[i];
            }
            if((s1a === 0 && players[asignid].side === 0) || (s2a === 0 && players[asignid].side === 1)){
                sendmsg = 'l';
            }
            if((s1a === 0 && players[asignid].side === 1) || (s2a === 0 && players[asignid].side === 0)){
                sendmsg = 'w';
            }
            wsClient.send(sendmsg);
            console.log("log:\u001b[36m sent: "+sendmsg+"\u001b[37m");
        }
        activepl = 0;
        totwlvl = 0;
    });
    wsClient.on('close', function() {
        plnum -= 1;
        players[asignid].asid = -1;
        players[asignid].ready = false;
        if(plnum === 0){
            console.log("log:\u001b[31m everybody leaved the server, closing...\u001b[37m");
            process.exit(0);
        }
        console.log("log:\u001b[31m a player leaves the server\u001b[37m");
    });
    wsClient.on('error', function() {
        players[asignid].asid = -1;
        players[asignid].ready = false;
        console.log("log:\u001b[31m an error occurred, closing...\u001b[37m");
        process.exit(0);
    });
}

serv.on('connection', oncon);

console.log("log:\u001b[32m server is ready\u001b[37m");

console.log("log:\u001b[32m local ipv4 = " + Object.values(require('os').networkInterfaces()).reduce((r, list) => r.concat(list.reduce((rr, i) => rr.concat(i.family==='IPv4' && !i.internal && i.address || []), [])), [])+":9000\u001b[37m");

console.log("\u001b[35minfo\u001b[37m: press ctrl+c to close");

function increase_env(){
    setTimeout(() => {
        env += 0.01;
        increase_env();
      }, 10);
}

increase_env();