'use strict';

import del from 'del';

export const delFile = (file) => {
  return new Promise((resolve, reject) => {
  let pattern = /^https?:\/\/[^\/]+/i;
  let uri = file.uri.replace(pattern, '');
  let filePath = `${__dirname}/../../../public${uri}`;
  del([filePath])
    .then((paths) => {
      resolve(filePath);
    })
    .catch((err) => {
      console.log(`Failed to delete: ${filePath}`);
      reject(err);
    });
  });
}
