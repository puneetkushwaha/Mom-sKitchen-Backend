const isStoreOpen = (settings) => {
    if (!settings) return true;
    if (settings.isHolidayMode) return false;

    if (!settings.timings || !settings.timings.open || !settings.timings.close) {
        return true; // Default to open if no specific schedule set, but only if not on holiday
    }

    const parseTime = (timeStr) => {
        if (!timeStr) return 0;
        const normalized = timeStr.trim().toUpperCase();

        // Match HH:MM with optional AM/PM
        const match = normalized.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/);
        if (!match) return 0;

        let hours = parseInt(match[1], 10);
        const minutes = parseInt(match[2], 10);
        const modifier = match[3];

        if (modifier === 'PM' && hours !== 12) hours += 12;
        if (modifier === 'AM' && hours === 12) hours = 0;

        return hours * 60 + minutes;
    };

    const now = new Date();
    // Use IST (India Standard Time) as the reference, or just system time since it's a local shop
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const openMinutes = parseTime(settings.timings.open);
    const closeMinutes = parseTime(settings.timings.close);

    if (closeMinutes < openMinutes) {
        // Over-night case (e.g., 9 PM to 2 AM)
        return currentMinutes >= openMinutes || currentMinutes <= closeMinutes;
    }

    return currentMinutes >= openMinutes && currentMinutes <= closeMinutes;
};

module.exports = { isStoreOpen };
