// profile.js
import { supabase } from './supabase-config.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
    setupEventListeners();
});

async function checkAuthState() {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
        window.location.href = 'auth.html?mode=login';
        return;
    }

    currentUser = session.user;
    updateNavForAuth();
    loadProfile();
}

function updateNavForAuth() {
    const navAuth = document.getElementById('nav-auth');
    navAuth.innerHTML = `
        <div class="user-menu">
            <span class="nav-link">Profile</span>
            <div class="user-dropdown" id="user-dropdown">
                <a href="reviews.html">Back to Reviews</a>
                <a href="#" id="logout-link">Logout</a>
            </div>
        </div>
    `;

    document.getElementById('logout-link').addEventListener('click', handleLogout);
    document.querySelector('.user-menu').addEventListener('click', function(e) {
        document.getElementById('user-dropdown').classList.toggle('show');
    });
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.href = 'reviews.html';
}

function setupEventListeners() {
    document.getElementById('profile-form').addEventListener('submit', handleProfileUpdate);
    document.getElementById('avatar-upload').addEventListener('change', handleAvatarUpload);
}

async function loadProfile() {
    try {
        const { data: profile, error } = await supabase
            .from('user_profiles')
            .select('*')
            .eq('id', currentUser.id)
            .single();

        if (error) throw error;

        document.getElementById('username').value = profile.username || '';
        document.getElementById('email').value = currentUser.email;
        
        if (profile.avatar_url) {
            document.getElementById('profile-avatar').src = profile.avatar_url;
        } else {
            document.getElementById('profile-avatar').src = 'https://via.placeholder.com/100?text=USER';
        }
        
        document.getElementById('profile-username').textContent = profile.username || 'User';
    } catch (error) {
        console.error('Error loading profile:', error);
        alert('Error loading profile: ' + error.message);
    }
}

async function handleAvatarUpload(event) {
    const file = event.target.files[0];
    if (!file) return;

    // Validate file size (2MB max)
    if (file.size > 2 * 1024 * 1024) {
        alert('File size must be less than 2MB');
        return;
    }

    // Validate file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif'];
    if (!validTypes.includes(file.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF)');
        return;
    }

    try {
        const fileExt = file.name.split('.').pop();
        const fileName = `${currentUser.id}/avatar.${fileExt}`;
        const filePath = `avatars/${fileName}`;

        // Upload avatar
        const { error: uploadError } = await supabase.storage
            .from('avatars')
            .upload(filePath, file, { upsert: true });

        if (uploadError) throw uploadError;

        // Get public URL
        const { data: { publicUrl } } = supabase.storage
            .from('avatars')
            .getPublicUrl(filePath);

        // Update profile with avatar URL
        const { error: updateError } = await supabase
            .from('user_profiles')
            .update({ avatar_url: publicUrl })
            .eq('id', currentUser.id);

        if (updateError) throw updateError;

        // Update avatar display
        document.getElementById('profile-avatar').src = publicUrl;
        alert('Avatar updated successfully!');
    } catch (error) {
        console.error('Error uploading avatar:', error);
        alert('Error uploading avatar: ' + error.message);
    }
}

async function handleProfileUpdate(e) {
    e.preventDefault();
    
    const username = document.getElementById('username').value.trim();
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    if (!username) {
        alert('Please enter a username');
        return;
    }

    try {
        // Update username
        const { error: profileError } = await supabase
            .from('user_profiles')
            .update({ username })
            .eq('id', currentUser.id);

        if (profileError) throw profileError;

        // Update password if provided
        if (newPassword) {
            if (newPassword !== confirmPassword) {
                alert('New passwords do not match');
                return;
            }

            if (!currentPassword) {
                alert('Please enter your current password to change password');
                return;
            }

            const { error: passwordError } = await supabase.auth.updateUser({
                password: newPassword
            });

            if (passwordError) throw passwordError;
            
            // Clear password fields
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
        }

        alert('Profile updated successfully!');
        document.getElementById('profile-username').textContent = username;
    } catch (error) {
        console.error('Error updating profile:', error);
        alert('Error updating profile: ' + error.message);
    }
}
