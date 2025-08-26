/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return [
      {
        // Proxy browser calls to the FastAPI service inside Docker
        // Backend endpoints are rooted at "/" (e.g., /upload, /status/:id, /results/:id)
        source: '/api/:path*',
        destination: 'http://backend:8000/:path*',
      },
    ]
  },
}

module.exports = nextConfig