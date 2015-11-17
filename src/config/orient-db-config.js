'use strict';

let host = process.env.DB_PORT_2424_TCP_ADDR || process.env.ORIENTDB_HOST;
let port = (process.env.DB_PORT_2424_TCP_ADDR) ? 2424 : process.env.ORIENTDB_PORT;

module.exports = {
  username: process.env.ORIENTDB_USERNAME,
  password: process.env.ORIENTDB_PASSWORD,
  pool: {
    max: 10
  },
  host,
  port
}
