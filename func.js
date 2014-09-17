// https://chrome.google.com/webstore/detail/bdfepnbidifkfllmhcahbomkbgkjhbph/publish-delayed?hl=en&gl=US

var name
var city
var state

function setTime() {
	var d = new Date()
	var hours = d.getHours()
	if (getLocal('time-format') != '24') {
		hours %= 12
		if (hours == 0) {
			hours = 12
		}
	}
	var minutes = d.getMinutes()
	if (minutes < 10) { minutes = '0' + minutes}
	document.getElementById('time').innerHTML = hours + ':' + minutes
}

function setWeather() {
	$.simpleWeather({
		location: getLocal('city') + ', ' + getLocal('state'),
		woeid: '',
		unit: getLocal('temp-units').toLowerCase(),
		success: function(weather) {
	    	$('#weather-temp').html(weather.temp + '&#176;')
			$('#weather-conditions-text').html(weather.currently + ' in ' + weather.city)
			$('#weather-conditions-icon-img').attr('src', '/art/weather/light/' + weather.code + '.png')
			if (getLocal('show-icon') == 'true') {
				$('#weather-conditions-icon-img').css('display', 'inline-block')
			}
			else {
				$('#weather-conditions-icon-img').css('display', 'none')
			}
			if (getLocal('show-5-day') == 'true') {
				$('#weather-5-day').css('display', 'block')
			}
			else {
				$('#weather-5-day').css('display', 'none')
			}

			// 5 day
			for (var i = 1; i <= 5; i++) {
				$('#weather-5-day-' + i).find('.weather-5-day-icon img').attr('src', 'art/weather/light/' + weather.forecast[i-1].code + '.png')
				$('#weather-5-day-' + i).find('.weather-5-day-high').html(weather.forecast[i-1].high + '&#176;')
				$('#weather-5-day-' + i).find('.weather-5-day-low').html(weather.forecast[i-1].low + '&#176;')
			}

		}
	})
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
	$('#s-units').val('Units: ' + getLocal('temp-units'))
	if (!getLocal('show-icon')) {
		$('#s-icon').val('Don\'t show weather icon')
	}
	$('#s-time-format').html(getLocal('time-format') + ' hour clock')

	// apps button listener
	var btnApps = document.getElementById('btn-apps')
	btnApps.addEventListener('click', goToApps)

	// get weather
	setWeather()

	// set up calendar
	loadGAPI()
}

function ask() {
	$('#q-name').css('display', 'block')

	// set initial starting vars
	save('time-format', '12')
	save('temp-units', 'F')
	save('show-5-day', 'true')
	save('show-icon', 'true')

}

function closeSettings(e) {
	if ($(e.target).closest('#settings-wrapper').length == 0) {
		$('#settings-wrapper').animate({
			'right': '-275px'
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
		// put caret in city box
		$('#a-city').focus()
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

// check for updating calendar
today = new Date()
minDateString = today.getFullYear() + '-' + (today.getMonth()+1) + '-' + today.getDate() + 'T00:00:00Z'
nextWeek = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 21);
maxDateString = nextWeek.getFullYear() + '-' + (nextWeek.getMonth()+1) + '-' + nextWeek.getDate() + 'T00:00:00Z'

// initialize google api
function loadGAPI() {
	// if calendar has already been updated today, just show the data from cache
	if (getLocal('cal-month-update') >= today.getMonth() && getLocal('cal-day-update') >= today.getDate()) {
		showCalendar(JSON.parse(getLocal('calendar')))
	}
	else {
		gapi.client.setApiKey('AIzaSyDgfugfUxBUoh1X1Pkg3oM5ixc0OGOmLtQ');
		gapi.client.load('calendar', 'v3', function() {
			auth()
		});
	}
}

function auth() {
	var config = {
		'client_id': '197834303893-mt54ane9s0io1q6m81v79r51tmlppo6h.apps.googleusercontent.com',
		'scope': 'https://www.googleapis.com/auth/calendar',
		'immediate': true
	};
	gapi.auth.authorize(config, function() {
		console.log('login complete');
		console.log(gapi.auth.getToken());
		getCalList()
	});
}

function getCalList() {
	var request = gapi.client.calendar.calendarList.list()
	request.execute(function(resp) {
		console.log(resp)
		calID = resp.items[0].id
		getEventList(calID)
	})
}

function getEventList(calID) {

	var request = gapi.client.calendar.events.list({
		'calendarId': calID,
		'timeMin': minDateString,
		'timeMax': maxDateString
	})
	request.execute(function(resp) {

		// error handle
		if ('code' in resp) {
			console.log('not code 200')
			console.log(resp)
			return
		}

		// save cal to local storage
		save('calendar', JSON.stringify(resp))
		save('cal-month-update', today.getMonth())
		save('cal-day-update', today.getDate())

		console.log(resp)
		
		showCalendar(resp)

	})
}

function showCalendar(resp) {

	// clear current calendar list
	$('#gcalendar-wrapper').html('')

	var dates_list = []
	// sort events by date - google api sometimes returns events out of order
	for (var i = 0; i < resp.items.length; i++) {
		// if item only has date and no time
		if (!resp.items[i].start.dateTime) {
			var date = resp.items[i].start.date
			console.log(resp.items[i].summary + ' : ' + date)
		}
		// it item has both date and time
		else {
			var date = resp.items[i].start.dateTime.split('T')[0].split('-')
			var time = resp.items[i].start.dateTime.split('T')[1].split(':')
			var dt = new Date(date[0], date[1] - 1, date[2], time[0], time[1])
			//console.log(resp.items[i].summary + ' : ' + date[1] + '/' + date[2] + '/' + date[0])
			//console.log(dt)
			dates_list.push([dt, resp.items[i]])
		}
	}
	var date_sort_asc = function (date1, date2) {
		if (date1[0] > date2[0]) return 1
		if (date1[0] < date2[0]) return -1
		return 0
	};
	dates_list.sort(date_sort_asc)
	console.log(dates_list)
	// display events
	var days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
	var months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
	for (var i = 0; i < dates_list.length; i++) {
		// determine 24hr/12hr time
		if (getLocal('time-format') == '12') {
			var eventTime = formatAMPM(dates_list[i][0])
		}
		else {
			var eventTime = dates_list[i][0].getHours() + ':' + ('0' + dates_list[i][0].getMinutes()).slice(-2)
		}
		// append event to event list
		if (i == 0 || dates_list[i][0].getDay() != dates_list[i - 1][0].getDay() || i == 0) {
			$('#gcalendar-wrapper').append('<div class="gcalendar-title">' + days[dates_list[i][0].getDay()] + ' ' + months[dates_list[i][0].getMonth()] + ' ' + dates_list[i][0].getDate() + '</div>')
			$('#gcalendar-wrapper').append('<div class="gcalendar-summary">' + eventTime + ' - ' + dates_list[i][1].summary + '</div>')
		}
		else {
			$('#gcalendar-wrapper').append('<div class="gcalendar-summary">' + eventTime + ' - ' + dates_list[i][1].summary + '</div>')
		}
	}
}

function formatAMPM(date) {
	var hours = date.getHours();
	var minutes = date.getMinutes();
	var ampm = hours >= 12 ? 'pm' : 'am';
	hours = hours % 12;
	hours = hours ? hours : 12; // the hour '0' should be '12'
	minutes = minutes < 10 ? '0'+minutes : minutes;
	var strTime = hours + ':' + minutes + ' ' + ampm;
	return strTime;
}

// initialize everything when ready
$(document).ready(function() {

	// set background image
	var numBackgrounds = 24
	$('body').css('background', 'url(' + chrome.extension.getURL('art/wallpapers/' + Math.ceil(Math.random() * numBackgrounds) + '.png') + ')')

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
			setTime()
			showCalendar(JSON.parse(getLocal('calendar')))
		}
		else {
			save('time-format', '24')
			$('#s-time-format').html('24 hour clock')
			setTime()
			showCalendar(JSON.parse(getLocal('calendar')))
		}
	})
	$('#s-5-day').on('click', function() {
		if (getLocal('show-5-day') == 'true') {
			save('show-5-day', 'false')
			$('#s-5-day').html('Don\'t show 5 day')
			setWeather()
		}
		else {
			save('show-5-day', 'true')
			$('#s-5-day').html('Show 5 day')
			setWeather()
		}
	})
	$('#s-icon').on('click', function() {
		if (getLocal('show-icon') == 'true') {
			save('show-icon', 'false')
			$('#s-icon').html('Don\'t show weather icon')
			$('#weather-conditions-icon-img').css('display', 'none')
		}
		else {
			save('show-icon', 'true')
			$('#s-icon').html('Show weather icon')
			$('#weather-conditions-icon-img').css('display', 'inline-block')
		}
	})
	$('#s-units').on('click', function() {
		if (getLocal('temp-units') == 'F') {
			save('temp-units', 'C')
			$('#s-units').html('Units: C')
			setWeather()
		}
		else {
			save('temp-units', 'F')
			$('#s-units').html('Units: F')
			setWeather()
		}
	})
})
