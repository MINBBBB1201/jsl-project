import path from "path";
import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// i18n 요청 설정 위치를 플러그인에 알려준다
const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

// 사용자 홈 디렉터리의 stray package-lock.json 때문에 Next가 워크스페이스 루트를
// 프로젝트 밖으로 잘못 추론해 Turbopack이 컴파일 재시도 루프에 빠지며 OOM 크래시하는
// 문제가 있었다. 루트를 명시해 추론 자체를 없앤다.
const projectRoot = path.resolve(__dirname);

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  experimental: {
    optimizePackageImports: ["lucide-react", "@radix-ui/react-icons"],
    // 루트 레이아웃이 여러 개라 app/not-found.tsx 를 감쌀 곳이 없다.
    // 매칭되지 않는 URL 의 404 는 app/global-not-found.tsx 가 <html> 부터 그린다.
    globalNotFound: true,
  },
  turbopack: {
    root: projectRoot,
  },

  // Image optimization
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'ui.shadcn.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
    formats: ['image/webp', 'image/avif'],
  },

  // Headers for better security and performance
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin',
          },
        ],
      },
    ];
  },

  // Redirects for better SEO
  async redirects() {
    return [
      /*
        루트는 공개 랜딩으로 보낸다. 예전에는 app/page.tsx 가 redirect 했지만
        루트 레이아웃이 여러 개가 되면서 '/' 를 감쌀 레이아웃이 없어졌다.
        middleware 도 같은 리다이렉트를 하지만, 미들웨어를 타지 않는 경로에서도
        같은 목적지가 되도록 여기 둔다.
      */
      {
        source: '/',
        destination: '/landing',
        permanent: false,
      },
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
};

export default withNextIntl(nextConfig);
