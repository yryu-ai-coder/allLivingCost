# AllLivingCost - 생활비 관리 시스템

Google Spreadsheet에 생활비 데이터를 저장하고 관리하는 웹 애플리케이션입니다.

## 기능

- 📊 13개 항목의 생활비 데이터 입력
- 💰 실시간 재정 상태 분석
- 📈 Google Sheets 자동 저장
- 🎨 모던하고 반응형 UI
- ✅ 실시간 입력 검증

## 설치 및 실행

### 1. 저장소 클론
```bash
git clone <repository-url>
cd AllLivingCost
```

### 2. Python 가상환경 생성 및 활성화
```bash
python -m venv venv
source venv/bin/activate  # macOS/Linux
# 또는
venv\Scripts\activate  # Windows
```

### 3. 필요한 패키지 설치
```bash
pip install -r requirements.txt
```

### 4. Google Sheets API 설정 (선택사항)

#### Google Cloud Console에서 설정:
1. [Google Cloud Console](https://console.cloud.google.com/)에 접속
2. 새 프로젝트 생성
3. Google Sheets API 활성화
4. 서비스 계정 생성
5. JSON 키 파일 다운로드
6. `credentials.json`으로 파일명 변경하여 프로젝트 루트에 저장

#### Google Sheets 설정:
1. 새 Google Sheets 문서 생성
2. 서비스 계정 이메일을 문서에 공유 (편집 권한)
3. 스프레드시트 ID 복사 (URL에서 추출)

### 5. 환경 변수 설정 (선택사항)
```bash
export SPREADSHEET_ID="your-spreadsheet-id"
export GOOGLE_CREDENTIALS_FILE="credentials.json"
export FLASK_ENV="development"
```

### 6. 서버 실행
```bash
python app.py
```

브라우저에서 `http://localhost:5000`으로 접속하세요.

## 데이터 항목

1. **Mortgage 및 Apartment** - 월세/아파트 비용
2. **Internet** - 인터넷 요금
3. **HOA** - HOA 비용
4. **쓰레기** - 쓰레기 수거료
5. **수도 사용료** - 수도 요금
6. **Personal Loan per each** - 개인 대출
7. **Credit debt** - 신용카드 부채
8. **Subscription** - 구독 서비스
9. **Insurance** - 보험료
10. **학자금 융자** - 학자금 대출
11. **Car financial Payment** - 자동차 할부금
12. **들어오는 Income** - 월 수입
13. **Electric fee** - 전기 요금

## 개발 모드

Google Sheets API 설정 없이도 로컬 파일(`living_cost_data.json`)에 데이터를 저장할 수 있습니다.

## API 엔드포인트

- `GET /` - 메인 페이지
- `POST /api/save-data` - 데이터 저장
- `GET /api/get-data` - 저장된 데이터 조회
- `GET /api/health` - 서버 상태 확인

## 키보드 단축키

- `Ctrl + Enter` - 폼 제출
- `Escape` - 폼 초기화

## 기술 스택

- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Backend**: Python Flask
- **Database**: Google Sheets API
- **Styling**: Custom CSS with gradients and animations

## 라이선스

MIT License

## 기여하기

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 문제 해결

### Google Sheets 연결 오류
- 서비스 계정 키 파일이 올바른 위치에 있는지 확인
- 스프레드시트 ID가 정확한지 확인
- 서비스 계정 이메일이 스프레드시트에 공유되어 있는지 확인

### 포트 충돌
- 다른 포트 사용: `export PORT=5001 && python app.py`

### CORS 오류
- Flask-CORS가 올바르게 설치되어 있는지 확인
- 브라우저 캐시 삭제 후 재시도 