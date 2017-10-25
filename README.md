# web-mpc
[![DOI](https://zenodo.org/badge/84491506.svg)](https://zenodo.org/badge/latestdoi/84491506)

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
export NODE_ENV=production
authbind --deep forever -o log.txt -e error.txt start index.js
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

* Navigate to `localhost:8080/session`.
* Click on **Generate Session** and copy and share the session key with all participants.

#### Fill out data

* All participants will navigate to `localhost:8080`, paste the session key into its designated field and proceed to fill out the information. Once completed, click **Submit**.

#### Manage session

* Navigate to `localhost:8080/track`.
* Input your session key and password.
* Generate participation links.
* Start the session.

#### Retrieve the result

* Stop the session
* Navigate to `localhost:8080/unmask`.
* Paste the session key and password in its designated fields.
* Click **Browse** and upload the private key file that was downloaded when generating the session key.
* Click **Unmask Data** and view the result.
