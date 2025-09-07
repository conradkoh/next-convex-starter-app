import createMDX from '@next/mdx';
import type { NextConfig } from 'next';
import remarkGfm from 'remark-gfm';

/** @type {import('next').NextConfig} */
const nextConfig: NextConfig = {
  // Configure `pageExtensions` to include markdown and MDX files
  pageExtensions: ['js', 'jsx', 'md', 'mdx', 'ts', 'tsx'],
  eslint: {
    // Disabling Next.js' built-in ESLint integration as we're using Biome
    ignoreDuringBuilds: true,
  },
  experimental: {
    // Enable typed routes for compile-time type safety
    typedRoutes: true,
  },
};

const withMDX = createMDX({
  // Add markdown plugins here, as desired
  options: {
    // Enable GitHub Flavored Markdown (tables, strikethrough, task lists, autolinks)
    remarkPlugins: [remarkGfm],
    rehypePlugins: [],
  },
});

// Combine MDX and Next.js config
export default withMDX(nextConfig);
