import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import type { Plugin } from 'vite';
import ytSearch from 'yt-search';

// Plugin: server-side image proxy and upload (avoids CORS, faster uploads)
function imageProxyPlugin(): Plugin {
  return {
    name: 'image-proxy',
    configureServer(server) {
      // Proxy: download external image (for downloading results)
      server.middlewares.use('/api/proxy-image', async (req, res) => {
        try {
          const reqUrl = new URL(req.url || '', 'http://localhost');
          const imageUrl = reqUrl.searchParams.get('url');
          if (!imageUrl) {
            res.statusCode = 400;
            res.end('Missing url parameter');
            return;
          }

          const response = await fetch(imageUrl);
          if (!response.ok) {
            res.statusCode = response.status;
            res.end(`Failed to fetch image: ${response.statusText}`);
            return;
          }

          const buffer = Buffer.from(await response.arrayBuffer());
          res.setHeader('Content-Type', response.headers.get('content-type') || 'image/png');
          res.setHeader('Content-Length', buffer.length.toString());
          res.end(buffer);
        } catch (err: any) {
          res.statusCode = 500;
          res.end(`Proxy error: ${err.message}`);
        }
      });

      // Upload: receive base64 from frontend, upload to tmpfiles.org server-side
      server.middlewares.use('/api/upload-image', async (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.end('Method not allowed');
          return;
        }

        try {
          // Read POST body
          const chunks: Buffer[] = [];
          for await (const chunk of req) {
            chunks.push(Buffer.from(chunk));
          }
          const body = JSON.parse(Buffer.concat(chunks).toString());
          const dataUri: string = body.dataUri;

          if (!dataUri) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing dataUri' }));
            return;
          }

          // If already a URL, return it
          if (dataUri.startsWith('http')) {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ url: dataUri }));
            return;
          }

          // Convert base64 to buffer
          const matches = dataUri.match(/^data:(.+?);base64,(.+)$/);
          if (!matches) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Invalid data URI' }));
            return;
          }

          const mime = matches[1];
          const ext = mime.split('/')[1] || 'png';
          const imageBuffer = Buffer.from(matches[2], 'base64');

          // Upload to tmpfiles.org from server (much faster)
          const formData = new FormData();
          const blob = new Blob([imageBuffer], { type: mime });
          formData.append('file', blob, `image.${ext}`);

          const uploadRes = await fetch('https://tmpfiles.org/api/v1/upload', {
            method: 'POST',
            body: formData,
          });

          if (!uploadRes.ok) {
            throw new Error(`Upload failed: ${uploadRes.status}`);
          }

          const uploadData = await uploadRes.json() as any;
          const url = uploadData.data?.url;
          if (!url) throw new Error('No URL in upload response');

          // Convert to direct download URL
          const directUrl = url.replace('tmpfiles.org/', 'tmpfiles.org/dl/');

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ url: directUrl }));
        } catch (err: any) {
          console.error('Upload error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });

      // YouTube Search Proxy: search YouTube with pagination support
      server.middlewares.use('/api/youtube-search', async (req, res) => {
        try {
          const reqUrl = new URL(req.url || '', 'http://localhost');
          const query = reqUrl.searchParams.get('q');
          const page = parseInt(reqUrl.searchParams.get('page') || '1', 10);
          const pageSize = 12;

          if (!query) {
            res.statusCode = 400;
            res.end(JSON.stringify({ error: 'Missing query parameter' }));
            return;
          }

          // yt-search returns ~20-40 results. For more pages, append page number to query
          // to get different results from YouTube's search algorithm
          const searchQuery = page > 1 ? `${query} ${page}` : query;
          const result = await ytSearch(searchQuery);

          const allVideos = result.videos.map(v => ({
            id: v.videoId,
            title: v.title,
            author: v.author.name,
            views: v.views,
            thumbnail: `https://img.youtube.com/vi/${v.videoId}/maxresdefault.jpg`,
            url: v.url
          }));

          // Paginate: return pageSize results for the requested page
          const start = 0;
          const videos = allVideos.slice(start, pageSize);
          const hasMore = allVideos.length > pageSize || page < 5; // allow up to 5 pages

          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ videos, page, hasMore, totalResults: allVideos.length }));
        } catch (err: any) {
          console.error('YouTube Search error:', err);
          res.statusCode = 500;
          res.end(JSON.stringify({ error: err.message }));
        }
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [react(), tailwindcss(), imageProxyPlugin()],
    define: {
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      'process.env.KIE_API_KEY': JSON.stringify(env.KIE_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      proxy: {
        '/api/create-checkout-session': 'http://127.0.0.1:3001',
        '/api/webhooks': 'http://127.0.0.1:3001',
        '/api/customer-portal': 'http://127.0.0.1:3001',
        '/api/subscription-status': 'http://127.0.0.1:3001',
      },
    },
  };
});
