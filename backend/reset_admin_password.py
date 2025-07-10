import sqlite3
from werkzeug.security import generate_password_hash

EMAIL = 'admin@srmist.edu.in'
NEW_PASSWORD = 'admin123'

conn = sqlite3.connect("timetable.db")
cursor = conn.cursor()

# Generate new hashed password
hashed = generate_password_hash(NEW_PASSWORD)

cursor.execute("""
    UPDATE users
    SET password_hash = ?
    WHERE email = ?
""", (hashed, EMAIL))

conn.commit()
conn.close()

print(f"✅ Password reset for {EMAIL}. New password is '{NEW_PASSWORD}'")
