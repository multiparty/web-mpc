FROM node:16
RUN apt-get update && apt-get install -y netcat

ENV MONGO_HOST=mongo\
    MONGO_PORT=27017

# Define directory inside the container
WORKDIR /usr/src/app

# Copying the local directory to the container directory(/usr/src/app)
COPY . .

#Install app dependecies (wildcard ensures both package/package-lock.json are copied)
RUN npm install -g npm@9.6.2
RUN npm ci


RUN cd jiff && npm ci

EXPOSE 8080

CMD sh -c "while ! nc -z ${MONGO_HOST} ${MONGO_PORT}; do sleep 1; done && npm start"
