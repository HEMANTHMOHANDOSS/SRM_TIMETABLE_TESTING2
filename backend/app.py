from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_jwt_extended import JWTManager
from werkzeug.security import generate_password_hash, check_password_hash
import sqlite3
from datetime import timedelta
import os
from dotenv import load_dotenv
from api_routes import api  # Ensure this file exists
from ai_timetable import TimetableGenerator  # Ensure this file exists

# ----------------- Load .env -----------------
load_dotenv()

# ----------------- Initialize Flask App -----------------
app = Flask(__name__)
app.config['JWT_SECRET_KEY'] = os.getenv('JWT_SECRET_KEY', 'your-secret-key-change-in-production')
app.config['JWT_ACCESS_TOKEN_EXPIRES'] = timedelta(hours=24)

jwt = JWTManager(app)

# ----------------- CORS Configuration -----------------
CORS(app, resources={r"/api/*": {"origins": ["http://localhost:5173", "http://localhost:8080"]}}, supports_credentials=True)

# ----------------- Register Blueprints -----------------
app.register_blueprint(api)

# ----------------- Preflight (OPTIONS) Handler -----------------
@app.before_request
def handle_options():
    if request.method == 'OPTIONS':
        return '', 200

# ----------------- Root Route -----------------
@app.route('/')
def root():
    return jsonify({
        'message': '✅ SRM Timetable AI Backend is running.',
        'docs': '/api/health',
        'login': '/api/auth/login',
        'register': '/api/auth/register'
    }), 200

# ----------------- Health Check -----------------
@app.route('/api/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'healthy',
        'message': 'SRM Timetable AI Backend is live on Flask'
    }), 200

# ----------------- SQLite Database Setup -----------------
def init_db():
    conn = sqlite3.connect('timetable.db')
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            email TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK (role IN ('main_admin', 'dept_admin', 'staff')),
            department_id INTEGER,
            staff_role TEXT CHECK (staff_role IN ('assistant_professor', 'professor', 'hod')),
            subjects_selected TEXT,
            subjects_locked BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments (id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS departments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT UNIQUE NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS subjects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            code TEXT NOT NULL,
            department_id INTEGER NOT NULL,
            credits INTEGER DEFAULT 3,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS classrooms (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            capacity INTEGER NOT NULL,
            department_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments(id)
        )
    ''')

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS timetables (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            department_id INTEGER NOT NULL,
            day TEXT NOT NULL,
            time_slot TEXT NOT NULL,
            subject_id INTEGER NOT NULL,
            staff_id INTEGER NOT NULL,
            classroom_id INTEGER NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (department_id) REFERENCES departments(id),
            FOREIGN KEY (subject_id) REFERENCES subjects(id),
            FOREIGN KEY (staff_id) REFERENCES users(id),
            FOREIGN KEY (classroom_id) REFERENCES classrooms(id)
        )
    ''')

    conn.commit()
    conn.close()

# ----------------- Entry Point -----------------
if __name__ == '__main__':
    init_db()
    app.run(debug=True, port=5000)
