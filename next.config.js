/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'ieiocioccehoshfldvhq.supabase.co',
      },
      {
        protocol: 'https',
        hostname: 'media.gettyimages.com',
      },
      {
        protocol: 'https',
        hostname: '*.gettyimages.com',
      },
      {
        protocol: 'https',
        hostname: 'images.vivino.com',
      },
      {
        protocol: 'https',
        hostname: '*.vivino.com',
      },
    ],
  },
  typedRoutes: false,
}

module.exports = nextConfig
