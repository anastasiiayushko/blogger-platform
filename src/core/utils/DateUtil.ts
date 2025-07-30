export class DateUtil {
  static add(date: Date, { hours = 0, minutes = 0 }): Date {
    const targetDate = new Date(date);
    const h = isNaN(+hours) ? 0 : +hours;
    const m = isNaN(+minutes) ? 0 : +minutes;
    const crtH = targetDate.getUTCHours();
    const crtM = targetDate.getUTCMinutes();
    targetDate.setUTCHours(crtH + h, crtM + m);
    return targetDate;
  }

  static hasExpired(current: Date, expiration: Date): boolean {
    console.log('hasExpired start');
    console.log(current, expiration);
    console.log(current > expiration);
    console.log('hasExpired end');
    return current > expiration;
  }
}
