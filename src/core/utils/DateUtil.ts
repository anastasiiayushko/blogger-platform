export class DateUtil {
  static add(date: Date, { hours = 0, minutes = 0 }): Date {
    const targetDate = new Date(date);
    const h = isNaN(+hours) ? 0 : hours;
    const m = isNaN(+minutes) ? 0 : minutes;
    targetDate.setHours(targetDate.getHours() + h);
    targetDate.setMinutes(targetDate.getMinutes() + m);
    return targetDate;
  }

  static hasExpired(current: Date, expiration: Date): boolean {
    return current > expiration;
  }
}
