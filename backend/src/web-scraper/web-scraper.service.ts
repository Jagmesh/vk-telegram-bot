import { Injectable } from '@nestjs/common';
import axios, { AxiosResponse } from 'axios';
import * as cheerio from 'cheerio';
import { LogService } from '../log/log.service';

@Injectable()
export class WebScraperService {
  constructor(private readonly logService: LogService) {
    this.logService.setScope('WEB_SCRAPER');
  }
  async scrapeForHrefLinks(url: string, selector: string): Promise<string[]> {
    try {
      const { data } = await axios.get(url);

      const $ = cheerio.load(data);

      return $(selector)
        .map((index, element) => $(element).attr('href'))
        .get();
    } catch (error) {
      this.logService.error(`Error scraping the website: ${error}`);
      return null;
    }
  }
}
