/*
 * Constant define
 */
var BATTERY_LIFE = 400; //4000 milliseconds
var LIGHT_ON = "Light On";
var LIGHT_OFF = "Light Off";
var OUT_OF_BATTERY = "No More Battery";
var SERVER_URL = "http://192.168.1.103:3000";
var ID = 1;

var light_on = false;

/*
 **  Global variable define
 */
var resultDiv = document.getElementById("results");
var timer;
var counter = BATTERY_LIFE;
var flashLightButton = document.getElementById("flashLight");
var rechargeButton = document.getElementById("recharge");
var resetButton = document.getElementById("reset");

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
    registerListeners();
    setInterval(function() { update(); }, 1000);
}

function registerListeners(){
	rechargeButton.addEventListener("touchend", onClickInteract, false);
    flashLightButton.addEventListener("touchend", onClickFlashLightButton, false);
    resetButton.addEventListener("touchend", tryReset, false);
}

function removeListeners(){
	rechargeButton.removeEventListener("touchend", onClickInteract, false);
    flashLightButton.removeEventListener("touchend", onClickFlashLightButton, false);
    resetButton.removeEventListener("touchend", tryReset, false);
}

//automatically update player status from server
function update() {
    var url = SERVER_URL + '/client/status?player_id='+ ID;
    var xmlhttp = new XMLHttpRequest();
    xmlhttp.open('GET', url, true);
    xmlhttp.send();
    xmlhttp.onreadystatechange = function() {
        if (xmlhttp.readyState == 4) {
            if (xmlhttp.status == 200 || xmlhttp.status == 304) {
                var response = xmlhttp.responseText;
                onReceivePlayerStatus(response);
            }
        }
    }
}

function onReceivePlayerStatus(player_status) {
	if (player_status == 'dead'){
		showMessage("You are DEAD!!!!");
		removeListeners();
	} else if (player_status == 'ready'){
		showMessage("Waiting for starting...");
		removeListeners();
	} else {
		showBatteryLeft(counter);
		registerListeners();
	}
}

function showBatteryLeft(battery_left){
	var message = "Battery Time Left (s):" + (battery_left / 10).toFixed(1).toString();
	showMessage(message);
}

function showMessage(text){
	resultDiv.innerHTML = text;
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

function startTimer(){
	// Start timer when the flash light is on
    timer = window.setInterval(function() {
        counter--;
        if (counter < 0) {
            window.plugins.flashlight.switchOff();
            window.clearInterval(timer);
            counter = 0;
            flashLightButton.innerHTML = OUT_OF_BATTERY;
            flashLightButton.classList.add("disabled");
        } else {
            showBatteryLeft(counter);
        }
    }, 100);
}

function turnOffLight() {
	stopTimer();
    flashLightButton.innerHTML = LIGHT_ON;
    window.plugins.flashlight.switchOff(function() {}, function() { window.alert("Flashlight switch off fails"); });
}

function stopTimer(){
	if (timer) {
        window.clearInterval(timer);
        timer = null;
    }
}

function shortlyDisableButton(DOMElement,callback){
	DOMElement.classList.add("disabled");
	setTimeout(function(){
		DOMElement.classList.remove("disabled");
	},500);
}

function shortlyLockUI(){
	removeListeners();
	setTimeout(function(){
		registerListeners();
	},500);
}

function onClickInteract() {
    //disable recharge button when it is pressed
    shortlyDisableButton(rechargeButton);
    stopTimer();
    flashLightButton.innerHTML = LIGHT_ON;
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

function reset() {
    //if the reset is pressed when the light is on, turn off it first
    if (window.plugins.flashlight.isSwitchedOn()) {
        turnOffLight();
    }

    //Reset the program variables
    timer = null;
    flashLightButton.innerHTML = LIGHT_ON;
    flashLightButton.classList.remove("disabled");
    recharge();
}

function tryReset() {
    //disable the flashlight button for 0.5s when the reset is pressed to prevent quick click
    shortlyLockUI();
    shortlyDisableButton(resetButton);

    //vaildate before resetting
    validate('/client/reset', function(is_ok) {
        if (is_ok) { reset(); }
    });
}

function scanQrCode() {
    setTimeout(function() {
        cordova.plugins.barcodeScanner.scan(
            function(result) {
                if (!result.cancelled) {
                    if (result.format == "QR_CODE") {
                        var text = result.text;
                        var substrs = text.split(',');
                        if (substrs[0] == 'battery') {
                            validate('/client/battery?battery_id=' + substrs[1], function(is_ok) { recharge(); });
                        } else if (substrs[0] == 'person') {
                            cordova.plugins.barcodeScanner.scan(
                                function(result) {},
                                function(error) {
                                });
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
    }, 500);
    setTimeout(function() {
        window.plugins.flashlight.switchOn();
        setTimeout(function() {
            window.plugins.flashlight.switchOff();
        }, 3000);
    }, 500);
}

function recharge() {
    counter = BATTERY_LIFE;
    showBatteryLeft(counter);
}

function exitApp() {
    if (timer) {
        window.clearInterval(timer);
        timer = null;
    }
    navigator.app.exitApp();
}

function validate(url, callback) {
    //send a request to the server to validate if the request is good to proceed
    url = SERVER_URL + url;
    if (url) {
        var xmlhttp = new XMLHttpRequest();
        xmlhttp.open('GET', url, true);
        xmlhttp.send();
        xmlhttp.onreadystatechange = function() {
            if (xmlhttp.readyState == 4) {
                if (xmlhttp.status == 200 || xmlhttp.status == 304) {
                    callback(true);
                }
            }
        }
    }
    //	setTimeout(function(){callback(true)},500);
}

function onResume() {}
