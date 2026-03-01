import { Injectable, Logger } from '@nestjs/common';
import axios, { AxiosError } from 'axios';
import * as cheerio from 'cheerio';

const REALISTIC_USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36';

const CLOUDFLARE_MARKERS = [
  'Just a moment',
  'cf-browser-verification',
  'Checking your browser',
  'DDoS protection by Cloudflare',
  'cf_chl_',
];

@Injectable()
export class ScraperService {
  private readonly logger = new Logger(ScraperService.name);
  private readonly MAX_CHARS = 3000;

  async scrape(url: string): Promise<string> {
    try {
      const response = await axios.get<string>(url, {
        headers: { 'User-Agent': REALISTIC_USER_AGENT },
        timeout: 10_000,
        responseType: 'text',
        maxRedirects: 5,
      });

      const html: string = response.data;

      if (this.isCloudflareChallenge(response.status, html)) {
        this.logger.warn(`Cloudflare challenge detected for ${url} — returning empty string`);
        return '';
      }

      const text = this.extractText(html);
      return text.slice(0, this.MAX_CHARS);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError;
      const status = axiosErr.response?.status;
      if (status === 403 || status === 503) {
        this.logger.warn(`Cloudflare/blocked ${url} (${status}) — returning empty string`);
      } else {
        this.logger.warn(`Scrape failed ${url}: ${axiosErr.message} — returning empty string`);
      }
      return '';
    }
  }

  private isCloudflareChallenge(status: number, html: string): boolean {
    if (status === 403 || status === 503) return true;
    return CLOUDFLARE_MARKERS.some((marker) => html.includes(marker));
  }

  private extractText(html: string): string {
    const $ = cheerio.load(html);
    $('script, style, nav, footer, header, aside, noscript').remove();
    return $('body').text().replace(/\s+/g, ' ').trim();
  }
}
