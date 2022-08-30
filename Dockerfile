FROM node:16

# Define directory inside the container
WORKDIR /usr/src/app

RUN git submodule init jiff
RUN git submodule update --remote

#Install app dependecies (wildcard ensures both package/package-loc.json are copied)
COPY ["package.json", "package-lock.json*", "./"]

RUN npm install
# RUN npm ci --only=production for production

# RUN cd jiff
# RUN npm install
# COPY ["package.json", "package-lock.json*", "./"]
# RUN cd ..


# Copying the local directory to the container directory(/usr/src/app)
COPY . .

EXPOSE 8080

CMD [ "npm", "start"]
