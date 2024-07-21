#!/usr/bin/env node

'use strict';

async function main() {
  const db = require('./lib/influx2')();
  const buckets = await db.buckets();
  console.log(buckets.map(e => e.name).join('\n'));
}

require('./lib/main')(main);
