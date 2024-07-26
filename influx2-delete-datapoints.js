#!/usr/bin/env node

'use strict';

async function main() {
  const paramBucket = process.argv[2] || '';
  const paramTimeStart = process.argv[3] || '';
  const paramTimeEnd = process.argv[4] || '';
  const paramMeasurement = process.argv[5] || '';
  if (!paramBucket || !paramTimeStart || !paramTimeEnd || !paramMeasurement) {
    throw Error('usage: influx2-delete-datapoints <bucket> <start> <end> <measurement>');
  }

  const db = require('./lib/influx2')();
  await db.deleteDatapoints(paramBucket, paramMeasurement, paramTimeStart, paramTimeEnd);
}

require('./lib/main')(main);
