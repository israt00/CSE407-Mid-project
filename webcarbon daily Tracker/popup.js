
const ENERGY_PER_PAGE_KWH = 0.0002; // kWh per page view (example)
const CARBON_INTENSITY = 0.7; // kg CO2 per kWh


// --- HELPER FUNCTIONS ---
function getTodayDate() {
    const now = new Date();
    return now.toISOString().split('T')[0]; // YYYY-MM-DD
}

function displayStats(todayStats) {
    document.getElementById('pageCount').textContent = todayStats.pageCount;
    document.getElementById('energyKWh').textContent = todayStats.energyKWh.toFixed(5) + " kWh";
    document.getElementById('carbonKg').textContent = todayStats.carbonKg.toFixed(4) + " kg CO₂";
}

// --- LOAD & UPDATE DAILY STATS ---
chrome.storage.local.get(['dailyStats'], (result) => {
    let stats = result.dailyStats || {};
    const today = getTodayDate();

    if (!stats[today]) {
        stats[today] = {
            pageCount: 0,
            energyKWh: 0,
            carbonKg: 0
        };
    }

    // Increment page count when popup opens
    stats[today].pageCount += 1;
    stats[today].energyKWh = stats[today].pageCount * ENERGY_PER_PAGE_KWH;
    stats[today].carbonKg = stats[today].energyKWh * CARBON_INTENSITY;

    // Save back
    chrome.storage.local.set({ dailyStats: stats }, () => {
        console.log("Updated daily stats:", stats[today]);
        displayStats(stats[today]);
    });
});


// --- EXPORT CSV FUNCTION ---
document.getElementById('downloadCSV').addEventListener('click', () => {
    chrome.storage.local.get(['dailyStats'], (result) => {
        const stats = result.dailyStats || {};
        const rows = [
            ["Date", "Page Views", "Energy (kWh)", "Carbon (kg CO2)"]
        ];

        for (const [date, data] of Object.entries(stats)) {
            rows.push([
                date,
                data.pageCount,
                data.energyKWh.toFixed(5),
                data.carbonKg.toFixed(4)
            ]);
        }

        // Convert to CSV text
        const csvContent = rows.map(row => row.join(",")).join("\n");

        // Create downloadable blob
        const blob = new Blob([csvContent], { type: "text/csv" });
        const url = URL.createObjectURL(blob);

        // Create a temporary link to trigger download
        const a = document.createElement('a');
        a.href = url;
        a.download = "webcarbon_daily_stats.csv";
        a.click();

        // Cleanup
        URL.revokeObjectURL(url);
    });
});


// --- AUTO RESET AT MIDNIGHT ---
function scheduleDailyReset() {
    const now = new Date();
    const millisTillMidnight =
        new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 0, 0) - now;

    setTimeout(() => {
        chrome.storage.local.get(['dailyStats'], (result) => {
            let stats = result.dailyStats || {};
            const today = getTodayDate();
            if (!stats[today]) {
                stats[today] = { pageCount: 0, energyKWh: 0, carbonKg: 0 };
            }
            chrome.storage.local.set({ dailyStats: stats }, () => {
                displayStats(stats[today]);
            });
        });
        scheduleDailyReset();
    }, millisTillMidnight);
}

scheduleDailyReset();
