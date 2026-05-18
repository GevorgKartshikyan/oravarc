import moment from 'moment';

function getSpecialDaysCount(eventStart, eventEnd, holidays = []) {
    const existDaysSet = new Set();
    const start = moment(eventStart).startOf('day');
    const end = moment(eventEnd).startOf('day');
    const totalDays = end.diff(start, 'days') + 1;

    for (let i = 0; i < totalDays; i++) {
        const current = start.clone().add(i, 'days');
        const weekday = current.isoWeekday(); // 6 = суббота, 7 = воскресенье
        const isWeekend = weekday === 6 || weekday === 7;
        const isHoliday = holidays.some(holiday =>
            moment(holiday.start).isSame(current, 'day')
        );
        if (isWeekend || isHoliday) {
            existDaysSet.add(current.format('YYYY-MM-DD'));
        }
    }

    return existDaysSet.size;
}

export default getSpecialDaysCount;
