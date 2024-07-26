'use strict';

const fs = require('fs');
const influx = require('@influxdata/influxdb-client')

function construct(config = '') {
  if (!config) {
    const configFileName = process.env['INFLUX2_CONFIG'] || '';
    if (!configFileName) {
      throw Error('INFLUX2_CONFIG not found');
    }
    config = JSON.parse(fs.readFileSync(configFileName, 'UTF-8'));
  }

  const client = new influx.InfluxDB({ url: config.url, token: config.token });
  const queryApi = client.getQueryApi(config.org);

  function checkBucketName(bucket) {
    if (bucket.indexOf('"') !== -1) {
      throw Error(`invalid bucket name: "${bucket}"`);
    }
  }

  function checkMeasurementName(measurement) {
    if (measurement.indexOf('"') !== -1) {
      throw Error(`invalid measurement name: "${measurement}"`);
    }
  }

  async function query(q) {
    const data = await queryApi.collectRows(q);
    return data;
  }

  async function buckets() {
    return await this.query(`
      import "influxdata/influxdb"
      buckets()
    `);
  }

  async function measurements(bucket) {
    this.checkBucketName(bucket);
    return await this.query(`
      import "influxdata/influxdb/schema"
      schema.measurements(bucket: "${bucket}")
      |> rename(columns: { _value: "name"})
    `);
  }

  async function datapoints(bucket, measurement, timestampStart, timestampEnd) {
    const dateStart = new Date(timestampStart);
    const dateEnd = new Date(timestampEnd);
    this.checkBucketName(bucket);
    this.checkMeasurementName(measurement);
    return await this.query(`
        from(bucket: "${bucket}")
        |> range(start: ${dateStart.toISOString()}, stop: ${dateEnd.toISOString()})
        |> filter(fn: (r) => r["_measurement"] == "${measurement}")
        |> pivot(rowKey: ["_time"], columnKey: ["_field"], valueColumn: "_value" )
        |> group(columns: ["_time"])
        |> sort(columns: ["_time"])
    `);
  }

  function removeInternalsFromDatapoints(datapoints) {
    return datapoints.map(e => {
      delete e.result;
      delete e.table;
      delete e._start;
      delete e._stop;
      return e;
    });
  }

  return {
    checkBucketName,
    checkMeasurementName,
    query,
    buckets,
    measurements,
    datapoints,
    removeInternalsFromDatapoints,
  };
}

module.exports = construct;
