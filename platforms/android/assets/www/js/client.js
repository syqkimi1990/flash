//MARK: client-server communication functions


var REVIVE_INTERVAL = 1 * 200;
var DEF_SERVER_URL = "192.168.1.103";
var DEF_ID = 1;

function setup(){
    requestServer('/client/setup',function(responseText){
        var response = JSON.parse(responseText);
        if (response)
            battery_life = Number(response.battery_life)*10;
    }); 
}
//automatically update player status
function update() {
    var id = getClientId();
    requestServer('/client/status?player_id=' + id+'&battery_left='+counter/10, function(res) {
        onReceivePlayerStatus(res);
    });
}

function onReceivePlayerStatus(player_status) {
    if (player_status == 'dead') {
        die();
        removeListeners();
        showMessage(DEAD_MESSAGE);
    } else if (player_status == 'reviving') {
        die();
        removeListeners();
        showMessage(REVIVE_MESSAGE);
    } else if (player_status == 'ready') {
        reset();
        removeListeners();
        showMessage(WAIT_MESSAGE);
    } else {
        showBatteryLeft(counter);
        registerListeners();
    }
}

function requestServer(url, callback) {
    //send a request to the server
    var server_addr = getServerAddr();
    url = server_addr + url;
    if (url) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('GET', url, true);
        xmlhttp.send();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200 || xmlhttp.status == 304) {
                    callback(xmlhttp.responseText);
                }
            }
        }
    }
}

function getServerAddr() {
    if (!localStorage.getItem('serverURL'))
        return null;
    var server = 'http://' + localStorage.getItem('serverURL') + ':3000';;
    if (server && server.length > 0) {
        return server;
    } else {
        return DEF_SERVER_URL;
    }
}

function getClientId() {
    var client = localStorage.getItem("localID");
    if (client && client > 0) {
        return client;
    } else {
        return DEF_ID;
    }
}