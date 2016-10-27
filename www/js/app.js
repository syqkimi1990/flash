/*
 * Constant define
 */
var SERVER_URL = "http://192.168.1.103:3000";
var ID = 1;
var BATTERY_LIFE = 400; //4000 milliseconds
var LIGHT_ON = "开启手电";
var LIGHT_OFF = "关闭手电";
var OUT_OF_BATTERY = "电池已经耗尽";
var DEAD_MESSAGE = "你死了！";
var WAIT_MESSAGE = "正在等待游戏开始...";
var CONNECTING_MESSAGE = "正在连接服务器...";
var MOVE_DETECT_SENSITIVITY = 5;
var REVIVE_INTERVAL = 1 * 1000;

var light_on = false;

/*
 **  Global variable define
 */
var resultDiv = document.getElementById("results");
var reviveCountDiv = document.getElementById("reviveCounter");
var flashLightButton = document.getElementById("flashLight");
var interactButton = document.getElementById("interact");
var timer = null;
var counter = BATTERY_LIFE;

/*
 ** Add event listeners
 */
document.addEventListener("deviceready", init, false);
document.addEventListener("backbutton", function() {
    // pass exitApp as callbacks to the switchOff method
    window.plugins.flashlight.switchOff(exitApp, exitApp);
}, false);
document.addEventListener("resume", onResume, false);

function init() {
    showMessage(CONNECTING_MESSAGE);
    setInterval(function() { update(); }, 1000);
}

function registerListeners() {
    interactButton.addEventListener("touchend", onClickInteract, false);
    flashLightButton.addEventListener("touchend", onClickFlashLightButton, false);
}

function removeListeners() {
    interactButton.removeEventListener("touchend", onClickInteract, false);
    flashLightButton.removeEventListener("touchend", onClickFlashLightButton, false);
}

//MARK:  Listeners for buttons

function onClickInteract() {
    //disable recharge button when it is pressed
    shortlyDisableButton(interactButton);
    stopTimer();
    scanQrCode();
}

function onClickFlashLightButton() {
    //disable the flashlight button to prevent faster click
    shortlyDisableButton(flashLightButton);
    shortlyLockUI();

    window.plugins.flashlight.available(function(isAvailable) {
        if (isAvailable) {
            //Switch on the flashlight
            if (window.plugins.flashlight.isSwitchedOn() == false && counter > 0 && flashLightButton.innerHTML == LIGHT_ON) {
                turnOnLight();
            } else if (flashLightButton.innerHTML == LIGHT_OFF) {
                turnOffLight();
            } else {
                //do nothing as in this condition the battery may run out
            }
        } else {
            window.alert("Flashlight not available on this device");
        }
    });

}

function die() {
    if (window.plugins.flashlight.isSwitchedOn()) {
        turnOffLight();
    }
}

function revive(target_id) {
    var reviving = true;
    turnOnLight();
    //Get current position right after scan the QR code
    var currentPosition = {};
    navigator.accelerometer.getCurrentAcceleration(
        function(acceleration) {
            currentPosition = acceleration;
        },
        onError);
    //Show the count down mask
    setReviveDiv("正在复活玩家");
    setMask();

    var reviveTimer = setInterval(function() {
        if (Number(counter) <= 0) {
            endRevive("电池耗尽");
            return;
        }
        requestServer('/client/revive?player_id=' + target_id, onReply);
    }, REVIVE_INTERVAL);

    function onReply(text) {
        if (reviving) {
            var time_left = JSON.parse(text).time_left;
            if (time_left && time_left > 0) {
                //if there is still reviving undergoing
                setReviveDiv("还剩" + time_left + "秒复活");
            } else if (time_left && time_left <= 0) {
                endRevive("复活成功");
            }
        }
    };

    //Check the position change every 0.1s
    var movementDetection = navigator.accelerometer.watchAcceleration(onSuccess, onError, { frequency: 100 });

    function onSuccess(acceleration) {
        if (Math.abs(acceleration.x - currentPosition.x) > MOVE_DETECT_SENSITIVITY || Math.abs(acceleration.y - currentPosition.y) > MOVE_DETECT_SENSITIVITY || Math.abs(acceleration.z - currentPosition.z) > MOVE_DETECT_SENSITIVITY) {
            endRevive('复活中断，你移动了！');
        }
    }

    function onError() {
        window.alert('onError!');
    }

    function endRevive(message) {
        reviving = false;
        navigator.accelerometer.clearWatch(movementDetection);
        if (reviveTimer)
            clearInterval(reviveTimer);
        if (message) {
            setReviveDiv(message);
            setTimeout(function() { removeMask(); }, 1000);
        } else
        //remove mask immediately if there is no message
            removeMask();
    }
}

function reset() {
    //if the reset is pressed when the light is on, turn off it first
    if (window.plugins.flashlight.isSwitchedOn()) {
        turnOffLight();
    }
    enableFlashLight();

    //Reset the program variables
    timer = null;
    counter = BATTERY_LIFE;
}

//MARK: Game logic functions

function scanQrCode() {

    // //shortly turn on flashlight for 3 seconds
    // window.plugins.flashlight.switchOn();
    // var flashlight_timer = setTimeout(function() {
    //     window.plugins.flashlight.switchOff();
    // }, 3000);

    setTimeout(function() {
        cordova.plugins.barcodeScanner.scan(
            function(result) {
                if (!result.cancelled) {
                    if (result.format == "QR_CODE") {
                        var text = result.text;
                        var substrs = text.split(',');
                        if (substrs[0] == 'battery') {
                            recharge(substrs[1]);
                        } else if (substrs[0] == 'person') {

                            revive(substrs[1]);
                        }
                    }
                }
                //if the flashligh is on before scanning, turn on again
                if (light_on) {
                    window.plugins.flashlight.switchOn();
                }
            },
            function(error) {
                window.alert("Scanning failed: " + error);
                //if the flashligh is on before scanning, turn on again
                if (light_on) {
                    window.plugins.flashlight.switchOn();
                }
            }
        );
    }, 100);

}

function recharge(battery_id) {
    //validate the battery and then recharge
    requestServer('/client/battery?battery_id=' + battery_id, function(is_ok) {
        counter = BATTERY_LIFE;
        enableFlashLight();
    });
}

function turnOnLight() {
    window.plugins.flashlight.switchOn(function() {},
        function() {
            alert("Flashlight switch on fails");
            window.plugins.flashlight.switchOff();
        }, { 'intensity': 0.5 });
    startTimer();
    // Change light button text
    flashLightButton.innerHTML = LIGHT_OFF;
}


function turnOffLight() {
    stopTimer();
    flashLightButton.innerHTML = LIGHT_ON;
    window.plugins.flashlight.switchOff(function() {}, function() { window.alert("Flashlight switch off fails"); });
}

function startTimer() {
    // Start timer when the flash light is on
    timer = window.setInterval(function() {
        counter--;
        if (counter < 0) {
            turnOffLight();
            counter = 0;
            disableFlashLight();
        } else {
            showBatteryLeft(counter);
        }
    }, 100);
}

function stopTimer() {
    if (timer) {
        window.clearInterval(timer);
        timer = null;
    }
}

//MARK: Game Status Tracking funcitons

//automatically update player status from server
function update() {
    requestServer('/client/status?player_id=' + ID, function(res) {
        onReceivePlayerStatus(res);
    });
}

function onReceivePlayerStatus(player_status) {
    if (player_status == 'dead') {
        die();
        removeListeners();
        showMessage(DEAD_MESSAGE);
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
    url = SERVER_URL + url;
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

//MARK: UI Control Functions

function showBatteryLeft(battery_left) {
    var message = "剩余电池时间 (秒):" + (battery_left / 10).toFixed(1).toString();
    showMessage(message);
}

function showMessage(text) {
    resultDiv.innerHTML = text;
}

function disableFlashLight() {
    flashLightButton.innerHTML = OUT_OF_BATTERY;
    flashLightButton.classList.add("disabled");
    flashLightButton.removeEventListener("touchend", onClickFlashLightButton, false);
}

function enableFlashLight() {
    flashLightButton.innerHTML = LIGHT_ON;
    flashLightButton.classList.remove("disabled");
    flashLightButton.addEventListener("touchend", onClickFlashLightButton, false);
}

function shortlyDisableButton(DOMElement, callback) {
    DOMElement.classList.add("disabled");
    setTimeout(function() {
        DOMElement.classList.remove("disabled");
    }, 500);
}

function shortlyLockUI() {
    removeListeners();
    setTimeout(function() {
        registerListeners();
    }, 500);
}

function setMask() {
    var mask = document.getElementById("mask");
    mask.style.visibility = "visible";
}

function removeMask() {
    var mask = document.getElementById("mask");
    mask.style.visibility = "hidden";
}

function setReviveDiv(message) {
    reviveCountDiv.innerHTML = message;
}

function saveServerInfo() {
    if (document.getElementById('serverURL').value == "" || document.getElementById('localID').value == "" ) {
        window.alert("服务器不能为空");
    } else {
        //save in local storage
        localStorage.setItem("serverURL", document.getElementById('serverURL').value);
        localStorage.setItem("localID", document.getElementById('localID').value);
    }
}

function showServerInfoPanel() {
    document.getElementById('serverInfoPanel').style.display = "block";

    //retrieve from local storage
    document.getElementById('serverURL').value = localStorage.getItem("serverURL");
    document.getElementById('localID').value = localStorage.getItem("localID");

}

function hideServerInfoPanel() {
    document.getElementById('serverInfoPanel').style.display = "none";
}

function exitApp() {
    if (timer) {
        window.clearInterval(timer);
        timer = null;
    }
    navigator.app.exitApp();
}

function onResume() {}


