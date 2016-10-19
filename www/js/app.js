var resultDiv;
var timer;
var counter = 100;
var flashLightButton = document.getElementById("flashLight");

document.addEventListener("deviceready", init, false);
document.addEventListener("backbutton", function() {
	// pass exitApp as callbacks to the switchOff method
	window.plugins.flashlight.switchOff(exitApp, exitApp);
}, false);
document.addEventListener("resume", onResume, false);

function init() {
	document.querySelector("#startScan").addEventListener("touchend", startScan, false);
	document.querySelector("#flashLight").addEventListener("touchend", flashLight, false);
	document.querySelector("#reset").addEventListener("touchend", reset, false);
	resultDiv = document.querySelector("#results");
}

function startScan() {
	if (window.plugins.flashlight.isSwitchedOn()) {
		window.plugins.flashlight.switchOff(scanQrCode, function() {window.alert("Flashlight switch on fails");});
		window.clearInterval(timer);
		flashLightButton.innerHTML = "Open Flashlight";
	} else {
		scanQrCode();
	}

}

function flashLight() {

	window.plugins.flashlight.available(function(isAvailable) {
		if (isAvailable) {

			if (window.plugins.flashlight.isSwitchedOn() == false && counter > 0 && flashLightButton.innerHTML == "Open Flashlight") {
				flashLightButton.innerHTML = "Close Flashlight";
				// switch on
				window.plugins.flashlight.switchOn(
					function () {
					}, // optional success callback
					function () {
						window.alert("Flashlight switch on fails");
					}, // optional error callback
					{intensity: 0.3} // optional as well
					);

				timer = window.setInterval(function() {
					counter--;
					if(counter < 0) {
						window.plugins.flashlight.switchOff();
						window.clearInterval(timer);
						counter = 0;
						flashLightButton.innerHTML = "No More Battery";
					} else {
						resultDiv.innerHTML = "Battery Time Left (s):" + (counter/10).toFixed(1).toString();
					}
				}, 100);

			} else if (flashLightButton.innerHTML=="Close Flashlight") {
				flashLightButton.innerHTML = "Open Flashlight";
				if (timer) {
					window.clearInterval(timer);
					timer = null;
				}

				if(counter <= 0){
					window.alert('No time left (10s used up)');
				} else {
					//window.alert('left time' + counter/10);
				}

				window.plugins.flashlight.switchOff(
					function () {
					}, // optional success callback
					function () {
						window.alert("Flashlight switch off fails");
					}
				);
			} else {
				//do nothing
			}


		} else {
			window.alert("Flashlight not available on this device");
		}
	});

}

function reset() {
	if (window.plugins.flashlight.isSwitchedOn()) {
		window.plugins.flashlight.switchOff();
		if (timer) {
			window.clearInterval(timer);
		}
	}

	timer = null;
	flashLightButton.innerHTML = "Open Flashlight";
	counter = 100;
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
						counter = 100;
						resultDiv.innerHTML = "Battery Time Left (s):" + (counter/10).toFixed(1).toString();
						window.alert("You have another 10s to use");
						flashLightButton.innerHTML = "Open Flashlight";
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