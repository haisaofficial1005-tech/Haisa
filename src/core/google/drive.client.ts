/**
 * Google Drive Client
 * Requirements: 3.4, 5.4
 */

import { getGoogleConfig } from '../config/google.config';
import * as crypto from 'crypto';

export interface DriveFile {
  id: string;
  url: string;
  name: string;
  mimeType: string;
  size: number;
}

export interface DriveFolder {
  id: string;
  url: string;
  name: string;
}

export interface UploadFileParams {
  folderId: string;
  file: Buffer;
  fileName: string;
  mimeType: string;
}

export interface CreateFolderParams {
  parentFolderId: string;
  folderName: string;
}

/**
 * Base64URL encode (no padding)
 */
function base64UrlEncode(data: string | Buffer): string {
  const base64 = Buffer.isBuffer(data) ? data.toString('base64') : Buffer.from(data).toString('base64');
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

/**
 * Google Drive Client
 * Uses service account credentials for all operations
 * Requirements: 5.5
 */
export class DriveClient {
  private serviceAccountEmail: string;
  private serviceAccountPrivateKey: string;
  private accessToken: string | null = null;
  private tokenExpiry: Date | null = null;

  constructor(serviceAccountEmail?: string, serviceAccountPrivateKey?: string) {
    const config = getGoogleConfig();
    this.serviceAccountEmail = serviceAccountEmail || config.serviceAccount.email;
    this.serviceAccountPrivateKey = serviceAccountPrivateKey || config.serviceAccount.privateKey;
  }

  /**
   * Creates a JWT for Google OAuth2
   */
  private createJwt(): string {
    const now = Math.floor(Date.now() / 1000);
    const expiry = now + 3600; // 1 hour

    const header = {
      alg: 'RS256',
      typ: 'JWT',
    };

    const payload = {
      iss: this.serviceAccountEmail,
      scope: 'https://www.googleapis.com/auth/drive',
      aud: 'https://oauth2.googleapis.com/token',
      iat: now,
      exp: expiry,
    };

    const headerB64 = base64UrlEncode(JSON.stringify(header));
    const payloadB64 = base64UrlEncode(JSON.stringify(payload));
    const signatureInput = `${headerB64}.${payloadB64}`;

    // Parse the private key (handle escaped newlines)
    const privateKey = this.serviceAccountPrivateKey.replace(/\\n/g, '\n');

    // Sign with RSA-SHA256
    const sign = crypto.createSign('RSA-SHA256');
    sign.update(signatureInput);
    const signature = sign.sign(privateKey);
    const signatureB64 = base64UrlEncode(signature);

    return `${signatureInput}.${signatureB64}`;
  }

  /**
   * Gets or refreshes access token using service account JWT
   */
  private async getAccessToken(): Promise<string> {
    // Return cached token if still valid
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    // Check if credentials are configured
    if (!this.serviceAccountEmail || !this.serviceAccountPrivateKey) {
      throw new Error('Google service account credentials not configured');
    }

    try {
      const jwt = this.createJwt();

      const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          grant_type: 'urn:ietf:params:oauth:grant-type:jwt-bearer',
          assertion: jwt,
        }),
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to get access token: ${error}`);
      }

      const data = await response.json() as { access_token: string; expires_in: number };
      
      this.accessToken = data.access_token;
      this.tokenExpiry = new Date(Date.now() + (data.expires_in - 60) * 1000); // Refresh 1 min early

      return this.accessToken;
    } catch (error) {
      console.error('Google auth error:', error);
      throw new Error(`Service account authentication failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Uploads a file to Google Drive
   * Requirements: 3.4, 5.4
   */
  async uploadFile(params: UploadFileParams): Promise<DriveFile> {
    const { folderId, file, fileName, mimeType } = params;
    
    const accessToken = await this.getAccessToken();

    // Multipart upload to Drive API
    const boundary = '-------314159265358979323846';
    const metadata = {
      name: fileName,
      parents: [folderId],
      mimeType,
    };

    const multipartBody = [
      `--${boundary}`,
      'Content-Type: application/json; charset=UTF-8',
      '',
      JSON.stringify(metadata),
      `--${boundary}`,
      `Content-Type: ${mimeType}`,
      'Content-Transfer-Encoding: base64',
      '',
      file.toString('base64'),
      `--${boundary}--`,
    ].join('\r\n');

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,mimeType,size,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body: multipartBody,
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Drive upload failed: ${error}`);
    }

    const data = await response.json() as {
      id: string;
      name: string;
      mimeType: string;
      size: string;
      webViewLink: string;
    };

    return {
      id: data.id,
      url: data.webViewLink,
      name: data.name,
      mimeType: data.mimeType,
      size: parseInt(data.size, 10),
    };
  }

  /**
   * Creates a folder in Google Drive
   */
  async createFolder(params: CreateFolderParams): Promise<DriveFolder> {
    const { parentFolderId, folderName } = params;
    
    const accessToken = await this.getAccessToken();

    const metadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [parentFolderId],
    };

    const response = await fetch(
      'https://www.googleapis.com/drive/v3/files?fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(metadata),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Folder creation failed: ${error}`);
    }

    const data = await response.json() as {
      id: string;
      name: string;
      webViewLink: string;
    };

    return {
      id: data.id,
      url: data.webViewLink,
      name: data.name,
    };
  }

  /**
   * Deletes a file from Google Drive
   */
  async deleteFile(fileId: string): Promise<void> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}`,
      {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (!response.ok && response.status !== 404) {
      const error = await response.text();
      throw new Error(`File deletion failed: ${error}`);
    }
  }

  /**
   * Gets file metadata
   */
  async getFile(fileId: string): Promise<DriveFile | null> {
    const accessToken = await this.getAccessToken();

    const response = await fetch(
      `https://www.googleapis.com/drive/v3/files/${fileId}?fields=id,name,mimeType,size,webViewLink`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    if (response.status === 404) {
      return null;
    }

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Get file failed: ${error}`);
    }

    const data = await response.json() as {
      id: string;
      name: string;
      mimeType: string;
      size: string;
      webViewLink: string;
    };

    return {
      id: data.id,
      url: data.webViewLink,
      name: data.name,
      mimeType: data.mimeType,
      size: parseInt(data.size, 10),
    };
  }
}

/**
 * Generates Drive folder URL from folder ID
 */
export function getDriveFolderUrl(folderId: string): string {
  return `https://drive.google.com/drive/folders/${folderId}`;
}

/**
 * Generates Drive file URL from file ID
 */
export function getDriveFileUrl(fileId: string): string {
  return `https://drive.google.com/file/d/${fileId}/view`;
}

/**
 * Creates a DriveClient instance
 */
export function createDriveClient(
  serviceAccountEmail?: string,
  serviceAccountPrivateKey?: string
): DriveClient {
  return new DriveClient(serviceAccountEmail, serviceAccountPrivateKey);
}
