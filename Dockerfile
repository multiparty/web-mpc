FROM node:16
RUN apt-get update && apt-get install -y netcat
# Define directory inside the container
WORKDIR /usr/src/app

# Copying the local directory to the container directory(/usr/src/app)
COPY . .

#Install app dependecies (wildcard ensures both package/package-lock.json are copied)
RUN npm ci

RUN cd jiff && npm ci

EXPOSE 8080

CMD sh -c "while ! nc -z mongo 27017; do sleep 1; done && npm start"
