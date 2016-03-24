'use strict';

const FileConfig = {
  TempDir: process.env.IMAGE_TEMP_DIR,
  UploadDir: process.env.IMAGE_UPLOAD_DIR,
  DefaultImageUrl: process.env.BASE_DEFAULT_IMAGE_URL,
  BaseImageUrl: process.env.BASE_IMAGE_URL
}

export default FileConfig;
