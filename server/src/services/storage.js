/**
 * Storage abstraction layer.
 * Set STORAGE_PROVIDER env var to switch providers with no code changes:
 *
 *   cloudinary  — Cloudinary CDN (current, free 25GB)
 *   s3          — AWS S3 + CloudFront (install @aws-sdk/client-s3, set AWS_* vars)
 *   b2          — Backblaze B2 (S3-compatible, install @aws-sdk/client-s3, set B2_* vars)
 *   local       — Local disk (dev/fallback, ephemeral on Railway)
 */

const path = require('path')
const fs = require('fs')
const { Readable } = require('stream')

const PROVIDER = process.env.STORAGE_PROVIDER || (
  process.env.CLOUDINARY_CLOUD_NAME ? 'cloudinary' : 'local'
)

async function uploadImage(buffer, originalname, mimetype) {
  switch (PROVIDER) {
    case 'cloudinary': return cloudinaryUpload(buffer, originalname)
    case 's3':         return s3Upload(buffer, originalname, mimetype)
    case 'b2':         return b2Upload(buffer, originalname, mimetype)
    case 'local':      return localUpload(buffer, originalname)
    default: throw new Error(`Unknown STORAGE_PROVIDER: "${PROVIDER}". Valid: cloudinary, s3, b2, local`)
  }
}

// ── Cloudinary ────────────────────────────────────────────────────────────────
async function cloudinaryUpload(buffer, originalname) {
  const cloudinary = require('cloudinary').v2
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key:    process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  })
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'hoova/listings',
        transformation: [{ width: 1200, height: 900, crop: 'limit', quality: 'auto:good', fetch_format: 'auto' }],
        public_id: `${Date.now()}-${originalname.replace(/[^a-zA-Z0-9]/g, '_')}`,
      },
      (err, result) => err ? reject(err) : resolve(result.secure_url)
    )
    Readable.from(buffer).pipe(stream)
  })
}

// ── AWS S3 + CloudFront ───────────────────────────────────────────────────────
// To activate: npm install @aws-sdk/client-s3 in server/, then set:
//   STORAGE_PROVIDER=s3
//   AWS_REGION, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
//   AWS_S3_BUCKET
//   AWS_CLOUDFRONT_URL  (optional, for CDN delivery)
async function s3Upload(buffer, originalname, mimetype) {
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
  const client = new S3Client({ region: process.env.AWS_REGION || 'us-east-1' })
  const key = `listings/${Date.now()}-${originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`
  await client.send(new PutObjectCommand({
    Bucket: process.env.AWS_S3_BUCKET,
    Key: key,
    Body: buffer,
    ContentType: mimetype,
  }))
  const base = process.env.AWS_CLOUDFRONT_URL
    || `https://${process.env.AWS_S3_BUCKET}.s3.${process.env.AWS_REGION || 'us-east-1'}.amazonaws.com`
  return `${base}/${key}`
}

// ── Backblaze B2 (S3-compatible) ─────────────────────────────────────────────
// To activate: npm install @aws-sdk/client-s3 in server/, then set:
//   STORAGE_PROVIDER=b2
//   B2_ENDPOINT   (e.g. https://s3.us-west-004.backblazeb2.com)
//   B2_REGION     (e.g. us-west-004)
//   B2_KEY_ID, B2_APP_KEY
//   B2_BUCKET
//   B2_CDN_URL    (optional, use Cloudflare in front for free CDN)
async function b2Upload(buffer, originalname, mimetype) {
  const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3')
  const client = new S3Client({
    endpoint: process.env.B2_ENDPOINT,
    region: process.env.B2_REGION || 'us-west-004',
    credentials: { accessKeyId: process.env.B2_KEY_ID, secretAccessKey: process.env.B2_APP_KEY },
  })
  const key = `listings/${Date.now()}-${originalname.replace(/[^a-zA-Z0-9.]/g, '_')}`
  await client.send(new PutObjectCommand({ Bucket: process.env.B2_BUCKET, Key: key, Body: buffer, ContentType: mimetype }))
  const base = process.env.B2_CDN_URL || `${process.env.B2_ENDPOINT}/${process.env.B2_BUCKET}`
  return `${base}/${key}`
}

// ── Local disk (dev / fallback) ───────────────────────────────────────────────
async function localUpload(buffer, originalname) {
  const uploadDir = path.join(__dirname, '../../../uploads')
  if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true })
  const ext = path.extname(originalname)
  const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}${ext}`
  fs.writeFileSync(path.join(uploadDir, filename), buffer)
  const base = process.env.SITE_URL || `http://localhost:${process.env.PORT || 3001}`
  return `${base}/uploads/${filename}`
}

module.exports = { uploadImage, PROVIDER }
