// 폼 요소들
const form = document.getElementById('livingCostForm');
const messageDiv = document.getElementById('message');

// 메시지 표시 함수
function showMessage(message, type = 'success') {
    messageDiv.textContent = message;
    messageDiv.className = `message ${type}`;
    messageDiv.style.display = 'block';
    
    // 5초 후 메시지 숨기기
    setTimeout(() => {
        messageDiv.style.display = 'none';
    }, 5000);
}

// 폼 초기화 함수
function resetForm() {
    form.reset();
    messageDiv.style.display = 'none';
    
    // 모든 입력 필드에서 포커스 효과 제거
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.style.borderColor = '#e1e5e9';
        input.style.transform = 'translateY(0)';
    });
    
    showMessage('폼이 초기화되었습니다.', 'success');
}

// 입력값 검증 함수
function validateForm(formData) {
    const requiredFields = [
        'mortgage', 'internet', 'hoa', 'garbage', 'water', 
        'electric', 'personalLoan', 'creditDebt', 'studentLoan', 
        'carPayment', 'subscription', 'insurance', 'income'
    ];
    
    for (let field of requiredFields) {
        const value = formData.get(field);
        if (!value || value === '') {
            showMessage(`${field} 필드를 입력해주세요.`, 'error');
            return false;
        }
        
        if (isNaN(value) || parseFloat(value) < 0) {
            showMessage(`${field} 필드에 유효한 숫자를 입력해주세요.`, 'error');
            return false;
        }
    }
    
    return true;
}

// 데이터를 객체로 변환하는 함수
function formDataToObject(formData) {
    const data = {};
    for (let [key, value] of formData.entries()) {
        data[key] = parseFloat(value) || 0;
    }
    
    // 현재 날짜 추가
    data.date = new Date().toISOString().split('T')[0];
    data.timestamp = new Date().toISOString();
    
    return data;
}

// 총 비용 계산 함수
function calculateTotalCosts(data) {
    const costs = [
        data.mortgage, data.internet, data.hoa, data.garbage, 
        data.water, data.electric, data.personalLoan, data.creditDebt, 
        data.studentLoan, data.carPayment, data.subscription, data.insurance
    ];
    
    return costs.reduce((sum, cost) => sum + cost, 0);
}

// 수익성 분석 함수
function analyzeFinancialHealth(data) {
    const totalCosts = calculateTotalCosts(data);
    const income = data.income;
    const netIncome = income - totalCosts;
    const savingsRate = (netIncome / income) * 100;
    
    return {
        totalCosts,
        netIncome,
        savingsRate,
        isHealthy: savingsRate >= 20
    };
}

// 폼 제출 처리
form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const formData = new FormData(form);
    
    // 입력값 검증
    if (!validateForm(formData)) {
        return;
    }
    
    // 데이터 객체로 변환
    const data = formDataToObject(formData);
    
    // 재정 상태 분석
    const analysis = analyzeFinancialHealth(data);
    
    // 로딩 메시지 표시
    showMessage('데이터를 저장하는 중입니다...', 'loading');
    
    try {
        // Python 백엔드로 데이터 전송
        const response = await fetch('/api/save-data', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                ...data,
                analysis: analysis
            })
        });
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        
        if (result.success) {
            // 성공 메시지와 함께 재정 분석 결과 표시
            let message = '데이터가 성공적으로 저장되었습니다!\n\n';
            message += `총 비용: $${analysis.totalCosts.toFixed(2)}\n`;
            message += `순수입: $${analysis.netIncome.toFixed(2)}\n`;
            message += `저축률: ${analysis.savingsRate.toFixed(1)}%\n\n`;
            
            if (analysis.isHealthy) {
                message += '🎉 좋은 재정 상태입니다!';
            } else {
                message += '⚠️ 지출을 줄이는 것을 고려해보세요.';
            }
            
            showMessage(message, 'success');
            
            // 폼 초기화
            setTimeout(() => {
                resetForm();
            }, 3000);
        } else {
            showMessage(result.error || '데이터 저장에 실패했습니다.', 'error');
        }
        
    } catch (error) {
        console.error('Error:', error);
        showMessage('서버 연결에 실패했습니다. 나중에 다시 시도해주세요.', 'error');
    }
});

// 입력 필드 실시간 유효성 검사
const inputs = form.querySelectorAll('input[type="number"]');
inputs.forEach(input => {
    input.addEventListener('input', function() {
        const value = this.value;
        
        if (value && !isNaN(value) && parseFloat(value) >= 0) {
            this.style.borderColor = '#28a745';
        } else if (value) {
            this.style.borderColor = '#dc3545';
        } else {
            this.style.borderColor = '#e1e5e9';
        }
    });
    
    // 포커스 효과
    input.addEventListener('focus', function() {
        this.style.transform = 'translateY(-2px)';
    });
    
    input.addEventListener('blur', function() {
        this.style.transform = 'translateY(0)';
    });
});

// 키보드 단축키
document.addEventListener('keydown', function(e) {
    // Ctrl + Enter로 폼 제출
    if (e.ctrlKey && e.key === 'Enter') {
        form.dispatchEvent(new Event('submit'));
    }
    
    // Escape로 폼 초기화
    if (e.key === 'Escape') {
        resetForm();
    }
});

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 폼 필드에 자동완성 비활성화
    const inputs = form.querySelectorAll('input');
    inputs.forEach(input => {
        input.setAttribute('autocomplete', 'off');
    });
    
    // 첫 번째 입력 필드에 포커스
    const firstInput = form.querySelector('input');
    if (firstInput) {
        firstInput.focus();
    }
});

// 데이터 미리보기 기능 (개발용)
function previewData() {
    const formData = new FormData(form);
    const data = formDataToObject(formData);
    const analysis = analyzeFinancialHealth(data);
    
    console.log('입력된 데이터:', data);
    console.log('재정 분석:', analysis);
}

// 개발자 도구에서 사용할 수 있도록 전역 함수로 노출
window.previewData = previewData;
window.resetForm = resetForm; 