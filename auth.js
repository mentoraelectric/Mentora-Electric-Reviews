// auth.js
import { supabase } from './supabase-config.js';

document.addEventListener('DOMContentLoaded', function() {
    const urlParams = new URLSearchParams(window.location.search);
    const mode = urlParams.get('mode');

    if (mode === 'signup') {
        showSignup();
    } else {
        showLogin();
    }

    setupAuthListeners();
});

function setupAuthListeners() {
    // Form toggles
    document.getElementById('show-signup')?.addEventListener('click', showSignup);
    document.getElementById('show-login')?.addEventListener('click', showLogin);
    document.getElementById('show-forgot')?.addEventListener('click', showForgot);
    document.getElementById('show-login-from-forgot')?.addEventListener('click', showLogin);

    // Form submissions
    document.getElementById('loginForm')?.addEventListener('submit', handleLogin);
    document.getElementById('signupForm')?.addEventListener('submit', handleSignup);
    document.getElementById('forgotForm')?.addEventListener('submit', handleForgotPassword);
}

function showLogin() {
    document.getElementById('login-form').style.display = 'block';
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('forgot-form').style.display = 'none';
}

function showSignup() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'block';
    document.getElementById('forgot-form').style.display = 'none';
}

function showForgot() {
    document.getElementById('login-form').style.display = 'none';
    document.getElementById('signup-form').style.display = 'none';
    document.getElementById('forgot-form').style.display = 'block';
}

async function handleLogin(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password
    });

    if (error) {
        alert('Error signing in: ' + error.message);
    } else {
        window.location.href = 'reviews.html';
    }
}

async function handleSignup(e) {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    const username = document.getElementById('signup-username').value;

    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username: username
            }
        }
    });

    if (error) {
        alert('Error signing up: ' + error.message);
    } else if (data.user) {
        // Profile will be automatically created by the trigger
        alert('Signup successful! You can now sign in.');
        showLogin();
    }
}

async function handleForgotPassword(e) {
    e.preventDefault();
    const email = document.getElementById('reset-email').value;

    const { error } = await supabase.auth.resetPasswordForEmail(email);

    if (error) {
        alert('Error: ' + error.message);
    } else {
        alert('Password reset link sent to your email!');
        showLogin();
    }
}
