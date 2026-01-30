import http from 'node:http';
import { URL } from 'node:url';
import { bootstrapRepository, type CatalogRepository } from '@search/data-pipeline';
import { createHttpHandlers, createSearchController } from '@search/api-gateway';

export type ServerOptions = {
  repository?: CatalogRepository;
  baseUrl?: string;
};

export const createServer = (options: ServerOptions = {}) => {
  const repository = options.repository ?? bootstrapRepository();
  const controller = createSearchController({ repository });
  const handlers = createHttpHandlers(controller);
  const baseUrl = options.baseUrl ?? 'http://localhost';

  return http.createServer(async (req, res) => {
    if (!req.url) {
      res.statusCode = 400;
      res.end('Missing URL');
      return;
    }

    const url = new URL(req.url, baseUrl);
    res.setHeader('Content-Type', 'application/json');

    if (req.method === 'GET' && url.pathname === '/health') {
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/search') {
      const query = url.searchParams.get('q') ?? '';
      const payload = await handlers.searchHandler(query);
      res.end(JSON.stringify(payload));
      return;
    }

    if (req.method === 'GET' && url.pathname === '/search/autocomplete') {
      const query = url.searchParams.get('q') ?? '';
      const payload = await handlers.autocompleteHandler(query);
      res.end(JSON.stringify(payload));
      return;
    }

    res.statusCode = 404;
    res.end(JSON.stringify({ error: 'Not found' }));
  });
};
