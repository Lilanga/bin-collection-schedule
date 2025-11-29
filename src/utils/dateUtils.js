export const getDayOfWeek = (dayName) => {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days.indexOf(dayName);
};

export const getNextCollectionDate = (startDate, dayOfWeek, weeksInterval) => {
    const start = new Date(startDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let current = new Date(start);
    const targetDay = getDayOfWeek(dayOfWeek);

    while (current.getDay() !== targetDay) {
        current.setDate(current.getDate() + 1);
    }

    while (current < today) {
        current.setDate(current.getDate() + (weeksInterval * 7));
    }

    return current;
};

export const getCollectionDates = (startDate, dayOfWeek, weeksInterval, count = 4) => {
    const dates = [];
    let current = getNextCollectionDate(startDate, dayOfWeek, weeksInterval);

    for (let i = 0; i < count; i++) {
        dates.push(new Date(current));
        current = new Date(current);
        current.setDate(current.getDate() + (weeksInterval * 7));
    }

    return dates;
};

export const formatDate = (date) => {
    const options = { weekday: 'short', month: 'short', day: 'numeric' };
    return date.toLocaleDateString('en-AU', options);
};

export const isThisWeek = (date) => {
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 6);
    weekEnd.setHours(23, 59, 59, 999);

    return date >= weekStart && date <= weekEnd;
};
