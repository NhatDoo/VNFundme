import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { Client } from 'minio';

const publicReadPolicy = (bucket: string) =>
  JSON.stringify({
    Version: '2012-10-17',
    Statement: [
      {
        Effect: 'Allow',
        Principal: { AWS: ['*'] },
        Action: ['s3:GetObject'],
        Resource: [`arn:aws:s3:::${bucket}/*`],
      },
    ],
  });

@Injectable()
export class StorageService {
  private readonly bucket = process.env.MINIO_BUCKET ?? 'image';
  private readonly endpoint = process.env.MINIO_ENDPOINT ?? 'localhost';
  private readonly port = Number(process.env.MINIO_PORT ?? '9000');
  private readonly useSSL = process.env.MINIO_USE_SSL === 'true';
  private readonly client = new Client({
    endPoint: this.endpoint,
    port: this.port,
    useSSL: this.useSSL,
    accessKey: process.env.MINIO_ACCESS_KEY ?? 'minioadmin',
    secretKey: process.env.MINIO_SECRET_KEY ?? 'minioadmin',
  });
  private bucketReady = false;

  async uploadCampaignImage(
    objectName: string,
    file: Express.Multer.File,
  ): Promise<void> {
    if (!file.mimetype.startsWith('image/')) {
      throw new BadRequestException('Only image files are allowed');
    }

    await this.ensurePublicBucket();
    try {
      await this.client.putObject(this.bucket, objectName, file.buffer, file.size, {
        'Content-Type': file.mimetype,
      });
    } catch {
      throw new InternalServerErrorException('Could not upload campaign image');
    }
  }

  async uploadImages(
    files: Express.Multer.File[],
    objectNames: string[],
  ): Promise<void> {
    if (files.length !== objectNames.length) {
      throw new BadRequestException('Files and object names count mismatch');
    }

    await this.ensurePublicBucket();

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const objectName = objectNames[i];

      if (!file.mimetype.startsWith('image/')) {
        throw new BadRequestException('Only image files are allowed');
      }

      try {
        await this.client.putObject(this.bucket, objectName, file.buffer, file.size, {
          'Content-Type': file.mimetype,
        });
      } catch {
        throw new InternalServerErrorException('Could not upload campaign image');
      }
    }
  }

  async deleteImage(objectName: string): Promise<void> {
    await this.ensurePublicBucket();
    try {
      await this.client.removeObject(this.bucket, objectName);
    } catch {
      throw new InternalServerErrorException('Could not remove campaign image');
    }
  }

  async deleteImages(objectNames: string[]): Promise<void> {
    await this.ensurePublicBucket();
    for (const objectName of objectNames) {
      try {
        await this.client.removeObject(this.bucket, objectName);
      } catch {
        // Continue deleting other images even if one fails
      }
    }
  }

  publicUrl(objectName: string): string {
    const configuredUrl = process.env.MINIO_PUBLIC_URL;
    const origin = (configuredUrl ?? `${this.useSSL ? 'https' : 'http'}://${this.endpoint}:${this.port}`).replace(/\/$/, '');
    const encodedObjectName = objectName.split('/').map(encodeURIComponent).join('/');
    return `${origin}/${this.bucket}/${encodedObjectName}`;
  }

  private async ensurePublicBucket(): Promise<void> {
    if (this.bucketReady) return;

    try {
      if (!(await this.client.bucketExists(this.bucket))) {
        await this.client.makeBucket(this.bucket);
      }
      await this.client.setBucketPolicy(this.bucket, publicReadPolicy(this.bucket));
      this.bucketReady = true;
    } catch {
      throw new InternalServerErrorException('Could not connect to image storage');
    }
  }
}