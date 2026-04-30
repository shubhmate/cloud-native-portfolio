// =============================================================================
// Universal Deploy Script — scripts/deploy.js
// =============================================================================
// Supports both real AWS and LocalStack (local AWS simulator).
//
// Usage:
//   DEPLOY_TARGET=aws         node scripts/deploy.js  → real AWS
//   DEPLOY_TARGET=localstack  node scripts/deploy.js  → LocalStack
//
// Or via npm scripts:
//   npm run deploy:aws
//   npm run deploy:localstack
// =============================================================================

'use strict';

require('dotenv').config({ path: '.env.deploy' });

const { S3Client, PutObjectCommand, ListObjectsV2Command, DeleteObjectsCommand } = require('@aws-sdk/client-s3');
const { CloudFrontClient, CreateInvalidationCommand } = require('@aws-sdk/client-cloudfront');
const { execSync } = require('child_process');
const path   = require('path');
const fs     = require('fs');
const mime   = require('mime-types');

// ─── Config ──────────────────────────────────────────────────────────────────

const TARGET     = process.env.DEPLOY_TARGET || 'aws';
const IS_LOCAL   = TARGET === 'localstack';
const REGION     = process.env.AWS_REGION    || 'us-east-1';
const BUCKET     = process.env.S3_BUCKET     || 'shubhammate-portfolio';
const CF_DIST_ID = process.env.CF_DIST_ID    || '';
const MINIO_ENDPOINT = 'http://localhost:9000';
const DIST_DIR   = path.join(__dirname, '../dist');

// ─── AWS Client Config ────────────────────────────────────────────────────────

const clientConfig = {
    region: REGION,
    ...(IS_LOCAL && {
        endpoint       : MINIO_ENDPOINT,
        credentials    : { accessKeyId: 'test', secretAccessKey: 'testpassword' },
        forcePathStyle : true,   // required for MinIO S3 API
    })
};

const s3 = new S3Client(clientConfig);
const cf = IS_LOCAL ? null : new CloudFrontClient({ region: REGION });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function log(msg)  { console.log(`  ${msg}`); }
function ok(msg)   { console.log(`  ✔ ${msg}`); }
function err(msg)  { console.error(`  ✖ ${msg}`); }
function head(msg) { console.log(`\n${'─'.repeat(50)}\n  ${msg}\n${'─'.repeat(50)}`); }

function getAllFiles(dir, base = dir) {
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    return entries.flatMap(e => {
        const full = path.join(dir, e.name);
        return e.isDirectory() ? getAllFiles(full, base) : [full];
    });
}

// ─── Step 1: Build ───────────────────────────────────────────────────────────

async function build() {
    head('Step 1/4 — Building...');
    try {
        execSync('npm run build', { stdio: 'inherit', cwd: path.join(__dirname, '..') });
        ok('Build complete');
    } catch (e) {
        err('Build failed — aborting deploy');
        process.exit(1);
    }
}

// ─── Step 2: Clear existing S3 objects ───────────────────────────────────────

async function clearBucket() {
    head('Step 2/4 — Clearing old files from S3...');
    try {
        const listed = await s3.send(new ListObjectsV2Command({ Bucket: BUCKET }));
        if (listed.Contents && listed.Contents.length > 0) {
            const objects = listed.Contents.map(o => ({ Key: o.Key }));
            await s3.send(new DeleteObjectsCommand({
                Bucket: BUCKET,
                Delete: { Objects: objects }
            }));
            ok(`Deleted ${objects.length} existing object(s)`);
        } else {
            ok('Bucket already empty');
        }
    } catch (e) {
        err(`Failed to clear bucket: ${e.message}`);
        throw e;
    }
}

// ─── Step 3: Upload dist/ to S3 ──────────────────────────────────────────────

async function upload() {
    head('Step 3/4 — Uploading dist/ to S3...');
    const files  = getAllFiles(DIST_DIR);
    let uploaded = 0;

    for (const file of files) {
        const key         = file.replace(DIST_DIR + path.sep, '').replace(/\\/g, '/');
        const contentType = mime.lookup(file) || 'application/octet-stream';
        const body        = fs.readFileSync(file);

        // Cache control: HTML = no-cache, assets = 1 year
        const isHtml    = contentType === 'text/html';
        const cacheCtrl = isHtml
            ? 'no-cache, no-store, must-revalidate'
            : 'public, max-age=31536000, immutable';

        await s3.send(new PutObjectCommand({
            Bucket       : BUCKET,
            Key          : key,
            Body         : body,
            ContentType  : contentType,
            CacheControl : cacheCtrl,
        }));

        log(`↑ ${key} (${contentType})`);
        uploaded++;
    }

    ok(`Uploaded ${uploaded} file(s) to s3://${BUCKET}`);
}

// ─── Step 4: Invalidate CloudFront (real AWS only) ───────────────────────────

async function invalidateCloudFront() {
    head('Step 4/4 — Invalidating CloudFront cache...');

    if (IS_LOCAL) {
        ok('LocalStack mode — skipping CloudFront invalidation');
        return;
    }

    if (!CF_DIST_ID) {
        log('CF_DIST_ID not set — skipping invalidation');
        log('Set CF_DIST_ID in .env.deploy after Terraform provisions CloudFront');
        return;
    }

    const res = await cf.send(new CreateInvalidationCommand({
        DistributionId    : CF_DIST_ID,
        InvalidationBatch : {
            CallerReference : `deploy-${Date.now()}`,
            Paths           : { Quantity: 1, Items: ['/*'] }
        }
    }));

    ok(`Invalidation created: ${res.Invalidation.Id}`);
    ok('Cache cleared — changes live globally in ~30s');
}

// ─── Summary ─────────────────────────────────────────────────────────────────

function summary() {
    console.log('\n' + '═'.repeat(50));
    console.log('  🚀 DEPLOY COMPLETE');
    console.log('═'.repeat(50));

    if (IS_LOCAL) {
        console.log(`  Target  : MinIO (local S3)`);
        console.log(`  Bucket  : ${BUCKET}`);
        console.log(`  URL     : ${MINIO_ENDPOINT}/${BUCKET}/index.html`);
        console.log(`  Console : http://localhost:9001  (user: test / pass: testpassword)`);
    } else {
        console.log(`  Target  : AWS S3 + CloudFront`);
        console.log(`  Bucket  : s3://${BUCKET}`);
        console.log(`  Domain  : https://shubhammate.com`);
        if (CF_DIST_ID) console.log(`  CDN     : invalidation triggered`);
    }

    console.log('═'.repeat(50) + '\n');
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
    console.log('\n🚀 Starting Deploy Pipeline...');
    console.log(`   Target: ${IS_LOCAL ? 'MinIO (local AWS simulator)' : 'AWS'}`);
    console.log(`   Bucket: ${BUCKET}`);
    console.log(`   Region: ${REGION}\n`);

    try {
        await build();
        await clearBucket();
        await upload();
        await invalidateCloudFront();
        summary();
    } catch (e) {
        err(`Deploy failed: ${e.message}`);
        console.error(e);
        process.exit(1);
    }
}

main();
