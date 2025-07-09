# AllLivingCost - 생활비 관리 시스템

## 개요
AllLivingCost는 개인의 월별 생활비를 체계적으로 관리할 수 있는 웹 애플리케이션입니다. 수입과 지출을 카테고리별로 분류하여 재정 상태를 한눈에 파악할 수 있습니다.

## 주요 기능

### 🔐 로그인 시스템
- 사용자 인증 및 회원가입
- 소셜 로그인 (Google, Apple) 지원 예정
- 자동 로그인 기능
- 보안된 세션 관리

### 💰 생활비 관리
- **수입 관리**: 급여, 부수입 등
- **주거비**: 모기지, HOA, 공과금 등
- **신용카드 & 할부**: 각종 신용카드 결제
- **개인대출**: 개인 대출 상환
- **차량비용**: 자동차 관련 모든 비용
- **학자금대출**: 학생 대출 상환
- **공과금 & 통신**: 인터넷, 휴대폰 요금
- **보험**: 자동차, 생명보험 등
- **구독서비스**: 스트리밍, 클라우드 서비스 등

### 📊 대시보드
- 실시간 수입/지출 요약
- 카테고리별 파이 차트
- 재정 상태 분석
- 월별 추이 그래프

## 시작하기

### 1. 로그인
- `login.html` 페이지에서 로그인
- 데모 계정 사용 가능:
  - 이메일: `demo@example.com`
  - 비밀번호: `password123`

### 2. 데이터 입력
- 각 카테고리별로 항목 추가/삭제 가능
- 실시간 계산 및 요약 업데이트
- 데이터 자동 저장

### 3. 분석 및 관리
- 대시보드에서 전체 재정 상태 확인
- 카테고리별 지출 분석
- 수입 대비 지출 비율 확인

## 기술 스택
- **Frontend**: HTML5, CSS3, JavaScript (ES6+)
- **Charts**: Chart.js
- **Styling**: Custom CSS with modern design
- **Authentication**: Local Storage (개발용)

## 파일 구조
```
AllLivingCost/
├── index.html          # 메인 애플리케이션
├── login.html          # 로그인 페이지
├── styles.css          # 스타일시트
├── script.js           # 메인 JavaScript
├── login.js            # 로그인 JavaScript
├── app.py              # 백엔드 서버 (Flask)
├── requirements.txt    # Python 의존성
└── README.md           # 프로젝트 문서
```

## 설치 및 실행

### 1. 저장소 클론
```bash
git clone [repository-url]
cd AllLivingCost
```

### 2. Python 환경 설정 (백엔드용)
```bash
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 3. 서버 실행
```bash
python app.py
```

### 4. 브라우저에서 접속
- 로그인: `http://localhost:5000/login.html`
- 메인 앱: `http://localhost:5000/` (로그인 후 자동 리다이렉트)

## 보안 고려사항
- 현재는 개발용 로컬 스토리지 인증 사용
- 프로덕션 환경에서는 서버 사이드 인증 구현 필요
- 민감한 데이터는 암호화하여 저장 권장

## 향후 개발 계획
- [ ] 실제 데이터베이스 연동
- [ ] 서버 사이드 인증 시스템
- [ ] 소셜 로그인 구현
- [ ] 데이터 백업/복원 기능
- [ ] 모바일 앱 개발
- [ ] 다국어 지원

## 라이선스
MIT License

## 기여하기
프로젝트에 기여하고 싶으시다면 Pull Request를 보내주세요!

## 문의
프로젝트에 대한 문의사항이 있으시면 이슈를 생성해주세요. 