import {createVanillaExtractPlugin} from '@vanilla-extract/next-plugin';
import type {NextConfig} from 'next';

const withVanillaExtract = createVanillaExtractPlugin({
  unstable_turbopack: {mode: 'on'},
});

const nextConfig: NextConfig = {
  reactCompiler: true,
  experimental: {
    proxyClientMaxBodySize: '1gb',
    serverActions: {
      bodySizeLimit: '1gb',
    },
  },
};

export default withVanillaExtract(nextConfig);
