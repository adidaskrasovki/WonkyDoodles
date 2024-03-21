# Credit to:
# https://blog.ajbothe.com/querying-an-azure-sql-database-with-python-on-linux-using-pypyodbc

import pypyodbc
from wonkydoodles import azurecreds

class AzureDB:
    dsn = 'DRIVER='+azurecreds.AZDBDRIVER+';SERVER='+azurecreds.AZDBSERVER+';DATABASE='+azurecreds.AZDBNAME+';UID='+azurecreds.AZDBUSER+';PWD='+azurecreds.AZDBPW+';Encrypt='+azurecreds.AZDBENCRYPT+';TrustServerCertificate='+azurecreds.AZDBTRUSTSERVERCERTIFICATE+';ConnectionTimeout='+azurecreds.AZDBCONNECTIONTIMEOUT+';'

    def __init__(self):
        self.conn = pypyodbc.connect(self.dsn)
        self.conn.autocommit = False
        self.cursor = self.conn.cursor()

    def finalize(self):
      if self.conn:
        self.cursor.close()
        self.conn.close()

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.finalize()

    def __enter__(self):
        return self


    # QUERY FUNCTION
    def query(self, query: str, args: list):
        try:
            self.cursor.execute(query, args)
            data = [dict(zip([column[0] for column in self.cursor.description], row)) for row in self.cursor.fetchall()]
            return data
        except pypyodbc.DatabaseError as exception:
            print('Failed to execute query')
            print(exception)
            exit (1)

    def insert(self, query: str, args: list):
        try:
            self.cursor.execute(query, args)
        except pypyodbc.DatabaseError as exception:
            print('Failed to execute query')
            print(exception)
            exit (1)
