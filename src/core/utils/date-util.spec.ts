import { DateUtil } from './DateUtil';

describe('dateUtil', () => {
  it('should return a new date minus the time', () => {
    const current = new Date();
    const newDate = DateUtil.add(current, { hours: -2, minutes: -5 });
    expect(newDate.getHours()).toBe(current.getHours() + -2);
    expect(newDate.getMinutes()).toBe(current.getMinutes() + -5);
    expect(newDate.getDate()).toBe(current.getDate());
    expect(newDate.getMonth()).toBe(current.getMonth());
    expect(newDate.getFullYear()).toBe(current.getFullYear());
  });
  it('should return a new date with the hour added ', () => {
    const current = new Date();
    const newDate = DateUtil.add(current, { hours: 1, minutes: 0 });
    expect(newDate.getHours()).toBe(current.getHours() + 1);
    expect(newDate.getDate()).toBe(current.getDate());
    expect(newDate.getMonth()).toBe(current.getMonth());
    expect(newDate.getFullYear()).toBe(current.getFullYear());
  });
  it('should return a new date with the minutes added', () => {
    const current = new Date();
    const newDate = DateUtil.add(current, { hours: 0, minutes: 5 });
    expect(newDate.getMinutes()).toBe(current.getMinutes() + 5);
    expect(newDate.getDate()).toBe(current.getDate());
    expect(newDate.getMonth()).toBe(current.getMonth());
    expect(newDate.getFullYear()).toBe(current.getFullYear());
  });
  it('should return a new date with the hour and minutes added', () => {
    const current = new Date();
    const newDate = DateUtil.add(current, { hours: 1, minutes: 5 });
    expect(newDate.getMinutes()).toBe(current.getMinutes() + 5);
    expect(newDate.getHours()).toBe(current.getHours() + 1);
    expect(newDate.getDate()).toBe(current.getDate());
    expect(newDate.getMonth()).toBe(current.getMonth());
    expect(newDate.getFullYear()).toBe(current.getFullYear());
  });
});
