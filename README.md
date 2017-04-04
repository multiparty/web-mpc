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
