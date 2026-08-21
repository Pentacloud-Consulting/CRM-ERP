/** @type {import('next').NextConfig} */
const nextConfig = {
  async redirects() {
    return [
      {
        source: '/operations/awb',
        destination: '/operations/transport-docs',
        permanent: true,
      },
      {
        source: '/operations/awb/:id*',
        destination: '/operations/transport-docs/:id*',
        permanent: true,
      },
      {
        source: '/operations/manifests',
        destination: '/operations/transport-manifests',
        permanent: true,
      },
      {
        source: '/operations/manifests/:id*',
        destination: '/operations/transport-manifests/:id*',
        permanent: true,
      },
    ]
  },
};

export default nextConfig;
