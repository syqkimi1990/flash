/*
 * Constant define
 */

var LIGHT_ON = "开启手电";
var LIGHT_OFF = "关闭手电";
var OUT_OF_BATTERY = "电池已经耗尽";
var DEAD_MESSAGE = "你死了！";
var WAIT_MESSAGE = "正在等待游戏开始...";
var CONNECTING_MESSAGE = "正在连接服务器...";
var REVIVE_MESSAGE = "正在复活...";


var light_on = false;

/*
 **  Global variable define
 */
var resultDiv = document.getElementById("results");
var reviveCountDiv = document.getElementById("reviveCounter");
var flashLightButton = document.getElementById("flashLight");
var interactButton = document.getElementById("interact");
var timer = null;


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
    //prepare the QRScanner
    QRScanner.prepare(function(err, status) {
        if (err) {
            alert("QR scanner failed!");
        }
    });
    //initialize and reset
    reset();
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
    interact();
}

function onClickFlashLightButton() {
    //disable the flashlight button to prevent faster click
    shortlyDisableButton(flashLightButton);
    shortlyLockUI();

    //Switch on the flashlight
    if (counter > 0 && flashLightButton.innerHTML == LIGHT_ON) {
        turnOnLight();
    } else if (flashLightButton.innerHTML == LIGHT_OFF) {
        turnOffLight();
    } else {
        //do nothing as in this condition the battery may run out
    }

}

function exitApp() {
    if (timer) {
        window.clearInterval(timer);
        timer = null;
    }
    navigator.app.exitApp();
}

function onResume() {}
