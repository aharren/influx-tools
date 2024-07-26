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
    throw Error('usage: influx2-import-datapoints <bucket> <start> <end> <measurement> [<measurement> [...]]');
  }

  const compress = process.env['INFLUX2_COMPRESS'] || '';

  const db = require('./lib/influx2')();
  const measurements = process.argv.slice(paramMeasurementsStart, paramMeasurementsEnd);

  await time.forEachDayUTC(paramTimeStart, paramTimeEnd, async (dateStart, dateEnd) => {
    const storagePath = storage.storagePathForTimestamp(dateStart);
    console.log(`${dateStart.toISOString()}..${dateEnd.toISOString()} - ${storagePath}`);

    for (const measurement of measurements) {
      const file = storage.fileNameForMeasurement(storagePath, dateStart, measurement, compress);
      const content = await (async () => { try { return await fsp.readFile(file, !compress ? { encoding: 'UTF-8' } : {}); } catch (err) { return undefined; } })();
      if (content) {
        const datapoints = storage.datapointsFromFileContent(content, compress);
        if (datapoints.length > 0) {
          console.log(`  - ${measurement} .. ${datapoints.length}`);
        }
        db.writeDatapoints(paramBucket, datapoints);
      }
    }
  });
}

require('./lib/main')(main);
