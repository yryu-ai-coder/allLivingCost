from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import os
import json
from datetime import datetime
import gspread
from google.oauth2.service_account import Credentials
from google.auth.exceptions import GoogleAuthError
import logging
import traceback
import re
from flask_dance.contrib.google import make_google_blueprint, google
from flask import redirect, url_for, session

# Logging setup
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # Enable CORS

# Google Sheets API settings
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]

# Get settings from environment variables (for production)
SPREADSHEET_ID = os.getenv('SPREADSHEET_ID', '1g9ON1er2l3pDw2ZnOrz_NjOcISviK01wvYSmi9SXL5Y')
CREDENTIALS_FILE = os.getenv('GOOGLE_CREDENTIALS_FILE', 'alllivingcost-d74bb901a04e.json')

app.secret_key = os.getenv('FLASK_SECRET_KEY', 'dev_secret_key')

google_bp = make_google_blueprint(
    client_id=os.environ.get("GOOGLE_CLIENT_ID"),
    client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
    scope=[
        "openid",
        "https://www.googleapis.com/auth/userinfo.profile",
        "https://www.googleapis.com/auth/userinfo.email"
    ],
    redirect_url="/login/google/authorized"
)
app.register_blueprint(google_bp, url_prefix="/login")

@app.route("/login/google")
def login_google():
    if not google.authorized:
        return redirect(url_for("google.login"))
    resp = google.get("/oauth2/v2/userinfo")
    if not resp.ok:
        return "Failed to fetch user info from Google.", 400
    user_info = resp.json()
    # You can store user_info in session or DB as needed
    session['user'] = user_info
    return redirect(url_for("index"))

@app.route("/login/google/authorized")
def google_authorized():
    if not google.authorized:
        return redirect(url_for("google.login"))
    resp = google.get("/oauth2/v2/userinfo")
    if not resp.ok:
        return "Failed to fetch user info from Google.", 400
    user_info = resp.json()
    session['user'] = user_info
    return redirect(url_for("index"))

def get_google_sheets_client():
    """Create Google Sheets client"""
    try:
        creds = Credentials.from_service_account_file(CREDENTIALS_FILE, scopes=SCOPES)
        client = gspread.authorize(creds)
        return client
    except GoogleAuthError as e:
        logger.error(f"Google authentication error: {e}")
        return None
    except Exception as e:
        logger.error(f"Error creating Google Sheets client: {e}")
        return None

def save_to_google_sheets(data):
    """Save data to Google Sheets (overwrite if same date sheet exists)"""
    try:
        client = get_google_sheets_client()
        if not client:
            return save_to_local_file(data)

        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        # Use only date (YYYY-MM-DD) as sheet name, even if data['date'] has time
        raw_date = data.get("date")
        if raw_date:
            sheet_name = str(raw_date).split('T')[0].split('_')[0]
        else:
            sheet_name = datetime.now().strftime("%Y-%m-%d")
        worksheet = None
        try:
            worksheet = spreadsheet.worksheet(sheet_name)
            worksheet.clear()  # Overwrite: clear existing content
        except gspread.exceptions.WorksheetNotFound:
            worksheet = spreadsheet.add_worksheet(title=sheet_name, rows="100", cols="20")

        # 오직 A1에 전체 데이터를 JSON 문자열로 저장
        import json
        json_str = json.dumps(data, ensure_ascii=False, indent=2)
        worksheet.update('A1', [[json_str]])
        logger.info(f"Data saved to Google Sheets in sheet: {sheet_name} (JSON only in A1)")
        return True
    except Exception as e:
        logger.error(f"Error saving to Google Sheets: {e}")
        print(traceback.format_exc())
        return False

def save_to_local_file(data):
    """Save data to local file (for development)"""
    try:
        filename = 'living_cost_data.json'

        # Read existing data
        existing_data = []
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)

        # Add new data
        existing_data.append(data)

        # Save to file
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)

        logger.info(f"Data saved to local file: {filename}")
        return True
    except Exception as e:
        logger.error(f"Error saving to local file: {e}")
        return False

@app.route('/')
def index():
    """Main page"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    """Serve static files"""
    return send_from_directory('.', filename)

@app.route('/api/save-data', methods=['POST'])
def save_data():
    """Data save API"""
    try:
        data = request.get_json()
        logger.info(f"[save_data] Received data: {data}")  # Log received data

        if not data:
            logger.error("[save_data] No data provided.")
            return jsonify({'success': False, 'error': 'No data provided.'}), 400

        # Required field validation
        item_titles = [k for k in data.keys() if k.startswith('item_')]
        for item in item_titles:
            amount_key = item.replace('item_', '')
            if amount_key not in data or data[amount_key] is None:
                logger.error(f"[save_data] Amount for {data[item]} is required.")
                return jsonify({'success': False, 'error': f'Amount for {data[item]} is required.'}), 400

        logger.info("[save_data] Calling save_to_google_sheets...")
        # Save data
        success = save_to_google_sheets(data)
        logger.info(f"[save_data] save_to_google_sheets returned: {success}")

        if success:
            logger.info("[save_data] Returning success response to client.")
            return jsonify({
                'success': True,
                'message': 'Data saved successfully.',
                'data': data
            })
        else:
            logger.error("[save_data] Failed to save data.")
            return jsonify({
                'success': False,
                'error': 'Failed to save data.'
            }), 500
    except Exception as e:
        logger.error(f"[save_data] Error in save_data endpoint: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'Server error occurred. {str(e)}'
        }), 500

@app.route('/api/get-data', methods=['GET'])
def get_data():
    """Get saved data API"""
    try:
        client = get_google_sheets_client()

        if client:
            # Read data from Google Sheets
            spreadsheet = client.open_by_key(SPREADSHEET_ID)
            worksheet = spreadsheet.sheet1

            # Get all data
            all_data = worksheet.get_all_records()
            return jsonify({'success': True, 'data': all_data})
        else:
            # Read data from local file
            filename = 'living_cost_data.json'
            if os.path.exists(filename):
                with open(filename, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                return jsonify({'success': True, 'data': data})
            else:
                return jsonify({'success': True, 'data': []})
    except Exception as e:
        logger.error(f"Error in get_data endpoint: {e}")
        return jsonify({
            'success': False,
            'error': 'Failed to get data.'
        }), 500

@app.route('/api/sheet-names', methods=['GET'])
def get_sheet_names():
    """Return list of sheet names in the spreadsheet"""
    try:
        client = get_google_sheets_client()
        if not client:
            return jsonify({'success': False, 'error': 'Google Sheets 연결 실패'}), 500
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        sheet_names = [ws.title for ws in spreadsheet.worksheets()]
        return jsonify({'success': True, 'sheet_names': sheet_names})
    except Exception as e:
        logger.error(f"Error in get_sheet_names: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/get-sheet-data', methods=['GET'])
def get_sheet_data():
    """Return all data from a specific sheet (by name)"""
    sheet_name = request.args.get('sheet')
    if not sheet_name:
        return jsonify({'success': False, 'error': 'sheet 파라미터 필요'}), 400
    try:
        client = get_google_sheets_client()
        if not client:
            return jsonify({'success': False, 'error': 'Google Sheets 연결 실패'}), 500
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        worksheet = spreadsheet.worksheet(sheet_name)
        values = worksheet.get_all_values()
        return jsonify({'success': True, 'data': values})
    except Exception as e:
        logger.error(f"Error in get_sheet_data: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """Health check API"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'google_sheets_connected': get_google_sheets_client() is not None
    })

if __name__ == '__main__':
    # Development environment settings
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'

    print("=" * 50)
    print("AllLivingCost server started")
    print("=" * 50)
    print(f"Server address: http://localhost:{port}")
    print(f"Google Sheets connection: {'Connected' if get_google_sheets_client() else 'Not connected (dev mode)'}")
    print("=" * 50)

    app.run(host='0.0.0.0', port=port, debug=debug) 