from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token
from werkzeug.security import check_password_hash
import sqlite3

api = Blueprint('api', __name__, url_prefix='/api')

@api.route('/auth/login', methods=['POST'])
def login():
    try:
        data = request.get_json()
        email = data.get('email')
        password = data.get('password')

        if not email or not password:
            return jsonify({'error': 'Email and password are required'}), 400

        conn = sqlite3.connect('timetable.db')
        cursor = conn.cursor()

        cursor.execute('''
            SELECT id, name, email, password_hash, role FROM users WHERE email = ?
        ''', (email,))
        user_data = cursor.fetchone()
        conn.close()

        if not user_data or not check_password_hash(user_data[3], password):
            return jsonify({'error': 'Invalid email or password'}), 401

        user = {
            'id': str(user_data[0]),
            'name': user_data[1],
            'email': user_data[2],
            'role': user_data[4]
        }

        access_token = create_access_token(identity=user['id'])

        return jsonify({
            'user': user,
            'token': access_token
        }), 200

    except Exception as e:
        return jsonify({'error': str(e)}), 500

@api.route('/auth/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        name = data.get('name')
        email = data.get('email')
        password = data.get('password')
        role = data.get('role')

        if not all([name, email, password, role]):
            return jsonify({'error': 'All fields are required'}), 400

        if not email.endswith('@srmist.edu.in'):
            return jsonify({'error': 'Only @srmist.edu.in emails are allowed'}), 400

        password_hash = generate_password_hash(password)

        conn = sqlite3.connect('timetable.db')
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO users (name, email, password_hash, role)
            VALUES (?, ?, ?, ?)
        ''', (name, email, password_hash, role))
        conn.commit()
        conn.close()

        return jsonify({'message': 'User registered successfully'}), 201

    except sqlite3.IntegrityError:
        return jsonify({'error': 'Email already exists'}), 409
    except Exception as e:
        return jsonify({'error': str(e)}), 500
