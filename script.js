import { supabase } from './supabase-config.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
    setupEventListeners();
});

async function checkAuthState() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        await updateNavForAuth();
    } else {
        updateNavForGuest();
    }
}

async function updateNavForAuth() {
    const navAuth = document.getElementById('nav-auth');
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('username, is_admin')
        .eq('id', currentUser.id)
        .single();

    navAuth.innerHTML = `
        <div class="user-menu">
            <span class="nav-link">Welcome, ${profile?.username || 'User'}</span>
            <div class="user-dropdown" id="user-dropdown">
                <a href="#" id="profile-link">Profile</a>
                ${profile?.is_admin ? '<a href="admin.html">Admin Panel</a>' : ''}
                <a href="#" id="logout-link">Logout</a>
            </div>
        </div>
    `;

    document.querySelector('.user-menu').addEventListener('click', function(e) {
        document.getElementById('user-dropdown').classList.toggle('show');
    });
}

function updateNavForGuest() {
    const navAuth = document.getElementById('nav-auth');
    navAuth.innerHTML = '<a href="auth.html?mode=login" class="nav-link" id="auth-link">Sign In</a>';
}

function setupEventListeners() {
    document.getElementById('view-reviews-btn')?.addEventListener('click', function() {
        window.location.href = 'reviews.html';
    });

    document.getElementById('reviews-link')?.addEventListener('click', function(e) {
        e.preventDefault();
        window.location.href = 'reviews.html';
    });
}

// Close dropdown when clicking outside
document.addEventListener('click', function(e) {
    const dropdown = document.getElementById('user-dropdown');
    if (dropdown && !e.target.closest('.user-menu')) {
        dropdown.classList.remove('show');
    }
});
