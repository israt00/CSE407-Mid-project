var storage =  chrome.storage.local;
// background.js

var _dayPrefix = 'p';
var _dailyCount = 0;
var _keepDays = 45;

// Format date as YYYYMMDD
function formatDate(prev, sep) {
    sep = sep ? sep : "";
    var now = new Date();
    var td = new Date(now.getFullYear(), now.getMonth(), now.getDate() - prev);
    var dateParts = [
        ('0000' + td.getFullYear()).slice(-4),   // year: YYYY
        ('00' + (td.getMonth() + 1)).slice(-2), // month: MM
        ('00' + td.getDate()).slice(-2)         // day: DD
    ];
    return dateParts.join(sep);
}

function getDayKey(d) {
    return _dayPrefix + d;
}

// Get the pageview count for a specific day
function getDayCount(previous, callback) {
    var key = getDayKey(formatDate(previous));
    chrome.storage.local.get([key], function(result) {
        var c = result[key] || 0;
        callback(parseInt(c));
    });
}

// Set the pageview count for a specific day
function setDayCount(previous, value) {
    var key = getDayKey(formatDate(previous));
    var obj = {};
    obj[key] = value;
    chrome.storage.local.set(obj);
}

// Get all keys with prefix
function getAllKeys(prefix, callback) {
    chrome.storage.local.get(null, function(items) {
        var keys = Object.keys(items).filter(k => k.startsWith(prefix));
        callback(keys);
    });
}

// Get keys older than `keep` days
function getOldDayKeys(keep, callback) {
    var newKeys = [];
    for (var i = 0; i < keep; i++) {
        newKeys.push(getDayKey(formatDate(i)));
    }
    getAllKeys(_dayPrefix, function(keys) {
        var oldKeys = keys.filter(k => !newKeys.includes(k));
        callback(oldKeys);
    });
}

// Purge old keys
function purgeOldKeys(keep) {
    getOldDayKeys(keep, function(oldKeys) {
        oldKeys.forEach(function(k) {
            chrome.storage.local.remove(k);
        });
    });
}

// Listen for messages from content scripts or popup
// background.js
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'increment') {
        // Your logic here
        let newCount = 1; // example
        sendResponse({ dailyCount: newCount });
    }
    return true; // keep channel open for async sendResponse
});
