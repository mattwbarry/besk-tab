var name
var city
var state

function setTime() {
	var d = new Date()
	var hours = d.getHours()
	if (getLocal('time-format') != '24') {
		hours %= 12
	}
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
	localStorage[k] = v
}

function getLocal(k) {
	return localStorage[k]
}

function reset() {
	localStorage.clear()
}

// initialize normal functionality
function init() {
	$('.init').remove()
	$('.load').css('display', 'block')
	setTime()

	// initialize settings
	$('#s-name').val(getLocal('name'))
	$('#s-city').val(getLocal('city'))
	$('#s-state').val(getLocal('state'))
	$('#s-time-format').html(getLocal('time-format') + ' hour clock')

	// apps button listener
	var btnApps = document.getElementById('btn-apps')
	btnApps.addEventListener('click', goToApps)

	// get weather
	$.simpleWeather({
		location: getLocal('city') + ', ' + getLocal('state'),
		woeid: '',
		unit: 'f',
		success: function(weather) {
	    	$('#weather-temp').html(weather.temp)
			$('#weather-conditions').html(weather.currently + ' in ' + weather.city)
		}
	})
}

function ask() {
	$('#q-name').css('display', 'block')

	// set initial starting vars
	save('time-format', '12')

}

function closeSettings(e) {
	if ($(e.target).closest('#settings-wrapper').length == 0) {
		$('#settings-wrapper').animate({
			'right': '-200px'
		}, 200)
		$(window).unbind('click', closeSettings)
	}
}

// set time to update every second
setInterval(function() {
	setTime()
}, 1000)

// listeners
$(document).on('keypress', '#a-name', function(e) {
	if (e.which == 13 && $(this).val() != '') {
		save('name', $(this).val())
		$('#q-name').fadeOut()
		$('#q-location').fadeIn()		
	}
})

$(document).on('keypress', '#a-city, #a-state', function(e) {
	if (e.which == 13 && $('#a-city').val() != '' && $('#a-state').val().length == 2) {
		save('city', $('#a-city').val())
		save('state', $('#a-state').val())
		$('#q-location').fadeOut()
		init()
	}
})

// initialize everything when ready
$(document).ready(function() {

	// fade in all content
	$('body').animate({
		'opacity': '1.0',
	}, 200)

	// get name
	if ('name' in localStorage) {
		init()
	}
	else {
		ask()
	}

	// settings controls
	$('#btn-settings').on('click', function() {
		$('#settings-wrapper').animate({
			'right': '0px'
		}, 200)
		setTimeout(function() {
			$(window).bind('click', closeSettings)
		}, 100)
	})
	$('.s-text').on('keypress', function(e) {
		if (e.which == 13 && $(this).val() != '') {
			$.each($('.s-text'), function() {
				save($(this).attr('data-key'), $(this).val())
			})
			init()
		}
	})
	$('#s-time-format').on('click', function() {
		if (getLocal('time-format') == '24') {
			save('time-format', '12')
			$('#s-time-format').html('12 hour clock')
		}
		else {
			save('time-format', '24')
			$('#s-time-format').html('24 hour clock')
		}
	})
})
