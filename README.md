# web-mpc
[![DOI](https://zenodo.org/badge/84491506.svg)](https://zenodo.org/badge/latestdoi/84491506) [![Build Status](https://travis-ci.org/multiparty/web-mpc.svg?branch=master)](https://travis-ci.org/multiparty/web-mpc)

Implementation of a web-based data collection and aggregation infrastructure that utilizes secure multi-party 
computation techniques to allow individual contributors to submit their data without revealing it to the other participants.


## Environment

This procedure is for demonstration and development purposes only. For a true deployment, you will 
need to have a registered domain, and install Nginx with Let's Encrypt as a reverse proxy for port 8080.

It is expected that this application will operate on an Amazon Web Services EC2 instance running Amazon Linux under a 
security group that permits connections on ports 22 with SSH and 8080 with a custom TCP rule. Store the .pem key file for the EC2 instance somewhere safe,
SSH onto the instance following the instructions on the Amazon EC2 console, then set up the server environment as follows:

* First, install the node version manager and activate it.
```
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.34.0/install.sh | bash
. ~/.nvm/nvm.sh
```

* Next, install the latest version of Node.js. This also installs the Node package manager (npm). 
```
nvm install node
```
* Install MongoDB:
```
echo "[mongodb-org-4.2]
name=MongoDB Repository
baseurl=https://repo.mongodb.org/yum/amazon/2013.03/mongodb-org/4.2/	x86_64/
gpgcheck=1
enabled=1
gpgkey=https://www.mongodb.org/static/pgp/server-4.2.asc" | sudo tee /etc/yum.repos.d/mongodb.repo
```
```
sudo yum -y update
sudo yum install -y gcc-c++ mongodb-org-server mongodb-org-shell mongodb-org-tools
```
* Clone into the web-mpc repository
```
sudo yum install git -y
git clone https://github.com/multiparty/web-mpc.git
```
* Navigate to the `web-mpc/` directory and set up JIFF:
```
cd web-mpc/
git submodule init
git submodule update
cd jiff && npm install
```

Navigate back to the `web-mpc/` directory, install the NPM dependencies, and install the global dependency:

```
npm install
npm install -g forever
```

Install authbind:
```
sudo rpm -Uvh https://s3.amazonaws.com/aaronsilber/public/authbind-2.1.1-0.1.x86_64.rpm
```
* Next, set up the database file and start the MongoDB server:
```
sudo mkdir -p /data/db
sudo mongod &
```
* Finally, navigate to the server directory, and run.
```
cd server/
authbind --deep forever -o log.txt -e error.txt start index.js
```

If you don't have a domain set up for your server, you can navigate on your computer's browser to the EC2 instance's 
public IP address (as listed on the ec2 console for the instance):

``` 
<ip address here>:8080
```
to view the web-page.

## Local machine installation

Instructions for setting up the environment on a Mac OS X or Linux local machine.

* Make sure to have Node.js and MongoDB installed.
* Navigate to the `web-mpc/` directory and install the NPM dependencies:
```
npm install
```
* Now install the global dependency:
```
npm install -g forever
```
* In order to install the global dependencies, you may need to run the `npm install -g forever` command 
as `sudo npm install -g forever`.

* Create the database file:
```
mkdir -p /data/db
```
* Start the MongoDB server:
```
mongod
```
* Open a new terminal tab or window and navigate back to the `web-mpc/` directory if you are not already there.

* Initialize JIFF:
```
git submodule init
git submodule update
cd jiff && npm install
```
* Note that the `npm install` within the `/jiff` directory is within the `web-mpc/jiff` directory, not the
 `web-mpc/server/jiff` directory.
#### Non-production testing

* For testing, start the Node.js server with no environment variables:
```
node server/index.js
```

#### Production release

* For production, start the Node.js server with a production environment variable:
```
export NODE_ENV=production
node server/index.js
```
* Open up the browser and navigate to "localhost:8080"

## Specifying a Deployment

This application can be used for a variety of deployments. Each deployment may have a different domain name 
and https certificate settings, as well as a different data format/layout.

server/config contains configuration files for each deployment specifying its https parameters and its data template.
Data templates are json files typically located in client/app/data/, they are used to automatically render HTML UI and
handle data aggregation.

The deployment is set to pacesetters by default, to change it, set a deployment environment variable"
```bash
export WEBMPC_DEPLOYMENT=deployment_name
```

It is required that server/config/<deployment_name>.json is a valid configuration file. If the file is
invalid, the server will fail on start.

## Application usage

Instructions on how to operate the web-mpc application. All steps below are performed in the browser.

#### Generate session key

* Navigate to `localhost:8080/create`.
* Click on **Generate Session** and save the two given files, one contains the session key and password which are needed for managing the session. The other contains a secret key needed to unmask the aggregate.

#### Manage session

* Navigate to `localhost:8080/manage`.
* Input your session key and password.
* Generate participation links.
* Start the session.

#### Fill out data

* All participants will open a unique participation link, and proceed to fill out the information. Once completed, click **Submit**.

#### Retrieve the result

* Stop the session in `localhost:8080/manage`.
* Click the **unmask** link.
* Paste the session key and password in its designated fields.
* Click **Browse** and upload the private key file that was downloaded when generating the session key.
* Click **Unmask Data** and view the result.

## License
Web-mpc is freely distributable under the terms of the [MIT license](https://github.com/multiparty/web-mpc/blob/master/LICENSE). This release supports Handsontable's "[Nested headers](https://docs.handsontable.com/pro/1.17.0/demo-nested-headers.html)", a Pro feature. A [valid license](https://handsontable.com/pricing) must be obtained when using this feature.
