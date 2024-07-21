#!/usr/bin/env node

'use strict';

async function main() {
  const paramBucket = process.argv[2] || '';
  const paramTimeStart = process.argv[3] || '';
  const paramTimeEnd = process.argv[4] || '';
  const paramMeasurement = process.argv[5] || '';
  if (!paramBucket || !paramTimeStart || !paramTimeEnd || !paramMeasurement) {
    throw Error('usage: influx2-datapoints <bucket> <start> <end> <measurement>');
  }

  const db = require('./lib/influx2')();
  const timeStart = new Date(paramTimeStart).toISOString();
  const timeEnd = new Date(paramTimeEnd).toISOString();

  const datapoints = await db.datapoints(paramBucket, paramMeasurement, timeStart, timeEnd);
  db.removeInternalsFromDatapoints(datapoints);
  console.log(datapoints);
}

require('./lib/main')(main);
