/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: ['localhost', 'api.example.com', 'cloudinary.com', 'images.unsplash.com'],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
}

module.exports = nextConfig
