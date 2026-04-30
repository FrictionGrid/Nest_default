import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import FormData from 'form-data';
import { extname } from 'path';
import * as https from 'https';

@Injectable()
export class SynologyService {
  private readonly logger = new Logger(SynologyService.name);
  private sid: string | null = null;
  private synotoken: string | null = null;
  private loginPromise: Promise<void> | null = null;

  constructor(private readonly config: ConfigService) {}

  private get baseUrl(): string {
    const proto = this.config.get('NAS_PROTOCOL', 'https');
    const host  = this.config.get('NAS_HOST');
    const port  = this.config.get('NAS_PORT', '5001');
    return `${proto}://${host}:${port}/webapi/entry.cgi`;
  }

  get nasBasePath(): string {
    return this.config.get('NAS_BASE_PATH', '/dashboard');
  }

  private get httpsAgent() {
    return new https.Agent({ rejectUnauthorized: false });
  }

  // ── Session ───────────────────────────────────────────────────────────────

  private async doLogin(): Promise<void> {
    const res = await axios.get(this.baseUrl, {
      httpsAgent: this.httpsAgent,
      params: {
        api: 'SYNO.API.Auth',
        version: 6,
        method: 'login',
        account: this.config.get('NAS_USERNAME'),
        passwd:  this.config.get('NAS_PASSWORD'),
        format:  'sid',
        enable_syno_token: 'yes',
      },
    });

    if (!res.data.success) {
      throw new Error(`NAS login failed: code ${res.data.error?.code}`);
    }

    this.sid       = res.data.data.sid;
    this.synotoken = res.data.data.synotoken;
    this.logger.log('NAS session established');
  }

  private async ensureSession(): Promise<void> {
    if (this.sid) return;
    if (!this.loginPromise) {
      this.loginPromise = this.doLogin().finally(() => {
        this.loginPromise = null;
      });
    }
    await this.loginPromise;
  }

  private resetSession(): void {
    this.sid       = null;
    this.synotoken = null;
  }

  private isSessionError(code: number): boolean {
    return code === 106 || code === 119;
  }

  // ── Upload ────────────────────────────────────────────────────────────────

  async uploadFile(
    projectId: number,
    originalName: string,
    buffer: Buffer,
    mimetype: string,
  ): Promise<string> {
    await this.ensureSession();

    const destFolder = `${this.nasBasePath}/project_${projectId}`;
    const ext        = extname(originalName);
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e6)}${ext}`;

    const form = new FormData();
    form.append('api',            'SYNO.FileStation.Upload');
    form.append('version',        '3');
    form.append('method',         'upload');
    form.append('path',           destFolder);
    form.append('create_parents', 'true');
    form.append('overwrite',      'false');
    form.append('_sid',           this.sid!);
    form.append('SynoToken',      this.synotoken!);
    form.append('file', buffer, { filename: uniqueName, contentType: mimetype });

    const res = await axios.post(this.baseUrl, form, {
      httpsAgent: this.httpsAgent,
      headers: form.getHeaders(),
    });

    if (!res.data.success) {
      const code: number = res.data.error?.code;
      if (this.isSessionError(code)) {
        this.resetSession();
        await this.ensureSession();
        return this.uploadFile(projectId, originalName, buffer, mimetype);
      }
      throw new Error(`NAS upload failed: code ${code}`);
    }

    return `${destFolder}/${uniqueName}`;
  }

  // ── Download ──────────────────────────────────────────────────────────────

  async downloadFile(nasPath: string): Promise<Buffer> {
    await this.ensureSession();

    const res = await axios.get(this.baseUrl, {
      httpsAgent: this.httpsAgent,
      params: {
        api:        'SYNO.FileStation.Download',
        version:    2,
        method:     'download',
        path:       JSON.stringify([nasPath]),
        mode:       'download',
        _sid:       this.sid,
        SynoToken:  this.synotoken,
      },
      responseType: 'arraybuffer',
    });

    // DSM returns JSON on error instead of binary
    const contentType = String(res.headers['content-type'] ?? '');
    if (contentType.includes('application/json')) {
      const json = JSON.parse(Buffer.from(res.data).toString());
      if (!json.success) {
        const code: number = json.error?.code;
        if (this.isSessionError(code)) {
          this.resetSession();
          await this.ensureSession();
          return this.downloadFile(nasPath);
        }
        throw new Error(`NAS download failed: code ${code}`);
      }
    }

    return Buffer.from(res.data);
  }

  // ── Delete ────────────────────────────────────────────────────────────────

  async deleteFile(nasPath: string): Promise<void> {
    await this.ensureSession();

    const res = await axios.get(this.baseUrl, {
      httpsAgent: this.httpsAgent,
      params: {
        api:       'SYNO.FileStation.Delete',
        version:   2,
        method:    'start',
        path:      JSON.stringify([nasPath]),
        recursive: 'false',
        _sid:      this.sid,
        SynoToken: this.synotoken,
      },
    });

    if (!res.data.success) {
      const code: number = res.data.error?.code;
      if (this.isSessionError(code)) {
        this.resetSession();
        await this.ensureSession();
        return this.deleteFile(nasPath);
      }
      this.logger.warn(`NAS delete failed for ${nasPath}: code ${code}`);
    }
  }
}
