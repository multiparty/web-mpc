web-mpc
=======

[![Build Status](https://travis-ci.org/Boston-Women-Work/data-aggregator.svg?branch=master)](https://travis-ci.org/Boston-Women-Work/data-aggregator)
[![Coverage Status](https://coveralls.io/repos/github/Boston-Women-Work/data-aggregator/badge.svg?branch=angular)](https://coveralls.io/github/Boston-Women-Work/data-aggregator?branch=angular)

Implementation of a web-based data collection and aggregation infrastructure that utilizes secure multi-party computation techniques to allow individual contributors to submit their data without revealing it to the other participants.


Environment
-----------

It is expected that this application will operate on an Amazon Web Services EC2 instance running Amazon Linux under a security group that permits connections on port 80. The environment in which it runs is set up as follows.

* First, install Node.js, MongoDB, and necessary modules:

`yum -y update`

`yum -y install nodejs npm --enablerepo=epel`

```
echo "[MongoDB]
name=MongoDB Repository
baseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64
gpgcheck=0
enabled=1" | sudo tee -a /etc/yum.repos.d/mongodb.repo
```

`yum install -y gcc-c++ mongodb-org-server mongodb-org-shell mongodb-org-tools`

* Navigate to the "server/" directory and install the NPM dependencies:

`npm install`

* Now install the global dependency

`npm install -g forever`

* Next, set up the database file and start the MongoDB server:

`mkdir -p /data/db`

`mongod`

* Finally, retrieve the application files and in the directory "server/" run:

`forever -o log.txt -e error.txt start index.js`

Local Machine
-------------

Instructions for setting up the environment on a Mac/Linux local machine.

* Make sure to have Node.js and MongoDB installed.

* Navigate to the "server/" directory and install the NPM dependencies:

`npm install`

* Now install the global dependency:

`npm install -g forever`

* Create the database file:

`mkdir -p /data/db`

* Start the MongoDB server

`mongod` 

* Open a new terminal tab or window and navigate back to the "server/" directory if not already there

#### Non-Production Testing

* For testing, start the Node.js server with no environment variables:

`node index.js`

#### Prodction Release

* For production, start the Node.js server with a production environment variable:

`export NODE_ENV=production`
`node index.js`

* Open up the browser and navigate to "localhost:8080"

Application
-----------

Instructions on how to operate the web-mpc application. All instructions from here forward will be performed in the browser. 

#### Generate Session Key

* Navigate to "localhost:8080/trusted"

* Click on "Generate Session" and copy and share the session key with all participants.

#### Fill out data

* All participants will naviagte to "localhost:8080", paste the session key into its designated field and proceed to fill out the information. Once completed, click "Submit"".

#### Retrieve the result

* Navigate to "localhost:8080/unmask"

* Paste the session key in it's designated field.

* Click "Browse..." and upload the private key file that was downloaded when generating the session key.

* Click "Unmask Data" and view the result