// reviews.js - FIXED REVIEW POSTING
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
                <a href="profile.html" id="profile-link">Profile</a>
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
    document.getElementById('review-image')?.addEventListener('change', handleImagePreview);

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
    const imageInput = document.getElementById('review-image');
    const imagePreview = document.getElementById('image-preview');
    const removeImageBtn = document.getElementById('remove-image-btn');

    if (review) {
        editingReviewId = review.id;
        title.textContent = 'Edit Review';
        content.value = review.content;
        submitBtn.textContent = 'Update Review';
        
        if (review.image_url) {
            imagePreview.src = review.image_url;
            imagePreview.classList.add('show');
            removeImageBtn.style.display = 'block';
        } else {
            imagePreview.classList.remove('show');
            removeImageBtn.style.display = 'none';
        }
    } else {
        editingReviewId = null;
        title.textContent = 'Share Your Review';
        content.value = '';
        submitBtn.textContent = 'Post Review';
        imageInput.value = '';
        imagePreview.classList.remove('show');
        removeImageBtn.style.display = 'none';
    }

    modal.style.display = 'block';
}

function hideReviewModal() {
    document.getElementById('review-modal').style.display = 'none';
    editingReviewId = null;
}

function handleImagePreview(event) {
    const file = event.target.files[0];
    const preview = document.getElementById('image-preview');
    const removeBtn = document.getElementById('remove-image-btn');

    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
            preview.classList.add('show');
            removeBtn.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

window.removeImage = function() {
    document.getElementById('review-image').value = '';
    document.getElementById('image-preview').classList.remove('show');
    document.getElementById('remove-image-btn').style.display = 'none';
}

async function handleReviewSubmit(e) {
    e.preventDefault();
    const content = document.getElementById('review-content').value.trim();
    const imageFile = document.getElementById('review-image').files[0];

    if (!content) {
        alert('Please enter review content');
        return;
    }

    try {
        // Show loading state
        const submitBtn = document.getElementById('review-submit-btn');
        submitBtn.textContent = 'Posting...';
        submitBtn.disabled = true;

        let imageUrl = null;

        // Upload image if exists
        if (imageFile) {
            const fileExt = imageFile.name.split('.').pop();
            const fileName = `${currentUser.id}/${Date.now()}.${fileExt}`;

            const { error: uploadError } = await supabase.storage
                .from('review-images')
                .upload(fileName, imageFile);

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('review-images')
                .getPublicUrl(fileName);

            imageUrl = publicUrl;
        }

        let result;
        if (editingReviewId) {
            result = await supabase
                .from('reviews')
                .update({
                    content,
                    image_url: imageUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', editingReviewId);
        } else {
            result = await supabase
                .from('reviews')
                .insert([{
                    user_id: currentUser.id,
                    content,
                    image_url: imageUrl
                }]);
        }

        if (result.error) throw result.error;

        // Show success message
        showSuccessMessage(editingReviewId ? 'Review updated successfully!' : 'Review posted successfully!');
        
        hideReviewModal();
        loadReviews();
        
    } catch (error) {
        console.error('Error saving review:', error);
        alert('Error saving review: ' + error.message);
    } finally {
        // Reset button state
        const submitBtn = document.getElementById('review-submit-btn');
        submitBtn.textContent = editingReviewId ? 'Update Review' : 'Post Review';
        submitBtn.disabled = false;
    }
}

function showSuccessMessage(message) {
    // Create success notification
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #4CAF50;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

// Add CSS for animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
`;
document.head.appendChild(style);

async function loadReviews() {
    try {
        const { data: reviews, error } = await supabase
            .from('reviews')
            .select(`
                *,
                user_profiles(username, avatar_url),
                review_replies(
                    *,
                    user_profiles(username, avatar_url)
                ),
                review_reactions(
                    *,
                    user_profiles(username)
                )
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error loading reviews:', error);
            showErrorMessage('Error loading reviews');
            return;
        }

        displayReviews(reviews);
    } catch (error) {
        console.error('Error in loadReviews:', error);
        showErrorMessage('Error loading reviews');
    }
}

function showErrorMessage(message) {
    const notification = document.createElement('div');
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        background: #f44336;
        color: white;
        padding: 15px 20px;
        border-radius: 5px;
        box-shadow: 0 4px 12px rgba(0,0,0,0.15);
        z-index: 10000;
        font-weight: 500;
        animation: slideIn 0.3s ease-out;
    `;
    
    notification.textContent = message;
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-in';
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 300);
    }, 3000);
}

function displayReviews(reviews) {
    const container = document.getElementById('reviews-list');
    container.innerHTML = '';

    if (!reviews || reviews.length === 0) {
        container.innerHTML = `
            <div style="grid-column: 1 / -1; text-align: center; padding: 40px; color: #666;">
                <h3>No reviews yet</h3>
                <p>Be the first to share your experience with Mentora Electric!</p>
                ${currentUser ? '<button class="cta-button" onclick="showReviewModal()" style="margin-top: 15px;">Write First Review</button>' : ''}
            </div>
        `;
        return;
    }

    container.style.display = 'grid';
    container.style.gridTemplateColumns = 'repeat(auto-fill, minmax(350px, 1fr))';
    container.style.gap = '20px';
    container.style.marginTop = '30px';

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
    const avatarUrl = review.user_profiles.avatar_url || `https://via.placeholder.com/40/1e3c72/ffffff?text=${review.user_profiles.username?.charAt(0)?.toUpperCase() || 'U'}`;
    
    const likeCount = review.review_reactions?.length || 0;
    const userLiked = currentUser && review.review_reactions?.some(reaction => reaction.user_id === currentUser.id);

    div.innerHTML = `
        <div class="review-header">
            <div style="display: flex; align-items: center; gap: 10px;">
                <img src="${avatarUrl}" alt="${review.user_profiles.username}" style="width: 32px; height: 32px; border-radius: 50%; object-fit: cover;">
                <span class="review-user">${review.user_profiles.username}</span>
            </div>
            <span class="review-time">${timeAgo}</span>
        </div>
        <div class="review-content">${review.content}</div>
        ${review.image_url ? `
            <div class="review-image-container">
                <img src="${review.image_url}" alt="Review image" class="review-image" onclick="window.open('${review.image_url}', '_blank')">
            </div>
        ` : ''}
        <div class="review-actions">
            <button class="reaction-btn ${userLiked ? 'active' : ''}" onclick="handleReaction('${review.id}')">
                ${userLiked ? '❤️' : '🤍'} <span>${likeCount}</span>
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
            ${review.review_replies && review.review_replies.length > 0 ? review.review_replies.map(reply => {
                const replyAvatarUrl = reply.user_profiles.avatar_url || `https://via.placeholder.com/30/1e3c72/ffffff?text=${reply.user_profiles.username?.charAt(0)?.toUpperCase() || 'U'}`;
                return `
                <div class="reply">
                    <div class="review-header">
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <img src="${replyAvatarUrl}" alt="${reply.user_profiles.username}" style="width: 24px; height: 24px; border-radius: 50%; object-fit: cover;">
                            <span class="review-user">${reply.user_profiles.username}</span>
                        </div>
                        <span class="review-time">${getTimeAgo(reply.created_at)}</span>
                    </div>
                    <div class="review-content">${reply.content}</div>
                </div>
            `}).join('') : ''}
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
    if (days < 7) return `${days}d ago`;
    
    const weeks = Math.floor(days / 7);
    if (weeks < 4) return `${weeks}w ago`;
    
    const months = Math.floor(days / 30);
    return `${months}mo ago`;
}

// FIXED COMMENT FUNCTION
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
        <textarea id="reply-text-${reviewId}" placeholder="Write a reply..." rows="2" style="width: 100%; margin-bottom: 10px; padding: 10px; border: 1px solid #ddd; border-radius: 5px;"></textarea>
        <button type="button" onclick="submitReply('${reviewId}')" style="padding: 8px 16px; background: #1e3c72; color: white; border: none; border-radius: 5px; cursor: pointer;">Post Reply</button>
    `;
    section.appendChild(form);
};

window.submitReply = async function(reviewId) {
    const textarea = document.getElementById(`reply-text-${reviewId}`);
    const content = textarea.value.trim();
    
    if (!content) {
        alert('Please enter reply content');
        return;
    }

    try {
        const { error } = await supabase
            .from('review_replies')
            .insert([{
                review_id: reviewId,
                user_id: currentUser.id,
                content: content
            }]);

        if (error) throw error;
        
        // Show success message
        showSuccessMessage('Reply posted successfully!');
        
        // Remove the form and reload to show the new comment
        const section = document.getElementById(`reply-section-${reviewId}`);
        const form = section.querySelector('.reply-form');
        if (form) form.remove();
        
        // Reload reviews to show the new comment
        loadReviews();
    } catch (error) {
        console.error('Error submitting reply:', error);
        alert('Error submitting reply: ' + error.message);
    }
};

window.handleReaction = async function(reviewId) {
    if (!currentUser) {
        window.location.href = 'auth.html?mode=login';
        return;
    }

    try {
        const { data: existingReaction } = await supabase
            .from('review_reactions')
            .select('*')
            .eq('review_id', reviewId)
            .eq('user_id', currentUser.id)
            .maybeSingle();

        if (existingReaction) {
            await supabase
                .from('review_reactions')
                .delete()
                .eq('review_id', reviewId)
                .eq('user_id', currentUser.id);
            showSuccessMessage('Reaction removed');
        } else {
            await supabase
                .from('review_reactions')
                .insert([{
                    review_id: reviewId,
                    user_id: currentUser.id,
                    reaction_type: 'like'
                }]);
            showSuccessMessage('Liked review!');
        }

        loadReviews();
    } catch (error) {
        console.error('Error toggling reaction:', error);
        alert('Error toggling reaction: ' + error.message);
    }
};

window.editReview = function(review) {
    showReviewModal(review);
};

window.deleteReview = async function(reviewId) {
    if (!confirm('Are you sure you want to delete this review?')) return;

    try {
        const { error } = await supabase
            .from('reviews')
            .delete()
            .eq('id', reviewId);

        if (error) throw error;
        
        showSuccessMessage('Review deleted successfully!');
        loadReviews();
    } catch (error) {
        console.error('Error deleting review:', error);
        alert('Error deleting review: ' + error.message);
    }
};
