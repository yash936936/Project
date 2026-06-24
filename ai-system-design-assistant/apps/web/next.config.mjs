/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@asdas/shared'],
  experimental: { typedRoutes: true },
};
export default nextConfig;
