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
    
    // Select Sheet 드롭다운을 항상 placeholder로 초기화
    const select = document.getElementById('sheetSelect');
    if (select) select.selectedIndex = 0;
    // Selected Sheet 라벨도 초기화
    const label = document.getElementById('selectedSheetLabel');
    if (label) label.textContent = '';
    
    showMessage('Form has been reset.', 'success');
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
            showMessage(`${field} field is required.`, 'error');
            return false;
        }
        
        if (isNaN(value) || parseFloat(value) < 0) {
            showMessage(`${field} field must be a valid number.`, 'error');
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

    // Selected Sheet에서 날짜 추출해 date 필드로 세팅
    const label = document.getElementById('selectedSheetLabel');
    let useCurrentDate = false;
    if (label && label.textContent.includes(':')) {
        const selectedDate = label.textContent.split(':')[1].trim();
        if (selectedDate) {
            formData.set('date', selectedDate);
        } else {
            useCurrentDate = true;
        }
    } else {
        useCurrentDate = true;
    }
    if (useCurrentDate) {
        // Select Sheet가 선택되어 있지 않으면 오늘 날짜로 저장
        formData.set('date', new Date().toISOString().split('T')[0]);
    }

    const data = {};
    // 모든 input 값을 key-value로 저장 (빈 값도 포함)
    for (let [key, value] of formData.entries()) {
        data[key] = value;
    }
    // 날짜 정보 추가 (이미 위에서 세팅됨)
    data.date = formData.get('date');
    data.timestamp = new Date().toISOString();

    showMessage('Saving data...', 'loading');

    try {
        const response = await fetch('/api/save-data', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            showMessage('Your data has been saved successfully!', 'success');
            setTimeout(() => {
                resetForm();
                // 드롭다운과 Selected Sheet 라벨도 초기화
                const select = document.getElementById('sheetSelect');
                if (select) select.selectedIndex = 0;
                const label = document.getElementById('selectedSheetLabel');
                if (label) label.textContent = '';
            }, 3000);
        } else {
            showMessage(result.error || 'Failed to save data.', 'error');
        }
    } catch (error) {
        showMessage('Failed to connect to the server. Please try again later.', 'error');
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

// 인증 확인 함수
function checkAuthentication() {
    const isAuthenticated = localStorage.getItem('isAuthenticated');
    if (!isAuthenticated) {
        window.location.href = 'login.html';
        return false;
    }
    return true;
}

// 로그아웃 함수
function logout() {
    // 인증 정보 제거
    localStorage.removeItem('isAuthenticated');
    localStorage.removeItem('userEmail');
    
    // 로그인 페이지로 리다이렉트
    window.location.href = 'login.html';
}

// 시트 목록 불러오기 및 드롭다운 채우기
async function loadSheetNames() {
    try {
        const res = await fetch('/api/sheet-names');
        const data = await res.json();
        if (data.success) {
            const select = document.getElementById('sheetSelect');
            select.innerHTML = '';
            // 초기값 추가
            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.textContent = 'Select Sheet';
            defaultOpt.disabled = true;
            defaultOpt.selected = true;
            select.appendChild(defaultOpt);
            data.sheet_names.forEach(name => {
                const opt = document.createElement('option');
                opt.value = name;
                opt.textContent = name;
                select.appendChild(opt);
            });
            // Selected Sheet 라벨도 초기화
            const label = document.getElementById('selectedSheetLabel');
            if (label) label.textContent = '';
        }
    } catch (e) {
        console.error('시트 목록 불러오기 실패:', e);
    }
}

// 시트 데이터를 폼에 반영하는 함수
function applySheetDataToForm(sheetData) {
    // JSON 기반 데이터 로딩
    if (Array.isArray(sheetData) && sheetData.length > 0 && typeof sheetData[0][0] === 'string' && sheetData[0][0].trim().startsWith('{')) {
        let data;
        try {
            data = JSON.parse(sheetData[0][0]);
        } catch (e) {
            showMessage('Failed to parse sheet data.', 'error');
            return;
        }
        resetForm();
        // 날짜 라벨 표시
        const label = document.getElementById('selectedSheetLabel');
        if (data.date && label) {
            label.textContent = `Selected Sheet: ${data.date}`;
        } else if (label) {
            label.textContent = '';
        }
        // 카테고리별 동적 항목만 채우기
        const sectionMap = {
            'income': 'INCOME',
            'housing': 'HOUSING',
            'credit': 'CREDIT & INSTALLMENT PAYMENTS',
            'loans': 'PERSONAL LOANS',
            'vehicle': 'VEHICLE EXPENSES',
            'studentloan': 'STUDENT LOAN',
            'utilities': 'UTILITIES & TELECOM',
            'insurance': 'INSURANCE',
            'subscriptions': 'SUBSCRIPTIONS',
        };
        Object.keys(sectionMap).forEach(sectionKey => {
            const section = document.querySelector(`.form-section[data-section="${sectionKey}"]`);
            if (!section) return;
            // 기존 항목 모두 삭제 (첫 번째만 남김)
            section.querySelectorAll('.form-group.currency-input-group').forEach((el, idx) => {
                if (idx > 0) el.remove();
            });
            // 동적 항목 채우기
            let i = 0;
            while (true) {
                const itemKey = `item_${sectionKey}_${i}`;
                const amountKey = `${sectionKey}_${i}`;
                if (data[itemKey] !== undefined && data[amountKey] !== undefined) {
                    if (i === 0) {
                        section.querySelector('.item-title').value = data[itemKey];
                        section.querySelector('.currency-input').value = data[amountKey];
                    } else {
                        addItem(section.querySelector('.add-item-btn'));
                        const groups = section.querySelectorAll('.form-group.currency-input-group');
                        const lastGroup = groups[groups.length - 1];
                        lastGroup.querySelector('.item-title').value = data[itemKey];
                        lastGroup.querySelector('.currency-input').value = data[amountKey];
                    }
                    i++;
                } else {
                    break;
                }
            }
        });
        document.querySelectorAll('.form-section').forEach(section => {
            updateSubTotal(section);
        });
        return;
    }
    // (이전 표 파싱 로직은 제거)
}

// 시트 데이터 불러오기 및 콘솔 출력 (폼 반영은 후처리)
async function loadSelectedSheetData() {
    const select = document.getElementById('sheetSelect');
    const sheetName = select.value;
    if (!sheetName) return;
    try {
        const res = await fetch(`/api/get-sheet-data?sheet=${encodeURIComponent(sheetName)}`);
        const data = await res.json();
        if (data.success) {
            console.log('시트 데이터:', data.data); // 디버깅용
            applySheetDataToForm(data.data);
            showMessage('Sheet data loaded!', 'success');
            // Load 후 드롭다운을 다시 초기화
            select.selectedIndex = 0;
        } else {
            showMessage('Failed to load sheet data: ' + (data.error || ''), 'error');
        }
    } catch (e) {
        showMessage('Error loading sheet data', 'error');
        console.error(e);
    }
}

// 페이지 로드 시 초기화
document.addEventListener('DOMContentLoaded', function() {
    // 인증 확인
    if (!checkAuthentication()) {
        return;
    }
    
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
    loadSheetNames();
    document.getElementById('loadSheetBtn').addEventListener('click', loadSelectedSheetData);
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

// Helper to (re)bind input events and update subtotal for a section
function bindAndUpdateSection(section) {
    section.querySelectorAll('.currency-input').forEach(input => {
        if (!input._subTotalHandler) {
            input._subTotalHandler = function() { updateSubTotal(this); };
            input.addEventListener('input', input._subTotalHandler);
        }
    });
    updateSubTotal(section);
}

// Add item logic for dynamic item addition
function addItem(btn) {
    const section = btn.closest('.form-section');
    const sectionName = section.getAttribute('data-section');
    // 기존 입력값을 모두 보존 (아무것도 건드리지 않음)
    const formGroups = section.querySelectorAll('.form-group.currency-input-group');
    const itemCount = formGroups.length;
    const itemName = `item_${sectionName}_${itemCount}`;
    const amountName = `${sectionName}_${itemCount}`;
    const formGroup = document.createElement('div');
    formGroup.className = 'form-group currency-input-group fade-in-item';
    formGroup.innerHTML = `
        <input type="text" name="${itemName}" placeholder="New Item" class="item-title">
        <div class="currency-input-wrapper">
            <span class="currency-symbol">$</span>
            <input type="number" name="${amountName}" step="0.01" placeholder="Amount" class="currency-input">
        </div>
        <button type="button" class="delete-item-btn" aria-label="Delete item" onclick="deleteItem(this)">
            <span class="delete-icon">&#10005;</span>
            <span class="delete-tooltip">Delete item</span>
        </button>
    `;
    // Insert before the sub-total row (which is always before the add button)
    const subTotalRow = section.querySelector('.sub-total-row');
    section.insertBefore(formGroup, subTotalRow);
    setTimeout(() => {
        formGroup.classList.add('show');
    }, 10);
    // Bind input event only for the new input
    const newInput = formGroup.querySelector('.currency-input');
    if (newInput) {
        newInput._subTotalHandler = function() { updateSubTotal(this); };
        newInput.addEventListener('input', newInput._subTotalHandler);
    }
    updateSubTotal(section);
}

function deleteItem(btn) {
    const section = btn.closest('.form-section');
    const formGroup = btn.closest('.form-group');
    formGroup.remove();
    updateSubTotal(section);
}

function updateSummarySentence() {
    // Get income from the summary-income cell (subtotal)
    const incomeText = document.getElementById('summary-income')?.textContent || '$ 0.00';
    const income = parseFloat(incomeText.replace(/[^\d.\-]/g, '')) || 0;
    // Sum all expense categories
    const expenseIds = [
        'summary-housing',
        'summary-credit',
        'summary-loans',
        'summary-vehicle',
        'summary-studentloan',
        'summary-utilities',
        'summary-insurance',
        'summary-subscriptions'
    ];
    let totalExpenses = 0;
    expenseIds.forEach(id => {
        const val = document.getElementById(id)?.textContent || '$ 0.00';
        totalExpenses += parseFloat(val.replace(/[^\d.\-]/g, '')) || 0;
    });
    // Update total income and expense rows
    const totalIncomeEl = document.getElementById('summary-total-income');
    if (totalIncomeEl) {
        totalIncomeEl.textContent = `$ ${income.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    const totalExpenseEl = document.getElementById('summary-total-expense');
    if (totalExpenseEl) {
        totalExpenseEl.textContent = `$ ${totalExpenses.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    // Update difference and message
    const diff = income - totalExpenses;
    const diffEl = document.getElementById('summary-diff');
    if (diffEl) {
        diffEl.textContent = `$ ${Math.abs(diff).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    const diffMsgEl = document.getElementById('summary-diff-msg');
    if (diffMsgEl) {
        if (diff > 0) {
            diffMsgEl.textContent = `You have $${diff.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} left.`;
            diffMsgEl.style.color = '#007bff';
        } else if (diff < 0) {
            diffMsgEl.textContent = `You are short $${Math.abs(diff).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}.`;
            diffMsgEl.style.color = '#dc3545';
        } else {
            diffMsgEl.textContent = '';
            diffMsgEl.style.color = '';
        }
    }
    let sentence = '';
    if (income === 0 && totalExpenses === 0) {
        sentence = '';
    } else if (diff > 0) {
        sentence = `You are saving $${diff.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} per month.`;
    } else if (diff < 0) {
        sentence = `Your expenses exceed your income by $${Math.abs(diff).toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})} per month.`;
    } else {
        sentence = 'Your income and expenses are balanced.';
    }
    const el = document.getElementById('summary-sentence');
    if (el) el.textContent = sentence;
}

function updateSubTotal(inputOrSection) {
    let section;
    if (inputOrSection.classList.contains('form-section')) {
        section = inputOrSection;
    } else {
        section = inputOrSection.closest('.form-section');
    }
    const amountInputs = section.querySelectorAll('.currency-input');
    let sum = 0;
    amountInputs.forEach(input => {
        const val = parseFloat(input.value);
        if (!isNaN(val)) sum += val;
    });
    const subTotalValue = section.querySelector('.sub-total-value');
    if (subTotalValue) {
        subTotalValue.textContent = `$ ${sum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    // Update summary table if present
    const sectionName = section.getAttribute('data-section');
    const summaryCell = document.getElementById(`summary-${sectionName}`);
    if (summaryCell) {
        summaryCell.textContent = `$ ${sum.toLocaleString(undefined, {minimumFractionDigits: 2, maximumFractionDigits: 2})}`;
    }
    updateSummarySentence();
}

document.addEventListener('DOMContentLoaded', function() {
    document.querySelectorAll('.form-section').forEach(section => {
        bindAndUpdateSection(section);
    });
});

// Bar chart rendering for category subtotals (was pie chart)
let summaryBarChart = null;
function updateSummaryBarChart() {
    const ctx = document.getElementById('summary-pie');
    if (!ctx) return;
    const categories = [
        { id: 'summary-housing', label: 'HOUSING' },
        { id: 'summary-credit', label: 'CREDIT & INSTALLMENT PAYMENTS' },
        { id: 'summary-loans', label: 'PERSONAL LOANS' },
        { id: 'summary-vehicle', label: 'VEHICLE EXPENSES' },
        { id: 'summary-studentloan', label: 'STUDENT LOAN' },
        { id: 'summary-utilities', label: 'UTILITIES & TELECOM' },
        { id: 'summary-insurance', label: 'INSURANCE' },
        { id: 'summary-subscriptions', label: 'SUBSCRIPTIONS' }
    ];
    // Get values and sort descending
    let data = categories.map(cat => {
        const valText = document.getElementById(cat.id)?.textContent || '$ 0.00';
        const val = parseFloat(valText.replace(/[^\d.\-]/g, '')) || 0;
        return { label: cat.label, value: val };
    });
    data = data.filter(d => d.value > 0);
    data.sort((a, b) => b.value - a.value);
    const labels = data.map(d => d.label);
    const values = data.map(d => d.value);
    const colors = [
        '#3b6eea', '#5f8fff', '#764ba2', '#4fd1c5', '#f6ad55', '#fc8181', '#90cdf4', '#a0aec0'
    ];
    if (summaryBarChart) summaryBarChart.destroy();
    summaryBarChart = new window.Chart(ctx, {
        type: 'bar',
        data: {
            labels: labels,
            datasets: [{
                data: values,
                backgroundColor: colors.slice(0, values.length),
                borderWidth: 1.5,
                borderColor: '#fff',
                borderRadius: 8,
                maxBarThickness: 38
            }]
        },
        options: {
            indexAxis: 'y',
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const value = context.parsed.x || 0;
                            return `$${value.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
                        }
                    }
                },
                datalabels: {
                    color: '#222',
                    font: { weight: 'bold', size: 14 },
                    anchor: 'end',
                    align: 'end',
                    formatter: function(value) {
                        return `$${value.toLocaleString(undefined, {minimumFractionDigits:2, maximumFractionDigits:2})}`;
                    }
                }
            },
            scales: {
                x: {
                    beginAtZero: true,
                    ticks: { color: '#222', font: { size: 13 } },
                    grid: { color: '#e1e5e9' }
                },
                y: {
                    ticks: { color: '#222', font: { size: 14, weight: 'bold' } },
                    grid: { display: false }
                }
            }
        },
        plugins: window.ChartDataLabels ? [window.ChartDataLabels] : []
    });
}

// Update bar chart whenever subtotals change
const _originalUpdateSummarySentence = updateSummarySentence;
updateSummarySentence = function() {
    _originalUpdateSummarySentence();
    updateSummaryBarChart();
};

// Accordion expand/collapse logic
function toggleAccordion(header) {
    const item = header.parentElement;
    const content = item.querySelector('.accordion-content');
    const chevron = header.querySelector('.accordion-chevron');
    const isOpen = content.style.display === 'block';

    if (isOpen) {
        content.style.display = 'none';
        chevron.style.transform = 'rotate(0deg)';
    } else {
        content.style.display = 'block';
        chevron.style.transform = 'rotate(180deg)';
    }
} 

// Expand All Accordions
function expandAllAccordions() {
    document.querySelectorAll('.accordion-content').forEach(content => {
        content.style.display = 'block';
    });
    document.querySelectorAll('.accordion-chevron').forEach(chevron => {
        chevron.style.transform = 'rotate(180deg)';
    });
}

// Collapse All Accordions
function collapseAllAccordions() {
    document.querySelectorAll('.accordion-content').forEach(content => {
        content.style.display = 'none';
    });
    document.querySelectorAll('.accordion-chevron').forEach(chevron => {
        chevron.style.transform = 'rotate(0deg)';
    });
} 