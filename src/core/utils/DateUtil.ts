export class DateUtil {
  static add(date: Date, { hours = 0, minutes = 0 }): Date {
    const targetDate = new Date(date);
    targetDate.setHours(targetDate.getHours() + hours);
    targetDate.setMinutes(targetDate.getMinutes() + minutes);

    return targetDate;
  }

  static hasExpired(current: Date, expiration: Date): boolean {
    return current > expiration;
  }
}
