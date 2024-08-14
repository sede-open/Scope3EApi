USE appdb

CREATE LOGIN app_admin WITH PASSWORD = 'test_mssql_password_qzB1HVM2BpOARw';
CREATE USER app_admin FOR LOGIN app_admin;

ALTER ROLE db_datawriter ADD MEMBER app_admin;
ALTER ROLE db_datareader ADD MEMBER app_admin;

GRANT ALTER ON DATABASE::appdb TO app_admin;
GRANT SELECT ON DATABASE::appdb TO app_admin;
GRANT INSERT ON DATABASE::appdb TO app_admin;
GRANT REFERENCES TO [app_admin];

GRANT SELECT , INSERT ON SCHEMA :: [dbo] TO app_admin;