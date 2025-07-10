import sqlite3

conn = sqlite3.connect("timetable.db")
cursor = conn.cursor()

cursor.execute("SELECT id, name, email, role FROM users")
users = cursor.fetchall()

print("\n🔍 All Users in 'timetable.db':\n")
for user in users:
    print(f"ID: {user[0]} | Name: {user[1]} | Email: {user[2]} | Role: {user[3]}")

conn.close()
