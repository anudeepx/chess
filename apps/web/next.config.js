/** @type {import('next').NextConfig} */
const nextConfig = {
	transpilePackages: ["@repo/db", "@repo/types", "@repo/ui"],
};

export default nextConfig;
