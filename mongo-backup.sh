#!/bin/sh

# From https://pranavprakash.net/2017/02/04/automate-mongodb-backups-using-cron-and-shell-script/
#=====================================================================
# Set the following variables as per your requirement
#=====================================================================
# Database Name to backup
MONGO_DATABASE="aggregate"
# Database host name
MONGO_HOST="127.0.0.1"
# Database port
MONGO_PORT="27017"
# Backup directory
BACKUPS_DIR="/home/ec2-user/backup/$MONGO_DATABASE"
# Database user name
DB_USERNAME=""
# Database password
DB_PASSWORD=""
# Authentication database name
DB_AUTH_DB="admin"
# Days to keep the backup
DAYS_TO_RETAIN_BACKUP="60"
#=====================================================================

TIMESTAMP=`date +%F-%H%M`
BACKUP_NAME="$MONGO_DATABASE-$TIMESTAMP"

echo "Performing backup of $MONGO_DATABASE"
echo "--------------------------------------------"
# Create backup directory
if ! mkdir -p $BACKUPS_DIR; then
  echo "Can't create backup directory in $BACKUPS_DIR. Go and fix it!" 1>&2
  exit 1;
fi;
# Create dump
mongodump -d $MONGO_DATABASE
# Rename dump directory to backup name
mv dump $BACKUP_NAME
# Compress backup
tar -zcvf $BACKUPS_DIR/$BACKUP_NAME.tgz $BACKUP_NAME
# Delete uncompressed backup
rm -rf $BACKUP_NAME
# Delete backups older than retention period
find $BACKUPS_DIR -type f -mtime +$DAYS_TO_RETAIN_BACKUP -exec rm {} +
# Upload to AWS
echo "Uploading $BACKUPS_DIR/$BACKUP_NAME to AWS"
aws s3 cp $BACKUPS_DIR/$BACKUP_NAME.tgz s3://bwwc
echo "--------------------------------------------"
echo "Database backup complete!"
