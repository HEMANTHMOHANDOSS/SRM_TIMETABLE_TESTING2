import sqlite3
from werkzeug.security import generate_password_hash

def seed_database():
    """Create tables and seed database with sample data"""
    conn = sqlite3.connect('timetable.db')
    cursor = conn.cursor()

    # ---------- CREATE TABLES IF NOT EXISTS ----------
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT NOT NULL UNIQUE
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            department_id INTEGER NOT NULL,
            FOREIGN KEY(department_id) REFERENCES departments(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS classrooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            capacity INTEGER NOT NULL,
            department_id INTEGER NOT NULL,
            FOREIGN KEY(department_id) REFERENCES departments(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT NOT NULL UNIQUE,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL,
            department_id INTEGER,
            staff_role TEXT,
            subjects_selected TEXT,
            subjects_locked BOOLEAN,
            FOREIGN KEY(department_id) REFERENCES departments(id)
        )
    ''')

    # ---------- DEPARTMENTS ----------
    departments = [
        ('MCA COMPUTER APPLICATIONS', 'MCA'),
        ('MCA GENERATIVE AI', 'MCA-GENAI'),
        ('BCA', 'BCA'),
        ('BCA DATASCIENCE', 'BCA-DS'),
        ('B.SC CS', 'BSC-CS'),
        ('B.SC CYBER SECURITY', 'BSC-CYBER'),
        ('BCA GEN AI', 'BCA-GENAI'),
        ('M.SC APPLIED DS', 'MSC-ADS'),
        ('B.SC AIML', 'BSC-AIML')
    ]

    for dept in departments:
        cursor.execute('INSERT OR IGNORE INTO departments (name, code) VALUES (?, ?)', dept)

    # ---------- SUBJECTS for MCA (assuming dept_id = 1) ----------
    mca_subjects = [
        ('Python for AI', 'AI101', 1),
        ('Deep Learning', 'AI102', 1),
        ('Generative Models', 'AI103', 1),
        ('Prompt Engineering', 'AI104', 1)
    ]
    for subject in mca_subjects:
        cursor.execute('INSERT OR IGNORE INTO subjects (name, code, department_id) VALUES (?, ?, ?)', subject)

    # ---------- CLASSROOMS for MCA ----------
    mca_classrooms = [
        ('Lab MCA101', 30, 1),
        ('Room MCA102', 40, 1),
        ('Seminar Hall MCA', 100, 1)
    ]
    for classroom in mca_classrooms:
        cursor.execute('INSERT OR IGNORE INTO classrooms (name, capacity, department_id) VALUES (?, ?, ?)', classroom)

    # ---------- USERS ----------
    users = [
        # Main Admin
        ('Main Admin', 'admin@srmist.edu.in', generate_password_hash('admin123'), 'main_admin', None, None, None, False),
        # Department Admin for MCA
        ('MCA Admin', 'mca.admin@srmist.edu.in', generate_password_hash('mcaadmin123'), 'dept_admin', 1, None, None, False),
        # Staff members
        ('Dr. Alpha', 'alpha@srmist.edu.in', generate_password_hash('staff123'), 'staff', 1, 'professor', '1,2', True),
        ('Dr. Beta', 'beta@srmist.edu.in', generate_password_hash('staff123'), 'staff', 1, 'assistant_professor', '3', True),
        ('Dr. Gamma', 'gamma@srmist.edu.in', generate_password_hash('staff123'), 'staff', 1, 'hod', '4', True)
    ]

    for user in users:
        cursor.execute('''
            INSERT OR IGNORE INTO users 
            (name, email, password_hash, role, department_id, staff_role, subjects_selected, subjects_locked) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', user)

    conn.commit()
    conn.close()
    print("✅ Database seeded successfully!")

if __name__ == '__main__':
    seed_database()
