# Set the base image to ubuntu
FROM ubuntu:14.04

# Define working directory
ADD . /src
WORKDIR /src

# Install Node.js & other dependencies
RUN apt-get update && \
        apt-get -y install curl && \
        apt-get -y install sudo && \
        curl -sL https://deb.nodesource.com/setup_5.x | sudo bash - && \
        apt-get -y install python build-essential nodejs

RUN npm install -g node-gyp && \
        node-gyp clean && \
        npm cache clean

RUN node -v


ADD package.json /src/package.json
RUN cd /src && npm install

CMD [ "npm", "start" ]
