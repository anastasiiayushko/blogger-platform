export class DateUtil {
  static add(date: Date, { hours = 0, minutes = 0 }): Date {
    const targetDate = new Date(date);
    const h = isNaN(+hours) ? 0 : hours;
    const m = isNaN(+minutes) ? 0 : minutes;
    console.log(h, m, targetDate, 'targetDate', hours, minutes, date);
    targetDate.setHours(targetDate.getHours() + h);
    // targetDate.setMinutes(targetDate.getMinutes() + m);
    console.log('return date', targetDate.toISOString());
    return targetDate;
  }

  static hasExpired(current: Date, expiration: Date): boolean {
    return current > expiration;
  }
}
