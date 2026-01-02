export interface Holiday {
  name: string;
  date: string;
  type: 'federal' | 'observance';
  description?: string;
}

function calculateEasterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function getNthWeekdayOfMonth(year: number, month: number, weekday: number, n: number): Date {
  const firstDay = new Date(year, month, 1);
  const firstWeekday = firstDay.getDay();
  
  let offset = (weekday - firstWeekday + 7) % 7;
  const day = 1 + offset + (n - 1) * 7;
  
  return new Date(year, month, day);
}

function getLastWeekdayOfMonth(year: number, month: number, weekday: number): Date {
  const lastDay = new Date(year, month + 1, 0);
  const lastDayOfWeek = lastDay.getDay();
  
  let offset = (lastDayOfWeek - weekday + 7) % 7;
  const day = lastDay.getDate() - offset;
  
  return new Date(year, month, day);
}

export function getUSFederalHolidays(year: number): Holiday[] {
  const holidays: Holiday[] = [];

  holidays.push({
    name: "New Year's Day",
    date: new Date(year, 0, 1).toISOString(),
    type: 'federal',
    description: 'Celebrates the beginning of the new year',
  });

  const mlkDay = getNthWeekdayOfMonth(year, 0, 1, 3);
  holidays.push({
    name: "Martin Luther King Jr. Day",
    date: mlkDay.toISOString(),
    type: 'federal',
    description: 'Honors the civil rights leader Martin Luther King Jr.',
  });

  const presidentsDay = getNthWeekdayOfMonth(year, 1, 1, 3);
  holidays.push({
    name: "Presidents' Day",
    date: presidentsDay.toISOString(),
    type: 'federal',
    description: "Honors all U.S. presidents, particularly George Washington and Abraham Lincoln",
  });

  const easter = calculateEasterSunday(year);
  const goodFriday = new Date(easter);
  goodFriday.setDate(easter.getDate() - 2);
  holidays.push({
    name: 'Good Friday',
    date: goodFriday.toISOString(),
    type: 'observance',
    description: 'Commemorates the crucifixion of Jesus Christ',
  });

  holidays.push({
    name: 'Easter Sunday',
    date: easter.toISOString(),
    type: 'observance',
    description: 'Celebrates the resurrection of Jesus Christ',
  });

  const memorialDay = getLastWeekdayOfMonth(year, 4, 1);
  holidays.push({
    name: 'Memorial Day',
    date: memorialDay.toISOString(),
    type: 'federal',
    description: 'Honors U.S. military personnel who died in service',
  });

  holidays.push({
    name: 'Juneteenth',
    date: new Date(year, 5, 19).toISOString(),
    type: 'federal',
    description: 'Commemorates the emancipation of enslaved African Americans',
  });

  holidays.push({
    name: 'Independence Day',
    date: new Date(year, 6, 4).toISOString(),
    type: 'federal',
    description: "Celebrates the adoption of the Declaration of Independence",
  });

  const laborDay = getNthWeekdayOfMonth(year, 8, 1, 1);
  holidays.push({
    name: 'Labor Day',
    date: laborDay.toISOString(),
    type: 'federal',
    description: 'Honors the American labor movement and contributions of workers',
  });

  const columbusDay = getNthWeekdayOfMonth(year, 9, 1, 2);
  holidays.push({
    name: 'Columbus Day',
    date: columbusDay.toISOString(),
    type: 'federal',
    description: "Commemorates Christopher Columbus's arrival in the Americas",
  });

  holidays.push({
    name: 'Halloween',
    date: new Date(year, 9, 31).toISOString(),
    type: 'observance',
    description: 'Traditional celebration with costumes and trick-or-treating',
  });

  holidays.push({
    name: 'Veterans Day',
    date: new Date(year, 10, 11).toISOString(),
    type: 'federal',
    description: 'Honors military veterans who served in the U.S. Armed Forces',
  });

  const thanksgivingDay = getNthWeekdayOfMonth(year, 10, 4, 4);
  holidays.push({
    name: 'Thanksgiving Day',
    date: thanksgivingDay.toISOString(),
    type: 'federal',
    description: 'Traditional harvest festival and day of giving thanks',
  });

  const dayAfterThanksgiving = new Date(thanksgivingDay);
  dayAfterThanksgiving.setDate(thanksgivingDay.getDate() + 1);
  holidays.push({
    name: 'Black Friday',
    date: dayAfterThanksgiving.toISOString(),
    type: 'observance',
    description: 'Major shopping day following Thanksgiving',
  });

  holidays.push({
    name: 'Christmas Eve',
    date: new Date(year, 11, 24).toISOString(),
    type: 'observance',
    description: 'Day before Christmas Day',
  });

  holidays.push({
    name: 'Christmas Day',
    date: new Date(year, 11, 25).toISOString(),
    type: 'federal',
    description: 'Celebrates the birth of Jesus Christ',
  });

  holidays.push({
    name: "New Year's Eve",
    date: new Date(year, 11, 31).toISOString(),
    type: 'observance',
    description: 'Last day of the year',
  });

  return holidays;
}

export function getMultiYearHolidays(startYear: number, endYear: number): Holiday[] {
  const allHolidays: Holiday[] = [];
  
  for (let year = startYear; year <= endYear; year++) {
    const yearHolidays = getUSFederalHolidays(year);
    allHolidays.push(...yearHolidays);
  }
  
  return allHolidays;
}

export const HOLIDAYS_2025 = getUSFederalHolidays(2025);
export const HOLIDAYS_2026 = getUSFederalHolidays(2026);
export const HOLIDAYS_2025_2026 = getMultiYearHolidays(2025, 2026);
