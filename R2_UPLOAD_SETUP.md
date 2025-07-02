# Cloudflare R2 Video Upload Setup

This project has been migrated from Bunny.net to Cloudflare R2 for video uploads. The UI remains the same, but the backend now uses Cloudflare R2 storage.

## Setup Instructions

### 1. Install Dependencies

First, install the new dependencies:

```bash
npm install
```

### 2. Environment Configuration

Create a `.env` file in your project root and add the following variables:

```env
# Supabase Configuration (existing)
VITE_SUPABASE_URL=your_supabase_url_here
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key_here

# Upload Server Configuration
VITE_UPLOAD_SERVER_URL=http://localhost:3001

# Cloudflare R2 Configuration
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
AWS_ACCESS_KEY_ID=your_r2_access_key_id
AWS_SECRET_ACCESS_KEY=your_r2_secret_access_key
R2_BUCKET=your-r2-bucket-name
R2_PUBLIC_URL=https://your-custom-domain.com
PORT=3001
```

### 3. Cloudflare R2 Setup

1. **Create an R2 Bucket:**
   - Go to your Cloudflare dashboard
   - Navigate to R2 Object Storage
   - Create a new bucket

2. **Get API Credentials:**
   - Go to "Manage R2 API tokens"
   - Create a new API token with R2 permissions
   - Note down the Access Key ID and Secret Access Key

3. **Set up Custom Domain (Optional but Recommended):**
   - Configure a custom domain for your R2 bucket
   - This will be your `R2_PUBLIC_URL`

### 4. Running the Application

You need to run both the React app and the upload server:

**Terminal 1 - React App:**
```bash
npm run dev
```

**Terminal 2 - Upload Server:**
```bash
npm run server
```

### 5. How It Works

1. **Frontend (React):** The VideoUploader component creates a FormData object and sends it to the Express server
2. **Backend (Express):** The server receives the file, uploads it to Cloudflare R2, and returns the public URL
3. **Storage:** Videos are stored in your R2 bucket under the `videos/` directory with timestamped filenames

### 6. File Structure

```
your-project/
├── r2_uploader.js          # Express server for R2 uploads
├── r2-config-example.env   # Environment configuration example
├── src/components/
│   └── VideoUploader.jsx   # Updated to use R2 instead of Bunny.net
└── package.json            # Updated with new dependencies
```

### 7. Differences from Bunny.net

- **Better Error Handling:** The Express server provides more detailed error messages
- **Consistent Upload Process:** All uploads go through the same server endpoint
- **Custom Domain Support:** Easy to use your own CDN domain
- **Future Extensibility:** Easy to add features like thumbnail generation, video processing, etc.

### 8. Troubleshooting

- **CORS Issues:** Make sure the upload server is running on port 3001
- **Upload Failures:** Check your R2 credentials and bucket permissions
- **Environment Variables:** Ensure all required variables are set in your `.env` file

The UI and user experience remain exactly the same - only the backend upload mechanism has changed. 