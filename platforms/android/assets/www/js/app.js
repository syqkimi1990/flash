var resultDiv;
var leftSeconds = 10;
var startTime;
var endTime;
var timer;

document.addEventListener("deviceready", init, false);
function init() {
	document.querySelector("#startScan").addEventListener("touchend", startScan, false);
	document.querySelector("#flashLight").addEventListener("touchend", flashLight, false);
	resultDiv = document.querySelector("#results");
}

function startScan() {

	cordova.plugins.barcodeScanner.scan(
		function (result) {
			var s = "Result: " + result.text + "<br/>" +
			"Format: " + result.format + "<br/>" +
			"Cancelled: " + result.cancelled;
			resultDiv.innerHTML = s;
			if (result != null) {
				leftSeconds = leftSeconds +10;
				window.alert('left time' + leftSeconds);
			}
		}, 
		function (error) {
			alert("Scanning failed: " + error);
		}
	);

}

function flashLight() {

	window.plugins.flashlight.available(function(isAvailable) {
		if (isAvailable) {


			if (window.plugins.flashlight.isSwitchedOn() != true && leftSeconds > 1) {
				// switch on
				window.plugins.flashlight.switchOn(
					function () {
						var d = new Date();
						startTime = d.getTime();
					}, // optional success callback
					function () {
						alert("Flashlight switch fails");
					}, // optional error callback
					{intensity: 0.3} // optional as well
				);

				// // switch off after 10 seconds
				timer = setTimeout(function() {
					window.plugins.flashlight.switchOff(); // success/error callbacks may be passed
				}, leftSeconds*1000);

			} else {
				var d = new Date();
				endTime = d.getTime();
				window.clearTimeout(timer);
				var delta = endTime - startTime;
				leftSeconds = leftSeconds - delta/1000

				if(leftSeconds <= 0){
					window.alert('No time left (10s used up)');
				} else {
					window.alert('left time' + leftSeconds);
				}

				window.plugins.flashlight.switchOff();
			}


		} else {
			alert("Flashlight not available on this device");
		}
	});

}