import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v2 as cloudinary, UploadApiResponse } from 'cloudinary';
import { Readable } from 'stream';

@Injectable()
export class CloudinaryService {
  constructor(private config: ConfigService) {
    cloudinary.config({
      cloud_name: this.config.get('CLOUDINARY_CLOUD_NAME'),
      api_key: this.config.get('CLOUDINARY_API_KEY'),
      api_secret: this.config.get('CLOUDINARY_API_SECRET'),
    });
  }

  async upload(
    file: Express.Multer.File,
    folder: string,
    allowedMimes: string[],
  ): Promise<UploadApiResponse> {
    if (!allowedMimes.includes(file.mimetype)) {
      throw new BadRequestException(`Invalid file type: ${file.mimetype}`);
    }
    return new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder, resource_type: 'auto', access_mode: 'public' },
        (err, result) => (err ? reject(err) : resolve(result)),
      );
      Readable.from(file.buffer).pipe(stream);
    });
  }

  async delete(publicId: string): Promise<void> {
    if (!publicId) return;
    // Try raw first (PDFs/docs), fall back to image
    await cloudinary.uploader
      .destroy(publicId, { resource_type: 'raw' })
      .catch(() => cloudinary.uploader.destroy(publicId, { resource_type: 'image' }));
  }
}
