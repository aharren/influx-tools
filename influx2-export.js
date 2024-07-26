#!/usr/bin/env node

'use strict';

const fsp = require('fs/promises');
const storage = require('./lib/storage');
const time = require('./lib/time');

async function main() {
  const paramBucket = process.argv[2] || '';
  const paramTimeStart = process.argv[3] || '';
  const paramTimeEnd = process.argv[4] || '';
  const paramMeasurementsStart = 5;
  const paramMeasurementsEnd = process.argv.length;
  if (!paramBucket || !paramTimeStart || !paramTimeEnd || paramMeasurementsEnd <= paramMeasurementsStart) {
    throw Error('usage: influx2-export <bucket> <start> <end> <measurement> [<measurement> [...]]');
  }

  const compress = process.env['INFLUX2_COMPRESS'] || '';

  const db = require('./lib/influx2')();
  const measurements = process.argv.slice(paramMeasurementsStart, paramMeasurementsEnd);

  await time.forEachDayUTC(paramTimeStart, paramTimeEnd, async (dateStart, dateEnd) => {
    const storagePath = storage.storagePathForTimestamp(dateStart);
    console.log(`${dateStart.toISOString()}..${dateEnd.toISOString()} - ${storagePath}`);
    await fsp.mkdir(storagePath, { recursive: true });

    for (const measurement of measurements) {
      const datapoints = await db.datapoints(paramBucket, measurement, dateStart, dateEnd);
      db.removeInternalsFromDatapoints(datapoints);

      if (datapoints.length > 0) {
        console.log(`  - ${measurement} .. ${datapoints.length}`);
        const file = storage.fileNameForMeasurement(storagePath, dateStart, measurement, compress);
        const content = storage.fileContentForDatapoints(datapoints, compress);
        await fsp.writeFile(file, content);
      }
    }
  });
}

require('./lib/main')(main);
