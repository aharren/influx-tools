'use strict';

const timeDayDelta = 24 * 60 * 60 * 1000;

function startOfDayUTC(timestamp) {
  const date = new Date(timestamp);
  return new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0));
}

async function forEachDayUTC(timestampStart, timestampEnd, fn) {
  const dateStart = startOfDayUTC(timestampStart);
  const dateEnd = startOfDayUTC(timestampEnd);

  for (let timeWindowStart = dateStart.getTime(); timeWindowStart < dateEnd.getTime(); timeWindowStart += timeDayDelta) {
    const dateWindowStart = new Date(timeWindowStart);
    const dateWindowEnd = new Date(timeWindowStart + timeDayDelta);
    await fn(dateWindowStart, dateWindowEnd);
  }
}

module.exports = {
  startOfDayUTC,
  forEachDayUTC,
};
