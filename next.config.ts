import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  serverExternalPackages: ['usb'],
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Handle native modules for server-side rendering
      config.externals = config.externals || []
      config.externals.push({
        'usb': 'commonjs usb'
      })
    }
    return config
  }
};

export default nextConfig;
