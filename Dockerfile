FROM node:16

# Define directory inside the container
WORKDIR /usr/src/app

#Install app dependecies (wildcard ensures both package/package-loc.json are copied)
COPY ["package.json", "package-lock.json*", "./"]

RUN npm install
# RUN npm ci --only=production for production

# Copying the local directory to the container directory(/usr/src/app)
COPY . .

EXPOSE 8080

CMD [ "npm", "start"]
