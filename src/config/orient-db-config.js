'use strict';

module.exports = {
  username: process.env.ORIENTDB_USERNAME,
  password: process.env.ORIENTDB_PASSWORD,
  pool: {
    max: 10
  },
  host: process.env.DB_PORT_2424_TCP_ADDR,
  port: 2424
}
