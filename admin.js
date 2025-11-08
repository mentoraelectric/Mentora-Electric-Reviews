import { supabase } from './supabase-config.js';

let currentUser = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthAndAdmin();
});

async function checkAuthAndAdmin() {
    const { data: { session } } = await supabase.auth.getSession();
    
    if (!session) {
        window.location.href = 'auth.html?mode=login';
        return;
    }

    currentUser = session.user;
    
    // Check if user is admin
    const { data: profile } = await supabase
        .from('user_profiles')
        .select('is_admin')
        .eq('id', currentUser.id)
        .single();

    if (!profile?.is_admin) {
        alert('Access denied. Admin privileges required.');
        window.location.href = 'reviews.html';
        return;
    }

    updateNavForAuth();
    loadAdminData();
    loadReviews();
}

function updateNavForAuth() {
    const navAuth = document.getElementById('nav-auth');
    navAuth.innerHTML = `
        <div class="user-menu">
            <span class="nav-link">Admin</span>
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

async function loadAdminData() {
    // Get stats
    const { count: reviewsCount } = await supabase
        .from('reviews')
        .select('*', { count: 'exact', head: true });

    const { count: usersCount } = await supabase
        .from('user_profiles')
        .select('*', { count: 'exact', head: true });

    const { count: repliesCount } = await supabase
        .from('review_replies')
        .select('*', { count: 'exact', head: true });

    document.getElementById('admin-stats').innerHTML = `
        <div class="features">
            <div class="feature-card">
                <h3>Total Reviews</h3>
                <p>${reviewsCount}</p>
            </div>
            <div class="feature-card">
                <h3>Total Users</h3>
                <p>${usersCount}</p>
            </div>
            <div class="feature-card">
                <h3>Total Replies</h3>
                <p>${repliesCount}</p>
            </div>
        </div>
    `;
}

async function loadReviews() {
    const { data: reviews, error } = await supabase
        .from('reviews')
        .select(`
            *,
            user_profiles(username),
            review_replies(
                *,
                user_profiles(username)
            )
        `)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error loading reviews:', error);
        return;
    }

    displayReviews(reviews);
}

function displayReviews(reviews) {
    const container = document.getElementById('reviews-list');
    container.innerHTML = '<h2>All Reviews</h2>';

    reviews.forEach(review => {
        const reviewElement = createReviewElement(review);
        container.appendChild(reviewElement);
    });
}

function createReviewElement(review) {
    const div = document.createElement('div');
    div.className = 'review-card';
    
    const timeAgo = getTimeAgo(review.created_at);

    div.innerHTML = `
        <div class="review-header">
            <span class="review-user">${review.user_profiles.username}</span>
            <span class="review-time">${timeAgo}</span>
        </div>
        <div class="review-content">${review.content}</div>
        <div class="review-actions">
            <button class="reaction-btn" onclick="adminReply('${review.id}')">
                💬 Admin Reply
            </button>
            <button class="reaction-btn" onclick="deleteReviewAsAdmin('${review.id}')" style="color: red;">
                🗑️ Delete Review
            </button>
        </div>
        <div class="reply-section">
            ${review.review_replies.map(reply => `
                <div class="reply">
                    <div class="review-header">
                        <span class="review-user">${reply.user_profiles.username} ${reply.user_profiles.username === 'admin' ? '(Admin)' : ''}</span>
                        <span class="review-time">${getTimeAgo(reply.created_at)}</span>
                        ${reply.user_profiles.username !== 'admin' ? `
                            <button onclick="deleteReplyAsAdmin('${reply.id}')" style="color: red; border: none; background: none; cursor: pointer;">
                                🗑️
                            </button>
                        ` : ''}
                    </div>
                    <div class="review-content">${reply.content}</div>
                </div>
            `).join('')}
        </div>
    `;

    return div;
}

function getTimeAgo(dateString) {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
}

// Global functions for admin actions
window.adminReply = async function(reviewId) {
    const content = prompt('Enter your admin reply:');
    if (!content) return;

    await supabase
        .from('review_replies')
        .insert([
            { 
                review_id: reviewId, 
                user_id: currentUser.id,
                content 
            }
        ]);

    loadReviews();
};

window.deleteReviewAsAdmin = async function(reviewId) {
    if (!confirm('Are you sure you want to delete this review as admin?')) return;

    await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

    loadReviews();
};

window.deleteReplyAsAdmin = async function(replyId) {
    if (!confirm('Are you sure you want to delete this reply?')) return;

    await supabase
        .from('review_replies')
        .delete()
        .eq('id', replyId);

    loadReviews();
};
