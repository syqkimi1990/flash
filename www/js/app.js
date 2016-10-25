/*
* Constant define
*/
var BATTERY_LIFE = 400; //4000 milliseconds
var LIGHT_ON = "Light On";
var LIGHT_OFF = "Light Off";
var OUT_OF_BATTERY = "No More Battery";
var SERVER_URL = "http://192.168.1.103:3000";

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
	document.querySelector("#reset").addEventListener("touchend", tryReset, false);
	resultDiv = document.querySelector("#results");
}

function startScan() {
	//disable recharge button when it is pressed
	rechargeButton.classList.add("disabled");
	setTimeout(function(){
		rechargeButton.classList.remove("disabled");
	}, 500)

	//If recharge button is pressed when the flash light is on, turn off first
	// if (window.plugins.flashlight.isSwitchedOn()) {
	// 	window.plugins.flashlight.switchOff(scanQrCode, function() {window.alert("Flashlight switch on fails");});
	// 	window.clearInterval(timer);
	// 	flashLightButton.innerHTML = LIGHT_ON;
	// } else {
		scanQrCode();
	// }
}

function flashLight() {

	//disable the flashlight button to prevent faster click
	document.querySelector("#flashLight").removeEventListener("touchend", flashLight, false);
	flashLightButton.classList.add("disabled");
	setTimeout(function(){
    	document.querySelector("#flashLight").addEventListener("touchend", flashLight, false);
		flashLightButton.classList.remove("disabled");
    }, 500);

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

function tryReset(){
	//disable the flashlight button for 0.5s when the reset is pressed to prevent quick click
	resetButton.classList.add("disabled");
	document.querySelector("#flashLight").removeEventListener("touchend", flashLight, false);
	setTimeout(function(){
		document.querySelector("#flashLight").addEventListener("touchend", flashLight, false);
		resetButton.classList.remove("disabled");
	}, 500);

	//vaildate first before resetting
	validate('/client/reset',function(is_ok){if (is_ok){reset();}});
}

function scanQrCode() {
	setTimeout(function (){
		cordova.plugins.barcodeScanner.scan(
			function (result) {
				if(!result.cancelled)
				{
					if(result.format == "QR_CODE")
					{
						var text = result.text;
						var substrs = text.split(',');
						if (substrs[0] == 'battery'){
							validate('/client/battery?battery_id='+substrs[1],function(is_ok){recharge();});
						}else if(substrs[0] == 'person'){
							//TODO: when the QR code represents a person, try to revive him
						}
						
					}
				}
			},
			function (error) {
				window.alert("Scanning failed: " + error);
			}
		)
	}, 500);
}

function recharge() {
	counter = BATTERY_LIFE;
	resultDiv.innerHTML = "Battery Time Left (s):" + (counter/10).toFixed(1).toString();
}

function exitApp() {
	if (timer) {
		window.clearInterval(timer);
		timer = null;
	}
	navigator.app.exitApp();
}

function validate(url,callback) {
	//send a request to the server to validate if the request is good to proceed
	url = SERVER_URL+url;
	if (url){
		var xmlhttp = new XMLHttpRequest();
		xmlhttp.open('GET',url,true);
		xmlhttp.send();
		xmlhttp.onreadystatechange=function(){
			if (xmlhttp.readyState==4){
				if(xmlhttp.status == 200 || xmlhttp.status == 304){
					callback(true);
				}
			}
		}
	}
//	setTimeout(function(){callback(true)},500);
}

function onResume() {
}