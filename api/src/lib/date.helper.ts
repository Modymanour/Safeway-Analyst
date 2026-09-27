export const dateRange = (startDate: Date, endDate: Date) => {
  const dates: Date[] = [];
  const cursor = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  const end = new Date(endDate.getFullYear(), endDate.getMonth(), 1);

  while (cursor <= end) {
    dates.push(new Date(cursor));
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return dates;
}

export interface dateReturn{
    start_date: Date,
    end_date: Date
}

export function getCurrentMonthRange() {
  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  );

  const end = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    1
  );

  return { start, end };
}

export function getCustomMonthRange(
    start_year: number,
    startMonth: number,
    end_year: number,
    endMonth: number
): dateReturn{
    const start = new Date(
        start_year,
    startMonth - 1,
        1
    );

    const end = new Date(
        end_year,
    endMonth,
        1
    );

    return {
        start_date: start,
        end_date: end
    }
}

export function getCurrentYearRange() {
  const now = new Date();

  const start = new Date(
    now.getFullYear(),
    0,
    1
  );

  const end = new Date(
    now.getFullYear() + 1,
    0,
    1
  );

  return { start, end };
}