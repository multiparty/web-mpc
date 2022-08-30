FROM node:16

# Define directory inside the container
WORKDIR /usr/src/app

# Copying the local directory to the container directory(/usr/src/app)
COPY . .

RUN git submodule init jiff
RUN git submodule update

#Install app dependecies (wildcard ensures both package/package-loc.json are copied)
RUN npm install
# RUN npm ci --only=production for production

RUN cd jiff
RUN npm install
RUN cd ..

EXPOSE 8080

CMD [ "npm", "start"]
