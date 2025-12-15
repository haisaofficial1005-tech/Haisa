/**
 * Google Drive Client
 * Requirements: 3.4, 5.4
 */

import { getGoogleConfig } from '../config/google.config';

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
   * Gets or refreshes access token
   * Note: In production, implement proper JWT signing for service account
   */
  private async getAccessToken(): Promise<string> {
    if (this.accessToken && this.tokenExpiry && this.tokenExpiry > new Date()) {
      return this.accessToken;
    }

    // TODO: Implement proper service account JWT authentication
    // For now, this is a placeholder that would need the googleapis library
    // or manual JWT signing implementation
    
    // In production:
    // 1. Create JWT with service account email and private key
    // 2. Exchange JWT for access token
    // 3. Cache token until expiry
    
    throw new Error('Service account authentication not implemented. Use googleapis library in production.');
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
