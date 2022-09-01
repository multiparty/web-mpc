# WEB-MPC

[![DOI](https://zenodo.org/badge/84491506.svg)](https://zenodo.org/badge/latestdoi/84491506) [![CircleCI Build Status](https://circleci.com/gh/multiparty/web-mpc.svg?style=shield)](https://app.circleci.com/pipelines/github/multiparty/web-mpc)

Implementation of a web-based data collection and aggregation infrastructure that utilizes secure multi-party computation techniques to allow individual contributors to submit their data without revealing it to the other participants.

## Requirements

* Node.js
* MongoDB
* Docker
* [JIFF](https://github.com/multiparty/jiff/) (Bundled as a Git submodule)

## Local Machine Instructions

These instructions are for demonstration and development purposes only. For a full, secure deployment, follow one of the two full instructions below.

* Install and start MongoDB
* Clone WEB-MPC
```
git clone https://github.com/multiparty/web-mpc.git
cd web-mpc/
```
* Build Docker Image and Compose Container
```
docker-compose up -d --build #build and compose
```
* Navigate to the website at `https://localhost:8080`

## EC2 Instructions
These instructions were written for an AWS EC2 instance running Amazon Linux. The instance's security group should allow SSH on port 22 and TCP on port 8080.

You will need to have a registered domain and will need to use Nginx with Let's Encrypt as a reverse proxy for port 8080.

* SSH onto the EC2 instance
* First, install the Node.js version manager and activate it
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
* Clone the WEB-MPC repository
```
sudo yum install git -y
git clone https://github.com/multiparty/web-mpc.git
cd web-mpc/
```
* Set up the JIFF submodule:
```
git submodule init
git submodule update
```
* Install WEB-MPC dependencies
```
npm install
```
* Install JIFF dependencies
```
cd jiff/
npm install
cd ../
```
Note that installing WEB-MPC dependencies will break JIFF's dependencies. Hence, JIFF dependencies **must** be installed at least once after each install of WEB-MPC dependencies.
* Install the `forever` global dependency to ensure the server runs continuously
```
npm install -g forever
```
* Install authbind:
```
sudo rpm -Uvh https://s3.amazonaws.com/aaronsilber/public/authbind-2.1.1-0.1.x86_64.rpm
```
* Next, set up the database file and start the MongoDB server:
```
sudo mkdir -p /data/db
sudo mongod &
```
* Select the WEB-MPC deployment. See the [Deployments](#Deployments) section
* Start the WEB-MPC server
```
cd server/
authbind --deep forever -o log.txt -e error.txt start index.js
```
* Navigate to the domain or to the EC2 instance's public IP address to view the page

## Deployments

WEB-MPC supports multiple deployments. A deployment refers to one particular data collection campaign. Each deployment may have different data formats, domain names, and HTTPS certificate settings.

The `server/config/` directory contains configuration files for each deployment specifying their respective HTTPS parameters and data templates.

Data templates are `.json` files that define the structure of the input data. The templates are also used to render the HTML UI. Paths to the each data template is defined in its respective `server/config` configuration file and are typically located in `client/app/data/`.

### Specifying a Deployment

The deployment is set to Pacesetters by default. To change it, set a deployment environment variable.
```bash
export WEBMPC_DEPLOYMENT=<deployment_name>
```
If the deployment template file at `server/config/<deployment_name>.json` does not exist or is invalid, the server will fail to start.

## Usage

The instructions below demonstrate how to operate the WEB-MPC application. All steps below are performed on the WEB-MPC web application in the browser.

### Generate session key

* Navigate to `localhost:8080/create`
* Click on **Generate Session** and save the two given files, one contains the session key and password which are needed for managing the session. The other contains a secret key needed to unmask the results.

### Manage session

* Navigate to `localhost:8080/manage`
* Input your session key and password
* Generate participation links
* Start the session

### Fill out data

* All participants will open a unique participation link, and proceed to fill out the information. Once completed, click **Submit**.

### Retrieve the result

* Stop the session in `localhost:8080/manage`
* Click the **unmask** link
* Paste the session key and password in its designated fields
* Click **Browse** and upload the private key file that was downloaded when generating the session key
* Click **Unmask Data** and view the result

## Testing

WEB-MPC has end-to-end tests verifying each deployment. To run the full test suite on Linux or Mac OS, run the following command:
```
npm run test
```
The test automatically spawns the appropriate server and runs the end-to-end tests for each deployment, shutting down the previous server in between tests.

Node.js is not able to kill the previous server on Windows. Hence, each test suite must be run separately.

To run a specific test suite, run the specific suite with `mocha`:
```
mocha test/selenium/<deployment_name>.js
```
or run the test with a filter:
```
npm run test -- --grep <test_suite_name>
```

For example, to run the BWWC tests, run one of the following:
```
mocha test/selenium/bwwc.js
npm run test -- --grep BWWC
```

## License
WEB-MPC is freely distributable under the terms of the [MIT license](https://github.com/multiparty/web-mpc/blob/master/LICENSE). This release supports Handsontable's "[Nested headers](https://docs.handsontable.com/pro/1.17.0/demo-nested-headers.html)", a Pro feature. A [valid license](https://handsontable.com/pricing) must be obtained when using this feature.
