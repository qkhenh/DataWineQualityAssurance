
import mysql.connector
import os
from dotenv import load_dotenv

load_dotenv()

try:
    mydb = mysql.connector.connect(
      host=os.getenv("MYSQL_HOST"),
      user=os.getenv("MYSQL_USER"),
      password=os.getenv("MYSQL_PASSWORD"),
      database=os.getenv("MYSQL_DATABASE")
    )

    mycursor = mydb.cursor()

    mycursor.execute("SELECT user_id, username, warehouse_id FROM Users")

    myresult = mycursor.fetchall()

    print("User ID | Username | Warehouse ID")
    print("-" * 30)
    for x in myresult:
      print(f"{x[0]} | {x[1]} | {x[2]}")

except Exception as e:
    print(f"Error: {e}")
