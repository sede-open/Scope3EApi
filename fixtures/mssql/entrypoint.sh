#!/bin/bash
database=appdb
password=$SA_PASSWORD
host=$DB_HOST_ENTRYSCRIPT

# wait for SQL Server to come up
#echo importing data will start in $wait_time...
#sleep $wait_time
echo importing data...

####################
# create the DB in the mssql server
####################
/opt/mssql-tools/bin/sqlcmd -S $host -U sa -P $password -Q "DROP DATABASE IF EXISTS appdb; CREATE DATABASE appdb;"


####################
# create the tables and import fixtures
####################
wash=./fixtures/mssql
if [ -d "/usr/src/app" ]; then
  wash=/usr/src/app
fi
####################
# create DB user with restricted access to the DB created
####################
# run the init script to create the tables in /table
create_path="$wash/create_db_user_limited_privileges.sql"
/opt/mssql-tools/bin/sqlcmd -S $host -U sa -P $password -i ${create_path}
