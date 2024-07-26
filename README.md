# influx-tools

Command-line tools for Influx databases.

## Installation

### Clone

```
git clone https://github.com/aharren/influx-tools.git
cd influx-tools
npm install
```

### Configure

Create a database configuration file, based on `example-config.json`, e.g.

`mydb-config.json`:
```
{
  "url": "http://host.of.your.database:8086",
  "token": "A_READ_OR_WRITE_TOKEN",
  "org": "your_organization"
}
```

Set your configuration file:

```
export INFLUX2_CONFIG=/path/to/mydb-config.json
```

## Tools

### influx2-buckets

List the buckets in your database.

```
./influx2-buckets.js
```

### influx2-measurements

List the measurements in the given bucket.

```
./influx2-measurements.js mybucket
```

### influx2-datapoints

Query all data points for the given measurement in the given bucket within the given time frame [start, end[.

```
./influx2-datapoints.js mybucket 2024-07-19T00:00:00Z 2024-07-21T12:00:00Z mymeasurement
```

### influx2-export

Export all data points for the given measurements in the given bucket within the given time frame. Data is exported on a full-day basis for the day interval [start, end[.


```
./influx2-export.js mybucket 2024-07-19 2024-07-22 mymeasurement1 mymeasurement2 mymeasurement3
```

The exported data points are stored in a hierarchical folder structure, using one file per measurement and day:

```
influx2-data/
  2024/
    07/
      19/
        2024-07-19Z-mymeasurement1.json[.gz]
        2024-07-19Z-mymeasurement2.json[.gz]
        2024-07-19Z-mymeasurement3.json[.gz]
      20/
        2024-07-20Z-mymeasurement1.json[.gz]
        2024-07-20Z-mymeasurement2.json[.gz]
        2024-07-20Z-mymeasurement3.json[.gz]
      21/
        2024-07-21Z-mymeasurement1.json[.gz]
        2024-07-21Z-mymeasurement2.json[.gz]
        2024-07-21Z-mymeasurement3.json[.gz]
```

If `INFLUX2_COMPRESS` is defined, all files will be compressed using gzip, e.g.

```
INFLUX2_COMPRESS=1 ./influx2-export.js mybucket 2024-07-19 2024-07-22 mymeasurement1 mymeasurement2 mymeasurement3
```