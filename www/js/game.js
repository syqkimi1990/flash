//MARK: Game logic functions

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
        if (count >0)
            turnOffLight();
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

function scanQrCode() {

    //shortly turn on flashlight for 3 seconds
    window.plugins.flashlight.switchOn();
    var flashlight_timer = setTimeout(function() {
        window.plugins.flashlight.switchOff();
    }, 3000);

    setTimeout(function() {
        cordova.plugins.barcodeScanner.scan(
            function(result) {
                if (!result.cancelled) {
                    if (result.format == "QR_CODE") {
                        var text = result.text;
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
                } else {
                    //turn off light if scan is cancelled
                    turnOffLight();
                }
            },
            function(error) {
                window.alert("Scanning failed: " + error);
            }
        );
    }, 100);

}

function recharge(battery_id) {
    //validate the battery and then recharge
    requestServer('/client/battery?battery_id=' + battery_id, function(res) {
        if (res == 'OK') {
            counter = BATTERY_LIFE;
            enableFlashLight();
        }
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


function die() {
    if (window.plugins.flashlight.isSwitchedOn()) {
        turnOffLight();
    }
}

function stopTimer() {
    if (timer) {
        window.clearInterval(timer);
        timer = null;
    }
}