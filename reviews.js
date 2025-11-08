import { supabase } from './supabase-config.js';

let currentUser = null;
let editingReviewId = null;

document.addEventListener('DOMContentLoaded', function() {
    checkAuthState();
    loadReviews();
    setupEventListeners();
});

async function checkAuthState() {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
        currentUser = session.user;
        updateUIForAuth();
    }
}

function updateUIForAuth() {
    document.getElementById('add-review-btn').style.display = 'block';
    updateNavForAuth();
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
            <span class="nav-link">${profile?.username || 'User'}</span>
            <div class="user-dropdown" id="user-dropdown">
                <a href="#" id="profile-link">Profile</a>
                ${profile?.is_admin ? '<a href="admin.html">Admin Panel</a>' : ''}
                <a href="#" id="logout-link">Logout</a>
            </div>
        </div>
    `;

    setupAuthListeners();
}

function setupAuthListeners() {
    document.getElementById('logout-link')?.addEventListener('click', handleLogout);
    document.querySelector('.user-menu')?.addEventListener('click', function(e) {
        document.getElementById('user-dropdown').classList.toggle('show');
    });
}

async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
}

function setupEventListeners() {
    document.getElementById('add-review-btn')?.addEventListener('click', showReviewModal);
    document.getElementById('close-review-modal')?.addEventListener('click', hideReviewModal);
    document.getElementById('review-form')?.addEventListener('submit', handleReviewSubmit);
    
    // Close modal when clicking outside
    document.getElementById('review-modal')?.addEventListener('click', function(e) {
        if (e.target === this) hideReviewModal();
    });
}

function showReviewModal(review = null) {
    if (!currentUser) {
        window.location.href = 'auth.html?mode=login';
        return;
    }

    const modal = document.getElementById('review-modal');
    const title = document.getElementById('review-modal-title');
    const content = document.getElementById('review-content');
    const submitBtn = document.getElementById('review-submit-btn');

    if (review) {
        editingReviewId = review.id;
        title.textContent = 'Edit Review';
        content.value = review.content;
        submitBtn.textContent = 'Update Review';
    } else {
        editingReviewId = null;
        title.textContent = 'Share Your Review';
        content.value = '';
        submitBtn.textContent = 'Post Review';
    }

    modal.style.display = 'block';
}

function hideReviewModal() {
    document.getElementById('review-modal').style.display = 'none';
    editingReviewId = null;
}

async function handleReviewSubmit(e) {
    e.preventDefault();
    const content = document.getElementById('review-content').value;

    if (editingReviewId) {
        await supabase
            .from('reviews')
            .update({ 
                content,
                updated_at: new Date().toISOString()
            })
            .eq('id', editingReviewId);
    } else {
        await supabase
            .from('reviews')
            .insert([
                { 
                    user_id: currentUser.id, 
                    content 
                }
            ]);
    }

    hideReviewModal();
    loadReviews();
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
            ),
            review_reactions(count)
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
    container.innerHTML = '';

    reviews.forEach(review => {
        const reviewElement = createReviewElement(review);
        container.appendChild(reviewElement);
    });
}

function createReviewElement(review) {
    const div = document.createElement('div');
    div.className = 'review-card';
    
    const timeAgo = getTimeAgo(review.created_at);
    const isOwner = currentUser && review.user_id === currentUser.id;

    div.innerHTML = `
        <div class="review-header">
            <span class="review-user">${review.user_profiles.username}</span>
            <span class="review-time">${timeAgo}</span>
        </div>
        <div class="review-content">${review.content}</div>
        <div class="review-actions">
            <button class="reaction-btn" onclick="handleReaction('${review.id}')">
                👍 <span>${review.review_reactions[0]?.count || 0}</span>
            </button>
            <button class="reaction-btn" onclick="showReplySection('${review.id}')">
                💬 Reply
            </button>
            ${isOwner ? `
                <button class="reaction-btn" onclick="editReview(${JSON.stringify(review).replace(/"/g, '&quot;')})">
                    ✏️ Edit
                </button>
                <button class="reaction-btn" onclick="deleteReview('${review.id}')">
                    🗑️ Delete
                </button>
            ` : ''}
        </div>
        <div class="reply-section" id="reply-section-${review.id}">
            ${review.review_replies.map(reply => `
                <div class="reply">
                    <div class="review-header">
                        <span class="review-user">${reply.user_profiles.username}</span>
                        <span class="review-time">${getTimeAgo(reply.created_at)}</span>
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

// Global functions for event handlers
window.handleReaction = async function(reviewId) {
    if (!currentUser) {
        window.location.href = 'auth.html?mode=login';
        return;
    }

    await supabase
        .from('review_reactions')
        .upsert([
            { 
                review_id: reviewId, 
                user_id: currentUser.id,
                reaction_type: 'like'
            }
        ], {
            onConflict: 'review_id,user_id,reaction_type'
        });

    loadReviews();
};

window.showReplySection = function(reviewId) {
    if (!currentUser) {
        window.location.href = 'auth.html?mode=login';
        return;
    }

    const section = document.getElementById(`reply-section-${reviewId}`);
    const existingForm = section.querySelector('.reply-form');
    
    if (existingForm) {
        existingForm.remove();
        return;
    }

    const form = document.createElement('div');
    form.className = 'reply-form';
    form.innerHTML = `
        <textarea placeholder="Write a reply..." rows="2" style="width: 100%; margin-bottom: 10px;"></textarea>
        <button onclick="submitReply('${reviewId}', this.previousElementSibling.value)">Reply</button>
    `;
    section.appendChild(form);
};

window.submitReply = async function(reviewId, content) {
    if (!content.trim()) return;

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

window.editReview = function(review) {
    showReviewModal(review);
};

window.deleteReview = async function(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    await supabase
        .from('reviews')
        .delete()
        .eq('id', reviewId);

    loadReviews();
};
