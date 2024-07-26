'use strict';

const fs = require('fs');
const influx = require('@influxdata/influxdb-client')
const influxApi = require('@influxdata/influxdb-client-apis');

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
  const deleteApi = new influxApi.DeleteAPI(client);

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
        |> group(columns: ["_time"])
        |> sort(columns: ["_time"])
    `);
  }

  async function deleteDatapoints(bucket, measurement, timestampStart, timestampEnd) {
    const dateStart = new Date(timestampStart);
    const dateEnd = new Date(timestampEnd);
    this.checkBucketName(bucket);
    this.checkMeasurementName(measurement);
    await deleteApi.postDelete({
      org: this._config.org,
      bucket,
      body: {
        start: dateStart.toISOString(),
        stop: dateEnd.toISOString(),
        predicate: `_measurement="${measurement}"`,
      },
    })
  }

  async function writeDatapoints(bucket, datapoints) {
    this.checkBucketName(bucket);
    const writeApi = this._client.getWriteApi(this._config.org, bucket);
    datapoints.forEach(async (datapoint) => {
      const p = new influx.Point(datapoint._measurement);
      p.timestamp(new Date(datapoint._time));
      const value = datapoint._value;
      switch (typeof value) {
        case 'number':
          p.floatField(datapoint._field, value);
          break;
        case 'boolean':
          p.booleanField(datapoint._field, value);
        case 'string':
        default:
          p.stringField(datapoint._field, value);
          break;
      }

      const tags = Object.keys(datapoint).filter((e) => !e.startsWith('_'));
      tags.forEach((tag) => {
        p.tag(tag, datapoint[tag]);
      })
      await writeApi.writePoint(p);
    });
    await writeApi.flush();
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
    _config: config,
    _client: client,
    checkBucketName,
    checkMeasurementName,
    query,
    buckets,
    measurements,
    datapoints,
    deleteDatapoints,
    writeDatapoints,
    removeInternalsFromDatapoints,
  };
}

module.exports = construct;
