//MARK: Game logic functions

var MOVE_DETECT_SENSITIVITY = 3;
var LIGHT_SUPPLY_LENGTH = 2000; //light turned on for 2 seconds when the scan button is pressed
var counter
var battery_life = 400; //4000 milliseconds

var scanSuccessSFX = document.getElementById("scan-success");

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
            if (text == "Error") {
                endRevive("复活中断");
            } else {
                var time_left = JSON.parse(text).time_left;
                if (time_left && time_left > 0) {
                    //if there is still reviving undergoing
                    setReviveDiv("正在复活：" + time_left);
                } else if (time_left && time_left <= 0) {
                    endRevive("目标已经活灵活现了");
                }
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
        //if battery is not dead, turn off flash light. otherwise it will be automatically turned off
        if(counter > 0)
            turnOffLight();
    }
}

function reset() {
    update();
    //if the reset is pressed when the light is on, turn off it first
    setup();
    turnOffLight();

    enableFlashLight();

    //Reset the program variables
    timer = null;
    counter = battery_life;

    showId();
}

function interact() {
    QRScanner.getStatus(function(status) {
        if (status.scanning == true || status.showing == true) {
            cancelScan();
        } else if (status.scanning == false || status.showing == false) {
            scan();
        }
    })
}

function cancelScan() {
    QRScanner.hide();
    QRScanner.cancelScan();
}

function scan() {
    QRScanner.show(function(status) {});
    setTimeout(function() {
        //shortly turn on flashlight for supplying qr scan
        turnOnLight(true);
        var flashlight_timer = setTimeout(function() {
            turnOffLight();
        }, LIGHT_SUPPLY_LENGTH);

        QRScanner.scan(
            function(err, text) {
                if (text) {
                    scanSuccessSFX.play();
                    var substrs = text.split(',');
                    if (substrs[0] == 'battery') {
                        //scanned the QR code of battery
                        recharge(substrs[1]);
                        turnOffLight();
                    } else if (substrs[0] == 'person') {
                        //scanned the QR code of a person
                        clearTimeout(flashlight_timer);
                        revive(substrs[1]);
                    }
                }
                QRScanner.hide();
            }
        );
    }, 500);
}

function recharge(battery_id) {
    //validate the battery and then recharge
    requestServer('/client/battery?battery_id=' + battery_id, function(res) {
        if (res == 'OK') {
            counter = battery_life;
            enableFlashLight();
        }
    });
}

function turnOnLight(ignore_timer) {
    window.QRScanner.enableLight(function(err, status) {
        err && console.error(err);
        console.log(status);
    });
    if (!ignore_timer)
        startTimer();
    // Change light button text
    flashLightButton.innerHTML = LIGHT_OFF;
}


function turnOffLight() {
    window.QRScanner.disableLight(function(err, status) {
        err && console.error(err);
        console.log(status);
    });

    stopTimer();
    flashLightButton.innerHTML = LIGHT_ON;
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


function die() {
    turnOffLight();
}

function stopTimer() {
    if (timer) {
        window.clearInterval(timer);
        timer = null;
    }
}
