// set time to update every second
setInterval(function() {
	setTime()
}, 1000)

function setTime() {
	var d = new Date()
	var hours = d.getHours() % 12
	var minutes = d.getMinutes()
	if (minutes < 10) { minutes = '0' + minutes}
	document.getElementById('time').innerHTML = hours + ':' + minutes
}

function goToApps() {
	chrome.tabs.update({
        url:'chrome://apps'
    });
}

function save(k, v) {
	chrome.storage.local.set({k:v})
}

// initialize everything when ready
$(document).ready(function() {
	
	// set initial time
	setTime()

	// apps button listener
	var btnApps = document.getElementById('btn-apps')
	btnApps.addEventListener('click', goToApps)

	// fade in all content
	$('body').animate({
		'opacity': '1.0',
	}, 200)

	// get name
	chrome.storage.local.get('name', function(result) {
		if ('name' in result) {
			alert(result.name)
		}
		else {
		//	prompt('what\'s your name?')
		}
	})

	// get city
	chrome.storage.local.get('city', function(result) {
		console.log(result)
	})

	// get state
	chrome.storage.local.get('state', function(result) {
		console.log(result)
	})


	// get weather
	$.simpleWeather({
	    location: 'Austin, TX',
	    woeid: '',
	    unit: 'f',
	    success: function(weather) {
	    	$('#weather-temp').html(weather.temp)
	    	$('#weather-conditions').html(weather.currently + ' in ' + weather.city)
	    }
	})
})
