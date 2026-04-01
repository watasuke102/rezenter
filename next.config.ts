import {createVanillaExtractPlugin} from '@vanilla-extract/next-plugin';
import type {NextConfig} from 'next';

const withVanillaExtract = createVanillaExtractPlugin({
  unstable_turbopack: {mode: 'on'},
});

const nextConfig: NextConfig = {
  reactCompiler: true,
};

export default withVanillaExtract(nextConfig);
