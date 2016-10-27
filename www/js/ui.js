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
    if (document.getElementById('serverURL').value == "" || document.getElementById('localID').value == "") {
        window.alert("两个都要认真填写哦！");
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