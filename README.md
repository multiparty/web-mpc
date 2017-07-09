# web-mpc

[![Build Status](https://travis-ci.org/Boston-Women-Work/data-aggregator.svg?branch=master)](https://travis-ci.org/Boston-Women-Work/data-aggregator)
[![Coverage Status](https://coveralls.io/repos/github/Boston-Women-Work/data-aggregator/badge.svg?branch=angular)](https://coveralls.io/github/Boston-Women-Work/data-aggregator?branch=angular)

Implementation of a web-based data collection and aggregation infrastructure that utilizes secure multi-party computation techniques to allow individual contributors to submit their data without revealing it to the other participants.


## Environment

It is expected that this application will operate on an Amazon Web Services EC2 instance running Amazon Linux under a security group that permits connections on port 80. The environment in which it runs is set up as follows.

* First, install Node.js, MongoDB, and necessary modules:
```
yum -y update
yum -y install nodejs npm --enablerepo=epel
```
```
echo "[MongoDB]
name=MongoDB Repository
baseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64
gpgcheck=0
enabled=1" | sudo tee -a /etc/yum.repos.d/mongodb.repo
```
```
yum install -y gcc-c++ mongodb-org-server mongodb-org-shell mongodb-org-tools`
```
* Navigate to the `server/` directory, install the NPM dependencies, and install the global dependency:
```
npm install
npm install -g forever
```
* Next, set up the database file and start the MongoDB server:
```
mkdir -p /data/db
mongod
```
* Finally, retrieve the application files and in the directory "server/" run:
```
forever -o log.txt -e error.txt start index.js
```

## Local machine installation

Instructions for setting up the environment on a Mac OS X or Linux local machine.

* Make sure to have Node.js and MongoDB installed.
* Navigate to the `server/` directory and install the NPM dependencies:
```
npm install
```
* Now install the global dependency:
```
npm install -g forever
```
* Create the database file:
```
mkdir -p /data/db
```
* Start the MongoDB server:
```
mongod
```
* Open a new terminal tab or window and navigate back to the `server/` directory if you are not already there.

#### Non-production testing

* For testing, start the Node.js server with no environment variables:
```
node index.js
```

#### Production release

* For production, start the Node.js server with a production environment variable:
```
export NODE_ENV=production
node index.js
```
* Open up the browser and navigate to "localhost:8080"

## Application usage

Instructions on how to operate the web-mpc application. All steps below are performed in the browser.

#### Generate session key

* Navigate to `localhost:8080/trusted`
* Click on **Generate Session** and copy and share the session key with all participants.

#### Fill out data

* All participants will navigate to `localhost:8080`, paste the session key into its designated field and proceed to fill out the information. Once completed, click **Submit**.

#### Retrieve the result

* Navigate to `localhost:8080/unmask`.
* Paste the session key in its designated field.
* Click **Browse** and upload the private key file that was downloaded when generating the session key.
* Click **Unmask Data** and view the result

## Directories and file structure

#### ./client

* This contains the code for the data contribution client application.

* `./client/index.html`: the html page for entering the data.

* `./client/script/client.js`: contains functions for validating, organizing, masking/encrypting, and submitting data to the server.

#### ./server

* This contains the code for the computation server.

* `./server/index.js`: contains API end-points and functions for storing submission, tracking number of participants, aggregating data, and retrieving public keys, data and masks. 

* `./server/template.json`: contains a json template of what a valid submission looks like. The template will be used with Joi to validate that requests abide by the template. 

#### ./trusted

* This contains web pages for creating new sessions and viewing progress of existing sessions.

#### ./unmask

* This contains the code for unmasking and displaying aggregate result.

* `./unmask/index.html`: the webpage that allows the aggregate results to be unmasked and viewed.

* `./unmask/script/unmask.js`: decrypts masks using browser-native encryption/decryption functions.

#### ./shared

* This contains files that are generic and are used by multiple parts of the application.

* `.shared/mpc.js`: contains an implementation of the MPC primitives used for masking and unmasking (recombining), operating on masked/shared data, and encryption using 3rd party libraries. This file is used by **client**, **server**, and **unmask**.

* `.shared/sail_hot.js`: a generic wrapper/library around HandsOnTable that simplifies validation, rendering, and defining tables. This file is used by **client** and **unmask**.

* `.shared/templates/tables.js`: a JSON definition of the HandsOnTable used in the application (including rows and columns, cell types, validators, tooltips, and so on). This file is used by **client** and **unmask**.
