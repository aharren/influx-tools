'use strict';

const path = require('path');
const zlib = require('zlib');

function storagePathForTimestamp(timestamp) {
  const date = new Date(timestamp);
  return `influx2-data`
    + `${path.sep}${date.getUTCFullYear()}`
    + `${path.sep}${(date.getUTCMonth() + 1).toString().padStart(2, '0')}`
    + `${path.sep}${(date.getUTCDate()).toString().padStart(2, '0')}`
}

function fileNameForMeasurement(storagePath, timestamp, measurement, compress) {
  const date = new Date(timestamp);
  const dateString = `${date.getUTCFullYear()}-${(date.getUTCMonth() + 1).toString().padStart(2, '0')}-${date.getUTCDate().toString().padStart(2, '0')}Z`;
  return `${storagePath}`
    + `${path.sep}${dateString}-${measurement}.json${compress ? '.gz' : ''}`;
}

function fileContentForDatapoints(datapoints, compress) {
  const content = JSON.stringify(datapoints, null, 2);
  return compress ? zlib.gzipSync(content) : content;
}

function datapointsFromFileContent(content, compress) {
  const uncompressedContent = compress ? zlib.gunzipSync(content) : content;
  return JSON.parse(uncompressedContent);
}

module.exports = {
  storagePathForTimestamp,
  fileNameForMeasurement,
  fileContentForDatapoints,
  datapointsFromFileContent,
};
