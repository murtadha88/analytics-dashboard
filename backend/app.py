from flask import Flask, jsonify, request
from flask_cors import CORS
from flask_login import (
    LoginManager,
    login_user,
    logout_user,
    login_required,
    current_user
)
from dotenv import load_dotenv
import os
import pandas as pd
import io
from functools import wraps

from models import User, Data
from extensions import db, bcrypt

load_dotenv()

app = Flask(__name__)

print(f"DATABASE_URL: {os.environ.get('DATABASE_URL')}")

app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'a_very_secret_and_long_key_for_demonstration')

app.config['SQLALCHEMY_DATABASE_URI'] = os.environ.get('DATABASE_URL', 'postgresql://user:password@localhost/dashboard')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app, supports_credentials=True)

db.init_app(app)
bcrypt.init_app(app)

# Flask-Login
login_manager = LoginManager()
login_manager.init_app(app)


@login_manager.user_loader
def load_user(user_id):
    return User.query.get(int(user_id))

def admin_required(f):
    @wraps(f)
    def decorated_function(*args, **kwargs):
        if not current_user.is_authenticated or current_user.role != 'admin':
            return jsonify({'message': 'Forbidden: Admins only'}), 403
        return f(*args, **kwargs)
    return decorated_function

# ROUTES:

# Signup Route
@app.route('/auth/signup', methods=['POST'])
def signup():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    if not username or not password:
        return jsonify({'message': 'Username and password are required'}), 400

    if User.query.filter_by(username=username).first():
        return jsonify({'message': 'Username already exists'}), 409

    new_user = User(username=username, role='viewer')
    new_user.set_password(password)
    
    try:
        db.session.add(new_user)
        db.session.commit()
        return jsonify({'message': 'User created successfully'}), 201
    except Exception as e:
        db.session.rollback()
        return jsonify({'message': 'Error creating user', 'error': str(e)}), 500

@app.route('/auth/login', methods=['POST'])
def login():
    data = request.json
    username = data.get('username')
    password = data.get('password')

    user = User.query.filter_by(username=username).first()

    if user and user.check_password(password):
        login_user(user)
        return jsonify({'message': 'Login successful', 'username': username, 'role': user.role}), 200
    
    return jsonify({'message': 'Invalid credentials'}), 401


# Logout Route
@app.route('/auth/logout', methods=['POST'])
def logout():
    logout_user()
    return jsonify({'message': 'Logout successful'}), 200


@app.route('/auth/status', methods=['GET'])
def auth_status():
    if current_user.is_authenticated:
        return jsonify({'is_authenticated': True, 'username': current_user.username, 'role': current_user.role}), 200
    return jsonify({'is_authenticated': False}), 200


@app.route('/data/upload', methods=['POST'])
@login_required
@admin_required
def upload_data():
    if 'file' not in request.files:
        return jsonify({'message': 'No file part in the request'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'message': 'No selected file'}), 400
    
    if file and file.filename.endswith('.csv'):
        try:
            data = pd.read_csv(io.StringIO(file.stream.read().decode("utf-8")), encoding='utf-8')

            print("Uploaded CSV columns:", data.columns.tolist())

            # Normalize columns
            data.columns = [col.strip().lower() for col in data.columns]

            if 'date' not in data.columns:
                return jsonify({'message': "CSV must include a 'Date' column"}), 400

            data['date'] = pd.to_datetime(data['date'], errors='coerce')

            # Drop duplicates
            original_rows = len(data)
            data.drop_duplicates(inplace=True)
            duplicates_removed = original_rows - len(data)

            # Wipe old data
            db.session.query(Data).delete()
            db.session.commit()

            # Save new rows
            for _, row in data.iterrows():
                new_data_entry = Data(
                    date=row['date'],
                    month=row.get('month'),
                    quantity=row.get('quantity'),
                    price=row.get('price'),
                    sales=row.get('sales')
                )
                db.session.add(new_data_entry)

            db.session.commit()

            return jsonify({
                'message': 'File uploaded and processed successfully',
                'original_rows': original_rows,
                'duplicates_removed': duplicates_removed,
                'processed_rows': len(data),
                'columns': data.columns.tolist()
            }), 200
        except Exception as e:
            db.session.rollback()
            return jsonify({'message': 'Error processing file', 'error': str(e)}), 500
    else:
        return jsonify({'message': 'Invalid file type. Please upload a CSV file.'}), 400


@app.route('/data', methods=['GET'])
@login_required
def get_dashboard_data():
    if current_user.role != 'admin':
        return jsonify({'message': 'Forbidden: Admins only'}), 403

    try:
        query = Data.query.all()
        rows = [
            {
                "date": entry.date,
                "month": entry.date.strftime("%Y-%m"),
                "sales": entry.sales,
                "quantity": entry.quantity,
            }
            for entry in query
        ]
        df = pd.DataFrame(rows)

        if df.empty:
            return jsonify({'sales': [], 'quantity': []})

        grouped = df.groupby("month").agg({
            "sales": "sum",
            "quantity": "sum"
        }).reset_index()

        sales_data = [{"label": row["month"], "value": row["sales"]} for _, row in grouped.iterrows()]
        quantity_data = [{"label": row["month"], "value": row["quantity"]} for _, row in grouped.iterrows()]

        return jsonify({
            "sales": sales_data,
            "quantity": quantity_data
        })

    except Exception as e:
        return jsonify({'message': 'Error retrieving data', 'error': str(e)}), 500

if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
