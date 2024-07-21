#!/usr/bin/env node

'use strict';

async function main() {
  const paramBucket = process.argv[2] || '';
  if (!paramBucket) {
    throw Error('usage: influx2-measurements <bucket>');
  }

  const db = require('./lib/influx2')();
  const measurements = await db.measurements(paramBucket);
  console.log(measurements.map(e => e.name).join('\n'));
}

require('./lib/main')(main);

