
export function  getDateTimeString(dateObj, timeStr, timeZoneOffset = 4) {
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, '0');
    const day = String(dateObj.getDate()).padStart(2, '0');
    const [hours, minutes] = timeStr.split(':').map(Number);
    const time = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:00`;
    const sign = timeZoneOffset >= 0 ? '+' : '-';
    const offsetHours = String(Math.abs(timeZoneOffset)).padStart(2, '0');
    const offsetMinutes = '00';
    const offset = `${sign}${offsetHours}:${offsetMinutes}`;
    return `${year}-${month}-${day}T${time}${offset}`;
}
export function getDaysDifference(date1, date2) {
    const start = new Date(Math.min(date1.getTime(), date2.getTime()));
    const end = new Date(Math.max(date1.getTime(), date2.getTime()));
    const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const endDay = new Date(end.getFullYear(), end.getMonth(), end.getDate());
    const msPerDay = 1000 * 60 * 60 * 24;
    const diff = Math.round((endDay.getTime() - startDay.getTime()) / msPerDay);
    return diff + 1;
}

