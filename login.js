// Login Page JavaScript

document.addEventListener('DOMContentLoaded', function() {
    // Initialize the login page
    initializeLoginPage();

    // "비밀번호를 잊으셨나요?" 안내 메시지
    const forgotLink = document.querySelector('.forgot-password');
    if (forgotLink) {
        forgotLink.addEventListener('click', function(e) {
            e.preventDefault();
            showMessage('비밀번호 재설정 기능은 준비 중입니다.\n데모 계정은 비밀번호 없이 로그인 가능합니다.', 'info');
        });
    }
});

function initializeLoginPage() {
    // Add event listeners
    const loginForm = document.getElementById('loginForm');
    const signupForm = document.getElementById('signupForm');
    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    
    if (signupForm) {
        signupForm.addEventListener('submit', handleSignup);
    }
    
    // Add input validation listeners
    addInputValidation();
    
    // Check for saved credentials
    checkSavedCredentials();
}

// Password visibility toggle
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const eyeIcon = document.querySelector('.eye-icon');
    
    if (passwordInput.type === 'password') {
        passwordInput.type = 'text';
        eyeIcon.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        eyeIcon.textContent = '👁️';
    }
}

// Show signup modal
function showSignup() {
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Focus on first input
        setTimeout(() => {
            const firstInput = modal.querySelector('input');
            if (firstInput) firstInput.focus();
        }, 100);
    }
}

// Close signup modal
function closeSignup() {
    const modal = document.getElementById('signupModal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
        
        // Reset form
        const form = document.getElementById('signupForm');
        if (form) form.reset();
        
        // Clear error states
        clearFormErrors();
    }
}

// Handle login form submission
async function handleLogin(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const email = formData.get('email');
    const password = formData.get('password');
    const remember = formData.get('remember');
    
    // Validate inputs
    if (!validateLoginForm(email, password)) {
        return;
    }
    
    // Show loading state
    const loginBtn = form.querySelector('.login-btn');
    setLoadingState(loginBtn, true);
    
    try {
        // Simulate API call (replace with actual API endpoint)
        const response = await simulateLoginAPI(email, password);
        
        if (response.success) {
            // Set authentication status
            localStorage.setItem('isAuthenticated', 'true');
            localStorage.setItem('userEmail', email);
            
            // Save credentials if remember is checked
            if (remember) {
                saveCredentials(email, password);
            }
            
            // Show success message
            showMessage('로그인 성공! 메인 페이지로 이동합니다...', 'success');
            
            // Redirect to main page after delay
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1500);
        } else {
            showMessage(response.message || '로그인에 실패했습니다.', 'error');
        }
    } catch (error) {
        showMessage('로그인 중 오류가 발생했습니다.', 'error');
        console.error('Login error:', error);
    } finally {
        setLoadingState(loginBtn, false);
    }
}

// Handle signup form submission
async function handleSignup(event) {
    event.preventDefault();
    
    const form = event.target;
    const formData = new FormData(form);
    const name = formData.get('name');
    const email = formData.get('email');
    const password = formData.get('password');
    const confirmPassword = formData.get('confirmPassword');
    const agreeTerms = formData.get('agreeTerms');
    
    // Validate inputs
    if (!validateSignupForm(name, email, password, confirmPassword, agreeTerms)) {
        return;
    }
    
    // Show loading state
    const submitBtn = form.querySelector('.btn-primary');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = '가입 중...';
    submitBtn.disabled = true;
    
    try {
        // Simulate API call (replace with actual API endpoint)
        const response = await simulateSignupAPI(name, email, password);
        
        if (response.success) {
            showMessage('회원가입이 완료되었습니다! 로그인해주세요.', 'success');
            closeSignup();
            
            // Auto-fill login form
            document.getElementById('email').value = email;
        } else {
            showMessage(response.message || '회원가입에 실패했습니다.', 'error');
        }
    } catch (error) {
        showMessage('회원가입 중 오류가 발생했습니다.', 'error');
        console.error('Signup error:', error);
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Form validation functions
function validateLoginForm(email, password) {
    clearFormErrors();
    let isValid = true;
    
    if (!email || !isValidEmail(email)) {
        showFieldError('email', '유효한 이메일 주소를 입력해주세요.');
        isValid = false;
    }
    
    if (!password || password.length < 6) {
        showFieldError('password', '비밀번호는 최소 6자 이상이어야 합니다.');
        isValid = false;
    }
    
    return isValid;
}

function validateSignupForm(name, email, password, confirmPassword, agreeTerms) {
    clearFormErrors();
    let isValid = true;
    
    if (!name || name.trim().length < 2) {
        showFieldError('signupName', '이름은 최소 2자 이상이어야 합니다.');
        isValid = false;
    }
    
    if (!email || !isValidEmail(email)) {
        showFieldError('signupEmail', '유효한 이메일 주소를 입력해주세요.');
        isValid = false;
    }
    
    if (!password || password.length < 8) {
        showFieldError('signupPassword', '비밀번호는 최소 8자 이상이어야 합니다.');
        isValid = false;
    }
    
    if (password !== confirmPassword) {
        showFieldError('signupConfirmPassword', '비밀번호가 일치하지 않습니다.');
        isValid = false;
    }
    
    if (!agreeTerms) {
        showFieldError('agreeTerms', '이용약관에 동의해주세요.');
        isValid = false;
    }
    
    return isValid;
}

// Email validation
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Show field error
function showFieldError(fieldId, message) {
    const field = document.getElementById(fieldId);
    if (field) {
        const formGroup = field.closest('.form-group');
        formGroup.classList.add('error');
        
        // Remove existing error message
        const existingError = formGroup.querySelector('.error-message');
        if (existingError) {
            existingError.remove();
        }
        
        // Add new error message
        const errorDiv = document.createElement('div');
        errorDiv.className = 'error-message';
        errorDiv.textContent = message;
        formGroup.appendChild(errorDiv);
    }
}

// Clear all form errors
function clearFormErrors() {
    const errorGroups = document.querySelectorAll('.form-group.error');
    errorGroups.forEach(group => {
        group.classList.remove('error');
        const errorMessage = group.querySelector('.error-message');
        if (errorMessage) {
            errorMessage.remove();
        }
    });
}

// Add input validation listeners
function addInputValidation() {
    const inputs = document.querySelectorAll('input[type="email"], input[type="password"], input[type="text"]');
    
    inputs.forEach(input => {
        input.addEventListener('blur', function() {
            validateField(this);
        });
        
        input.addEventListener('input', function() {
            // Clear error when user starts typing
            const formGroup = this.closest('.form-group');
            if (formGroup && formGroup.classList.contains('error')) {
                formGroup.classList.remove('error');
                const errorMessage = formGroup.querySelector('.error-message');
                if (errorMessage) {
                    errorMessage.remove();
                }
            }
        });
    });
}

// Validate individual field
function validateField(field) {
    const value = field.value.trim();
    const type = field.type;
    const id = field.id;
    
    if (type === 'email' && value && !isValidEmail(value)) {
        showFieldError(id, '유효한 이메일 주소를 입력해주세요.');
    } else if (type === 'password' && value && value.length < 6) {
        showFieldError(id, '비밀번호는 최소 6자 이상이어야 합니다.');
    } else if (id === 'signupConfirmPassword' && value) {
        const password = document.getElementById('signupPassword').value;
        if (value !== password) {
            showFieldError(id, '비밀번호가 일치하지 않습니다.');
        }
    }
}

// Set loading state
function setLoadingState(button, isLoading) {
    const btnText = button.querySelector('.btn-text');
    const btnSpinner = button.querySelector('.btn-spinner');
    
    if (isLoading) {
        button.classList.add('loading');
        button.disabled = true;
    } else {
        button.classList.remove('loading');
        button.disabled = false;
    }
}

// Show message
function showMessage(message, type = 'info') {
    const messageDiv = document.getElementById('message');
    if (messageDiv) {
        messageDiv.textContent = message;
        messageDiv.className = `message ${type}`;
        messageDiv.style.display = 'block';
        
        // Auto-hide after 5 seconds
        setTimeout(() => {
            messageDiv.style.display = 'none';
        }, 5000);
    }
}

// Save credentials to localStorage
function saveCredentials(email, password) {
    try {
        localStorage.setItem('savedEmail', email);
        // In a real app, you might want to encrypt this or use a more secure method
        localStorage.setItem('savedPassword', password);
    } catch (error) {
        console.error('Failed to save credentials:', error);
    }
}

// Check for saved credentials
function checkSavedCredentials() {
    try {
        const savedEmail = localStorage.getItem('savedEmail');
        const savedPassword = localStorage.getItem('savedPassword');
        
        if (savedEmail && savedPassword) {
            const emailInput = document.getElementById('email');
            const passwordInput = document.getElementById('password');
            const rememberCheckbox = document.getElementById('remember');
            
            if (emailInput) emailInput.value = savedEmail;
            if (passwordInput) passwordInput.value = savedPassword;
            if (rememberCheckbox) rememberCheckbox.checked = true;
        }
    } catch (error) {
        console.error('Failed to load saved credentials:', error);
    }
}

// Simulate API calls (replace with actual API endpoints)
async function simulateLoginAPI(email, password) {
    // demo 계정은 비밀번호 없이도 로그인 허용
    if (email === 'demo@example.com' && password === 'Password234') {
        return {
            success: true,
            message: '로그인 성공',
            user: {
                id: 1,
                name: 'Demo User',
                email: email
            }
        };
    } else {
        return {
            success: false,
            message: '이메일 또는 비밀번호가 올바르지 않습니다.'
        };
    }
}

async function simulateSignupAPI(name, email, password) {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Mock validation (replace with actual API call)
    if (email && password && name) {
        return {
            success: true,
            message: '회원가입이 완료되었습니다.',
            user: {
                id: Math.floor(Math.random() * 1000),
                name: name,
                email: email
            }
        };
    } else {
        return {
            success: false,
            message: '회원가입에 실패했습니다.'
        };
    }
}

// Social login handlers
function handleGoogleLogin() {
    showMessage('Google 로그인 기능은 준비 중입니다.', 'info');
}

function handleAppleLogin() {
    showMessage('Apple 로그인 기능은 준비 중입니다.', 'info');
}

// Add social login event listeners
document.addEventListener('DOMContentLoaded', function() {
    const googleBtn = document.querySelector('.google-btn');
    const appleBtn = document.querySelector('.apple-btn');
    
    if (googleBtn) {
        googleBtn.addEventListener('click', handleGoogleLogin);
    }
    
    if (appleBtn) {
        appleBtn.addEventListener('click', handleAppleLogin);
    }
});

// Close modal when clicking outside
document.addEventListener('click', function(event) {
    const modal = document.getElementById('signupModal');
    if (event.target === modal) {
        closeSignup();
    }
});

// Close modal with Escape key
document.addEventListener('keydown', function(event) {
    if (event.key === 'Escape') {
        closeSignup();
    }
}); 