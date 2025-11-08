# Mentora Electric Reviews

A social media-style review platform for Mentora Electric products.

## Setup Instructions

### 1. Supabase Setup

1. Create a new project at [Supabase](https://supabase.com)
2. Go to Settings > API to find your:
   - Project URL (SUPABASE_URL)
   - Anonymous Key (SUPABASE_ANON_KEY)
3. Update these values in `script.js`

### 2. Database Setup

1. In your Supabase project, go to the SQL Editor
2. Copy and paste the entire contents of `supabase-setup.sql`
3. Run the SQL to create all tables, policies, and sample data

### 3. Storage Setup

1. In Supabase, go to Storage
2. Create a new bucket called `review-images`
3. Set the bucket to public

### 4. Deploy to Vercel

1. Create a new repository with these files
2. Connect your repository to Vercel
3. Deploy the project

### 5. Make Yourself an Admin

1. Sign up for an account on your deployed site
2. In Supabase, go to the Table Editor and find your user in the `profiles` table
3. Edit your profile and set `is_admin` to `true`

## Features

- **User Authentication**: Sign up, login, and password reset
- **Product Reviews**: Users can post reviews with images
- **Social Interactions**: Like reviews and see admin replies
- **Admin Panel**: Manage reviews, products, and users
- **Responsive Design**: Works on desktop and mobile

## File Structure

- `index.html` - Main HTML file
- `style.css` - All styling
- `script.js` - Client-side JavaScript with Supabase integration
- `supabase-setup.sql` - Database schema and setup
- `README.md` - This file

## Customization

- Update colors in `:root` CSS variables
- Modify the logo URL in `index.html`
- Add more products via the admin panel