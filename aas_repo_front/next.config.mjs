/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  reactStrictMode: false, // 개발용
  
  // 프로덕션 빌드에서 소스맵 비활성화 (코드를 minified처럼 보이게 함)
  productionBrowserSourceMaps: false,
  
  // SWC를 사용한 minification 활성화 (기본값이지만 명시적으로 설정)
  swcMinify: true,
  
  // 추가 보안: 컴파일러 옵션에서 소스맵 완전히 비활성화
  webpack: (config, { dev, isServer }) => {
    if (!dev && !isServer) {
      config.devtool = false; // 프로덕션에서 소스맵 완전히 비활성화
    }
    return config;
  },
};

export default nextConfig;
