// ==UserScript==
// @name         Torn: Organised Crime NO Fly
// @version      0.1
// @description  Add a nice no fly button when your OC is soon
// @author       Cloak [2737340]
// @match        https://www.torn.com/travelagency.php
// @icon         https://www.google.com/s2/favicons?sz=64&domain=torn.com
// @grant        none
// @connect      api.torn.com
// ==/UserScript==

var apiKey = 'APIKEY'; // Put your API KEY Here
var noGoHours = 10; // time in hours to not let you fly without hassle


// --- Don't edit below this line
const torn_getInfo = async () => {
    let url = `https://api.torn.com/user/?selections=timestamp,icons&key=${apiKey}`;
    return new Promise((resolve, reject) => {
        $.getJSON(url).done((result) => {
			if (result.error != undefined){
				reject(result.error);
			} else {
				resolve(result);
			}
			})
			.fail(function( jqxhr, textStatus, error ) {
				var err = textStatus + ', ' + error;
				reject(err);
			});
    });
}

// Shoutout to TornTools for the text to time function See https://github.com/Mephiles/torntools_extension

const TO_MILLIS = {
    SECONDS: 1000,
    MINUTES: 1000 * 60,
    HOURS: 1000 * 60 * 60,
    DAYS: 1000 * 60 * 60 * 24,
};

function textToTime(time, options = {}) {
    options = {
        short: false,
        ...options,
    };

    let millis = 0;

    if (time.includes(":")) {
        const parts = time.split(":");

        if (parts.length === 2) {
            if (options.short) {
                millis += parseInt(parts[0]) * TO_MILLIS.MINUTES;
                millis += parseInt(parts[1]) * TO_MILLIS.SECONDS;
            } else {
                millis += parseInt(parts[0]) * TO_MILLIS.HOURS;
                millis += parseInt(parts[1]) * TO_MILLIS.MINUTES;
            }
        } else if (parts.length === 4) {
            millis += parseInt(parts[0]) * TO_MILLIS.DAYS;
            millis += parseInt(parts[1]) * TO_MILLIS.HOURS;
            millis += parseInt(parts[2]) * TO_MILLIS.MINUTES;
            millis += parseInt(parts[3]) * TO_MILLIS.SECONDS;
        }
    } else {
        let group;
        // noinspection JSUnusedAssignment
        if ((group = time.match(/([0-9]+) ?d/i))) {
            millis += parseInt(group[1]) * TO_MILLIS.DAYS;
        }
        if ((group = time.match(/([0-9]+) ?h/i))) {
            millis += parseInt(group[1]) * TO_MILLIS.HOURS;
        }
        if ((group = time.match(/([0-9]+) ?min/i))) {
            millis += parseInt(group[1]) * TO_MILLIS.MINUTES;
        }
        if ((group = time.match(/([0-9]+) ?s/i))) {
            millis += parseInt(group[1]) * TO_MILLIS.SECONDS;
        }
    }

    return millis;
}

async function waitForTravelButton() {
    return new Promise((resolve) => {
        let buttonPresent = setInterval(() => {
            if ($("button:contains('TRAVEL'):visible").length) {
                setInterval(() => {
                    resolve(true);
                }, 250);
                return clearInterval(buttonPresent);
            }
        });
    });
}

async function waitForTravelQuestion() {
    return new Promise((resolve) => {
        let spanPresent = setInterval(() => {
            if ($(".travel-question > span:visible").length || $("button:contains('TRAVEL'):visible").length) {
                setInterval(() => {
                    resolve(true);
                }, 250);
                return clearInterval(spanPresent);
            }
        });
    });
}

let user = await torn_getInfo();
let crimeTime = user.icons.icon85 ?
    user.timestamp * TO_MILLIS.SECONDS + textToTime(user.icons.icon85.split("-").slice(-1)[0].trim()) :
    user.icons.icon86 ?
    user.timestamp * TO_MILLIS.SECONDS :
    -1;

async function loopy(){
// Wait for travel button
    await waitForTravelButton();
    // is time less than noGoHours?
    if (crimeTime < user.timestamp * TO_MILLIS.SECONDS + (noGoHours * TO_MILLIS.HOURS)) {
        $("button:contains('TRAVEL'):visible").css("color", "white")
        $("button:contains('TRAVEL'):visible").css("background", "red")
        $("button:contains('TRAVEL'):visible").html("NO-FLY")
        // SO U WANNA PRESS TRAVEL ANYWAY?
        await waitForTravelQuestion();
        let old = $(".travel-question > span:visible").html()
        $(".travel-question > span:visible").html("<span style='color: red;'><b>Are you <u>REALLY SURE?</u>. You have an OC due in less than 10 hours.</b></span><br>" + old)
        $("button:contains('CONTINUE'):visible").css("background", "red")
        $("button:contains('CONTINUE'):visible").css("color", "white")
    }
    window.setTimeout(loopy,200);
}

loopy();
