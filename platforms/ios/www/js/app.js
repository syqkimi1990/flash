/*
* Constant define
*/
var BATTERY_LIFE = 400; //4000 milliseconds
var LIGHT_ON = "Light On";
var LIGHT_OFF = "Light Off";
var OUT_OF_BATTERY = "No More Battery";

/*
**  Global variable define
*/
var resultDiv;
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
	document.querySelector("#recharge").addEventListener("touchend", startScan, false);
	document.querySelector("#flashLight").addEventListener("touchend", flashLight, false);
	document.querySelector("#reset").addEventListener("touchend", reset, false);
	resultDiv = document.querySelector("#results");
}

function startScan() {
	//disable recharge button when it is pressed
	rechargeButton.classList.add("disabled");
	setTimeout(function(){
		rechargeButton.classList.remove("disabled");
	}, 500)

	//If recharge button is pressed when the flash light is on, turn off first
	if (window.plugins.flashlight.isSwitchedOn()) {
		window.plugins.flashlight.switchOff(scanQrCode, function() {window.alert("Flashlight switch on fails");});
		window.clearInterval(timer);
		flashLightButton.innerHTML = LIGHT_ON;
	} else {
		scanQrCode();
	}
}

function flashLight() {

	//disable the flashlight button to prevent faster click
	document.querySelector("#flashLight").removeEventListener("touchend", flashLight, false);
	flashLightButton.classList.add("disabled");
	setTimeout(function(){
    	document.querySelector("#flashLight").addEventListener("touchend", flashLight, false);
		flashLightButton.classList.remove("disabled");
    }, 500)

	window.plugins.flashlight.available(function(isAvailable) {
		if (isAvailable) {

			//Switch on the flashlight
			if (window.plugins.flashlight.isSwitchedOn() == false && counter > 0 && flashLightButton.innerHTML == LIGHT_ON) {

				// switch on flash light
				window.plugins.flashlight.switchOn(
					function () {
					}, // success callback
					function () {
						window.alert("Flashlight switch on fails");
						window.plugins.flashlight.switchOff();
					}, // error callback
					{intensity: 0.5}
					);

				flashLightButton.innerHTML = LIGHT_OFF;
				// Start timer when the flash light is on
				timer = window.setInterval(function() {
					counter--;
					if(counter < 0) {
						window.plugins.flashlight.switchOff();
						window.clearInterval(timer);
						counter = 0;
						flashLightButton.innerHTML = OUT_OF_BATTERY;
						flashLightButton.classList.add("disabled");
					} else {
						resultDiv.innerHTML = "Battery Time Left (s):" + (counter/10).toFixed(1).toString();
					}
				}, 100);


			} else if (flashLightButton.innerHTML == LIGHT_OFF) {
			    if (timer) {
                    window.clearInterval(timer);
                    timer = null;
                }

				flashLightButton.innerHTML = LIGHT_ON;

				window.plugins.flashlight.switchOff(
					function () {
					}, // optional success callback
					function () {
						window.alert("Flashlight switch off fails");
					}
				);
			} else {
				//do nothing as in this condition the battery may run out
			}

		} else {
			window.alert("Flashlight not available on this device");
		}
	});

}

function reset() {

	//disable the flashlight button for 0.5s when the reset is pressed to prevent quick click
	resetButton.classList.add("disabled");
	document.querySelector("#flashLight").removeEventListener("touchend", flashLight, false);
	setTimeout(function(){
		document.querySelector("#flashLight").addEventListener("touchend", flashLight, false);
		resetButton.classList.remove("disabled");
	}, 500)

	//if the reset is pressed when the light is on, turn off it first
	if (window.plugins.flashlight.isSwitchedOn()) {
		window.plugins.flashlight.switchOff();
		if (timer) {
			window.clearInterval(timer);
		}
	}

	//Reset the program variables
	timer = null;
	flashLightButton.innerHTML = LIGHT_ON;
	flashLightButton.classList.remove("disabled");
	counter = BATTERY_LIFE;
	resultDiv.innerHTML = "Battery Time Left (s):" + (counter/10).toFixed(1).toString();
}

function scanQrCode() {
	setTimeout(function (){
		cordova.plugins.barcodeScanner.scan(
			function (result) {
				if(!result.cancelled)
				{
					if(result.format == "QR_CODE")
					{
						counter = BATTERY_LIFE;
						resultDiv.innerHTML = "Battery Time Left (s):" + (counter/10).toFixed(1).toString();
						window.alert("You have another 40s to use");
					}
				}
			},
			function (error) {
				window.alert("Scanning failed: " + error);
			}
		)
	}, 500);
}

function exitApp() {
	if (timer) {
		window.clearInterval(timer);
		timer = null;
	}
	navigator.app.exitApp();
}

function onResume() {
}