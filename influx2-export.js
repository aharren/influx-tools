#!/usr/bin/env node

'use strict';

const path = require('path');
const fsp = require('fs/promises');
const zlib = require('zlib');

function storagePathForTimestamp(timestamp) {
  return `influx2-data`
    + `${path.sep}${timestamp.getUTCFullYear()}`
    + `${path.sep}${(timestamp.getUTCMonth() + 1).toString().padStart(2, '0')}`
    + `${path.sep}${(timestamp.getUTCDate()).toString().padStart(2, '0')}`
}

function fileNameForMeasurement(storagePath, timestamp, measurement, compress) {
  const timestampString = `${timestamp.getUTCFullYear()}-${(timestamp.getUTCMonth() + 1).toString().padStart(2, '0')}-${timestamp.getUTCDate().toString().padStart(2, '0')}Z`;
  return `${storagePath}`
    + `${path.sep}${timestampString}-${measurement}.json${compress ? '.gz' : ''}`;
}

function fileContentForDatapoints(datapoints, compress) {
  const content = JSON.stringify(datapoints, null, 2);
  return compress ? zlib.gzipSync(content) : content;
}

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
  const paramTimeStartDate = new Date(paramTimeStart);
  const paramTimeEndDate = new Date(paramTimeEnd);

  const timeStart = new Date(Date.UTC(paramTimeStartDate.getFullYear(), paramTimeStartDate.getMonth(), paramTimeStartDate.getDate(), 0, 0, 0));
  const timeEnd = new Date(Date.UTC(paramTimeEndDate.getFullYear(), paramTimeEndDate.getMonth(), paramTimeEndDate.getDate(), 0, 0, 0));

  const timeWindowDayDelta = 24 * 60 * 60 * 1000;
  for (let timeWindowStart = timeStart.getTime(); timeWindowStart < timeEnd.getTime(); timeWindowStart += timeWindowDayDelta) {
    const timeWindowStartDate = new Date(timeWindowStart);
    const timeWindowStartISOString = timeWindowStartDate.toISOString();
    const timeWindowEndISOString = new Date(timeWindowStart + timeWindowDayDelta).toISOString();

    const storagePath = storagePathForTimestamp(timeWindowStartDate);
    console.log(`${timeWindowStartISOString}..${timeWindowEndISOString} - ${storagePath}`);

    await fsp.mkdir(storagePath, { recursive: true });

    for (const measurement of measurements) {
      const datapoints = await db.datapoints(paramBucket, measurement, timeWindowStartISOString, timeWindowEndISOString);
      db.removeInternalsFromDatapoints(datapoints);

      if (datapoints.length > 0) {
        console.log(`  - ${measurement} .. ${datapoints.length}`);
        const file = fileNameForMeasurement(storagePath, timeWindowStartDate, measurement, compress);
        const content = fileContentForDatapoints(datapoints, compress);
        await fsp.writeFile(file, content);
      }
    }
  }
}

require('./lib/main')(main);
