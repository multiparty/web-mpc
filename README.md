data-aggregator
===============

Implementation of a data collection and aggregation infrastructure that supports individual data obfuscation.


Environment
-----------

It is expected that this application will operate on an Amazon Web Services EC2 instance running Amazon Linux under a security group that permits connections on port 80. The environment in which it runs is set up as follows.

* First, install Node.js, MongoDB, and necessary modules:

yum -y update

yum -y install nodejs npm --enablerepo=epel 

  echo "[MongoDB]
name=MongoDB Repository
baseurl=http://downloads-distro.mongodb.org/repo/redhat/os/x86_64
gpgcheck=0
enabled=1" | sudo tee -a /etc/yum.repos.d/mongodb.repo

yum install -y mongodb-org-server mongodb-org-shell mongodb-org-tools

npm install express body-parser mongoose multer

* Next, set up the database file and start the MongoDB server:

mkdir /data
mkdir /data/db
mongod

* Finally, retrieve the application files and in the directory "server/" run:

sudo node index.js

* To ensure the application continues running indefinitely, use:

nohup sudo node index.js > /dev/null 2>&1 &


Original modules and third-party dependencies
---------------------------------------------

Only the following original modules have been written for this application. All other modules are off-the-shelf libraries.

* client/script/ssCreate.js
* client/index.html
* client/success.html
* server/index.js
* server/template.js
* trusted/script/generateMasks.js
* trusted/script/generateSession.js
* trusted/script/ssCreate.js
* trusted/index.html
* trusted/session_data.html
* trusted/keys.txt
* unmask/index.html
* unmask/script/unmask.js
* shared/aggregate.js

The following are third party dependencies included in the source tree (but not automatically installed in the environment).

* trusted/script/filesaver.js
* shared/handsontable
* trusted/script/jszip
* shared/jquery-1.11.2.js
* shared/jsencrypt.js
* shared/md5.js
* unmask/script/ladda.min.js
* unmask/script/spin.min.js
* shared/underscore.js
* client/script/waitingDialog.js
