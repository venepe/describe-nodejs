'use strict';

const FileConfig = {
  TempDir: process.env.IMAGE_TEMP_DIR,
  UploadDir: process.env.IMAGE_UPLOAD_DIR,
  DefaultImageUrl: process.env.BASE_DEFAULT_IMAGE_URL,
  BaseImageUrl: process.env.BASE_IMAGE_URL,
  FulfillmentImageUrl: 'https://s3-us-west-2.amazonaws.com/sumseti/default/images/shaded-fulfillment.png',
  RejectedImageUrl: 'https://s3-us-west-2.amazonaws.com/sumseti/default/images/shaded-rejected.png'
}

export default FileConfig;
