'use strict';

const AppConfig = {
  JWTSecret: process.env.JWT_SECRET,
  GCMToken: process.env.GCM_TOKEN,
  APNSGateway: process.env.APNS_GATEWAY
}

export default AppConfig;
