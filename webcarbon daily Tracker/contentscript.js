

chrome.runtime.sendMessage({ type: 'increment' }, function(response) {
    console.log("Today's pageview count:", response.dailyCount);
});
