#!/usr/bin/env node

'use strict';

const table = require('easy-table');

async function main() {
  const paramBucket = process.argv[2] || '';
  const paramTimeStart = process.argv[3] || '';
  const paramTimeEnd = process.argv[4] || '';
  const paramMeasurement = process.argv[5] || '';
  if (!paramBucket || !paramTimeStart || !paramTimeEnd || !paramMeasurement) {
    throw Error('usage: influx2-datapoints <bucket> <start> <end> <measurement>');
  }

  const db = require('./lib/influx2')();
  const datapoints = await db.datapoints(paramBucket, paramMeasurement, paramTimeStart, paramTimeEnd);
  db.removeInternalsFromDatapoints(datapoints);

  const outputFormat = process.env['INFLUX2_OUTPUT_FORMAT'] || 'json';
  switch (outputFormat) {
    case 'table':
      console.log(table.print(datapoints));
      break;
    case 'json':
    default:
      console.log(JSON.stringify(datapoints, null, 2));
      break;
  }
}

require('./lib/main')(main);
