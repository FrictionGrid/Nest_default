import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';
import * as https from 'https';
import FormData from 'form-data';

@Injectable()
export class SynologyService {
  private readonly logger = new Logger(SynologyService.name);
  private readonly http: AxiosInstance;
  private readonly baseUrl: string;
  private readonly basePath: string;

  private sid: string | null = null;
  private synotoken: string | null = null;
  private loginPromise: Promise<void> | null = null;

  constructor(private readonly config: ConfigService) {
    const protocol = config.get('NAS_PROTOCOL', 'https');
    const host     = config.get('NAS_HOST', '');
    const port     = config.get('NAS_PORT', '5001');
    this.baseUrl   = `${protocol}://${host}:${port}/webapi/entry.cgi`;
    this.basePath  = config.get('NAS_BASE_PATH', '/dashboard');

    this.http = axios.create({
      httpsAgent: new https.Agent({ rejectUnauthorized: false }),
      timeout: 30_000,
    });
  }

  // ── Login ──────────────────────────────────────────────────────────────────
  private async login(): Promise<void> {
    const res = await this.http.get(this.baseUrl, {
      params: {
        api: 'SYNO.API.Auth',
        version: 6,
        method: 'login',
        account:           this.config.get('NAS_USERNAME'),
        passwd:            this.config.get('NAS_PASSWORD'),
        enable_syno_token: 'yes',
      },
    });

    if (!res.data?.success) {
      throw new InternalServerErrorException(
        `NAS login failed (code ${res.data?.error?.code})`,
      );
    }

    this.sid       = res.data.data.sid;
    this.synotoken = res.data.data.synotoken ?? null;
    this.logger.log('NAS session acquired');
    await this.listShares();
  }

  private async ensureSession(): Promise<void> {
    if (this.sid) return;
    if (!this.loginPromise) {
      this.loginPromise = this.login().finally(() => { this.loginPromise = null; });
    }
    await this.loginPromise;
  }

  // session-expired codes from docs: 105, 106, 107, 119
  private isSessionError(code: number) {
    return [105, 106, 107, 119].includes(code);
  }

  // ── List shares (debug helper) ────────────────────────────────────────────
  async listShares(): Promise<void> {
    await this.ensureSession();
    const res = await this.http.get(this.baseUrl, {
      params: { api: 'SYNO.FileStation.List', version: 2, method: 'list_share', _sid: this.sid },
    });
    const shares = res.data?.data?.shares ?? [];
    this.logger.log('Available shares: ' + shares.map((s: any) => s.path).join(', '));
  }

  // ── Upload ─────────────────────────────────────────────────────────────────
  async uploadFile(
    buffer: Buffer,
    originalname: string,
    folderName: string,
  ): Promise<string> {
    await this.ensureSession();

    const remotePath = `${this.basePath}/${folderName}`;
    const result = await this.doUpload(buffer, originalname, remotePath);

    if (!result.success && this.isSessionError(result.error?.code)) {
      this.sid = null;
      await this.login();
      return this.doUpload(buffer, originalname, remotePath).then((r) => {
        if (!r.success) throw new InternalServerErrorException(`NAS upload failed (code ${r.error?.code})`);
        return `${remotePath}/${originalname}`;
      });
    }

    if (!result.success) {
      this.logger.error(`NAS upload failed: ${JSON.stringify(result)}`);
      throw new InternalServerErrorException(`NAS upload failed (code ${result.error?.code})`);
    }

    return `${remotePath}/${originalname}`;
  }

  private async ensureFolder(folderPath: string): Promise<void> {
    const parts = folderPath.split('/').filter(Boolean);
    const folderName = parts.pop()!;
    const parentPath = '/' + parts.join('/');

    const params: Record<string, string> = {
      api:          'SYNO.FileStation.CreateFolder',
      version:      '2',
      method:       'create',
      folder_path:  JSON.stringify([parentPath]),
      name:         JSON.stringify([folderName]),
      force_parent: 'true',
      _sid:         this.sid!,
    };
    if (this.synotoken) params['SynoToken'] = this.synotoken;

    const res = await this.http.get(this.baseUrl, { params });
    this.logger.log(`createFolder(${folderPath}): ${JSON.stringify(res.data)}`);
  }

  private async doUpload(buffer: Buffer, filename: string, remotePath: string) {
    this.logger.log(`uploading to path="${remotePath}" filename="${filename}"`);

    await this.ensureFolder(remotePath);

    const form = new FormData();
    form.append('path',      remotePath);
    form.append('overwrite', 'true');
    form.append('file', buffer, { filename });

    const params: Record<string, string> = {
      api:     'SYNO.FileStation.Upload',
      version: '2',
      method:  'upload',
      _sid:    this.sid!,
    };
    if (this.synotoken) params['SynoToken'] = this.synotoken;

    const res = await this.http.post(this.baseUrl, form, {
      params,
      headers: form.getHeaders(),
    });

    this.logger.log(`upload response: ${JSON.stringify(res.data)}`);
    return res.data;
  }

  // ── Download ───────────────────────────────────────────────────────────────
  async downloadStream(nasPath: string) {
    await this.ensureSession();
    this.logger.log(`download path: ${nasPath}`);

    const params: Record<string, any> = {
      api:     'SYNO.FileStation.Download',
      version: 2,
      method:  'download',
      path:    nasPath,
      mode:    'download',
      _sid:    this.sid,
    };
    if (this.synotoken) params['SynoToken'] = this.synotoken;

    const res = await this.http.get(this.baseUrl, {
      params,
      responseType: 'stream',
    });
    this.logger.log(`download content-type: ${res.headers['content-type']}, status: ${res.status}`);

    // If NAS returns JSON error (session expired), re-login and retry once
    const ct = String(res.headers['content-type'] ?? '');
    if (ct.includes('application/json')) {
      const chunks: Buffer[] = [];
      for await (const chunk of res.data) chunks.push(chunk as Buffer);
      const body = JSON.parse(Buffer.concat(chunks).toString());
      if (!body.success && this.isSessionError(body.error?.code)) {
        this.sid = null;
        await this.login();
        return this.downloadStream(nasPath);
      }
      throw new InternalServerErrorException(`NAS download failed (code ${body.error?.code})`);
    }

    return res;
  }

  // ── Delete ─────────────────────────────────────────────────────────────────
  async deleteFile(nasPath: string): Promise<void> {
    await this.ensureSession();
    await this.doDelete(nasPath);
  }

  private async doDelete(nasPath: string) {
    const params: Record<string, any> = {
      api:     'SYNO.FileStation.Delete',
      version: 2,
      method:  'start',
      path:    JSON.stringify([nasPath]),
      _sid:    this.sid,
    };
    if (this.synotoken) params['SynoToken'] = this.synotoken;

    const res = await this.http.get(this.baseUrl, { params });

    if (!res.data?.success) {
      if (this.isSessionError(res.data?.error?.code)) {
        this.sid = null;
        await this.login();
        const retry = await this.http.get(this.baseUrl, { params: { ...params, _sid: this.sid } });
        if (!retry.data?.success) {
          this.logger.warn(`NAS delete failed (code ${retry.data?.error?.code}), ignoring`);
        }
        return;
      }
      this.logger.warn(`NAS delete failed (code ${res.data?.error?.code}), ignoring`);
    }
  }
}
