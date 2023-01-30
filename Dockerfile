FROM node:16

# Define directory inside the container
WORKDIR /usr/src/app

# Copying the local directory to the container directory(/usr/src/app)
COPY . .

#Install app dependecies (wildcard ensures both package/package-lock.json are copied)

EXPOSE 8080

CMD [ "npm", "start"]
