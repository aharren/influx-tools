'use strict';

function main(func) {
  (async () => {
    try {
      await func();
    } catch (e) {
      if (process.env['INFLUX2_DEBUG']) {
        console.log(e);
      }
      console.error(`error: ${e.message}`);
      process.exitCode = 2;
    }
  })();
}

module.exports = main;
