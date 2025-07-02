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

# 로깅 설정
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = Flask(__name__)
CORS(app)  # CORS 활성화

# Google Sheets API 설정
SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive'
]

# 환경 변수에서 설정 가져오기 (실제 배포 시 사용)
SPREADSHEET_ID = os.getenv('SPREADSHEET_ID', '1g9ON1er2l3pDw2ZnOrz_NjOcISviK01wvYSmi9SXL5Y')
CREDENTIALS_FILE = os.getenv('GOOGLE_CREDENTIALS_FILE', 'alllivingcost-d74bb901a04e.json')

def get_google_sheets_client():
    """Google Sheets 클라이언트 생성"""
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
    """Google Sheets에 데이터 저장"""
    try:
        client = get_google_sheets_client()
        if not client:
            # 개발 환경에서는 로컬 파일에 저장
            return save_to_local_file(data)
        
        # 스프레드시트 열기
        spreadsheet = client.open_by_key(SPREADSHEET_ID)
        worksheet = spreadsheet.sheet1
        
        # 헤더가 없으면 추가
        headers = [
            'Date', 'Timestamp', 'Mortgage', 'Internet', 'HOA', 'Garbage', 
            'Water', 'Electric', 'Personal Loan', 'Credit Debt', 'Student Loan',
            'Car Payment', 'Subscription', 'Insurance', 'Income',
            'Total Costs', 'Net Income', 'Savings Rate', 'Financial Health'
        ]
        
        # 첫 번째 행이 비어있으면 헤더 추가
        if not worksheet.row_values(1):
            worksheet.append_row(headers)
        
        # 데이터 행 준비
        row_data = [
            data.get('date', ''),
            data.get('timestamp', ''),
            data.get('mortgage', 0),
            data.get('internet', 0),
            data.get('hoa', 0),
            data.get('garbage', 0),
            data.get('water', 0),
            data.get('electric', 0),
            data.get('personalLoan', 0),
            data.get('creditDebt', 0),
            data.get('studentLoan', 0),
            data.get('carPayment', 0),
            data.get('subscription', 0),
            data.get('insurance', 0),
            data.get('income', 0),
            data.get('analysis', {}).get('totalCosts', 0),
            data.get('analysis', {}).get('netIncome', 0),
            data.get('analysis', {}).get('savingsRate', 0),
            'Healthy' if data.get('analysis', {}).get('isHealthy', False) else 'Needs Attention'
        ]
        
        # 데이터 추가
        worksheet.append_row(row_data)
        
        logger.info(f"Data saved to Google Sheets successfully")
        return True
        
    except Exception as e:
        logger.error(f"Error saving to Google Sheets: {e}")
        print(traceback.format_exc())
        return False

def save_to_local_file(data):
    """로컬 파일에 데이터 저장 (개발용)"""
    try:
        filename = 'living_cost_data.json'
        
        # 기존 데이터 읽기
        existing_data = []
        if os.path.exists(filename):
            with open(filename, 'r', encoding='utf-8') as f:
                existing_data = json.load(f)
        
        # 새 데이터 추가
        existing_data.append(data)
        
        # 파일에 저장
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(existing_data, f, ensure_ascii=False, indent=2)
        
        logger.info(f"Data saved to local file: {filename}")
        return True
        
    except Exception as e:
        logger.error(f"Error saving to local file: {e}")
        return False

@app.route('/')
def index():
    """메인 페이지"""
    return send_from_directory('.', 'index.html')

@app.route('/<path:filename>')
def static_files(filename):
    """정적 파일 서빙"""
    return send_from_directory('.', filename)

@app.route('/api/save-data', methods=['POST'])
def save_data():
    """데이터 저장 API"""
    try:
        data = request.get_json()
        
        if not data:
            return jsonify({'success': False, 'error': '데이터가 없습니다.'}), 400
        
        # 필수 필드 검증
        required_fields = [
            'mortgage', 'internet', 'hoa', 'garbage', 'water', 
            'electric', 'personalLoan', 'creditDebt', 'studentLoan',
            'carPayment', 'subscription', 'insurance', 'income'
        ]
        
        for field in required_fields:
            if field not in data or data[field] is None:
                return jsonify({'success': False, 'error': f'{field} 필드가 필요합니다.'}), 400
        
        # 데이터 저장
        success = save_to_google_sheets(data)
        
        if success:
            return jsonify({
                'success': True,
                'message': '데이터가 성공적으로 저장되었습니다.',
                'data': data
            })
        else:
            return jsonify({
                'success': False,
                'error': '데이터 저장에 실패했습니다.'
            }), 500
            
    except Exception as e:
        logger.error(f"Error in save_data endpoint: {e}")
        print(traceback.format_exc())
        return jsonify({
            'success': False,
            'error': f'서버 오류가 발생했습니다. {str(e)}'
        }), 500

@app.route('/api/get-data', methods=['GET'])
def get_data():
    """저장된 데이터 조회 API"""
    try:
        client = get_google_sheets_client()
        
        if client:
            # Google Sheets에서 데이터 읽기
            spreadsheet = client.open_by_key(SPREADSHEET_ID)
            worksheet = spreadsheet.sheet1
            
            # 모든 데이터 가져오기
            all_data = worksheet.get_all_records()
            return jsonify({'success': True, 'data': all_data})
        else:
            # 로컬 파일에서 데이터 읽기
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
            'error': '데이터 조회에 실패했습니다.'
        }), 500

@app.route('/api/health', methods=['GET'])
def health_check():
    """헬스 체크 API"""
    return jsonify({
        'status': 'healthy',
        'timestamp': datetime.now().isoformat(),
        'google_sheets_connected': get_google_sheets_client() is not None
    })

if __name__ == '__main__':
    # 개발 환경 설정
    port = int(os.environ.get('PORT', 5000))
    debug = os.environ.get('FLASK_ENV') == 'development'
    
    print("=" * 50)
    print("AllLivingCost 서버 시작")
    print("=" * 50)
    print(f"서버 주소: http://localhost:{port}")
    print(f"Google Sheets 연결: {'연결됨' if get_google_sheets_client() else '연결 안됨 (개발 모드)'}")
    print("=" * 50)
    
    app.run(host='0.0.0.0', port=port, debug=debug) 