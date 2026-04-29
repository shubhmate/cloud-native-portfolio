// =============================================================================
// LocalStack Initialization — automation/localstack-init.js
// =============================================================================
// Run this ONCE after starting LocalStack to create and configure the S3 bucket.
//
// Usage: npm run localstack:init
// =============================================================================

'use strict';

require('dotenv').config({ path: '.env.deploy' });

const {
    S3Client,
    CreateBucketCommand,
    PutBucketWebsiteCommand,
    PutBucketPolicyCommand,
    HeadBucketCommand,
} = require('@aws-sdk/client-s3');

const BUCKET     = process.env.S3_BUCKET || 'shubhammate-portfolio';
const LS_ENDPOINT = 'http://localhost:4566';

const s3 = new S3Client({
    region         : 'us-east-1',
    endpoint       : LS_ENDPOINT,
    credentials    : { accessKeyId: 'test', secretAccessKey: 'test' },
    forcePathStyle : true,
});

function ok(msg)  { console.log(`  ✔ ${msg}`); }
function err(msg) { console.error(`  ✖ ${msg}`); }

async function bucketExists() {
    try {
        await s3.send(new HeadBucketCommand({ Bucket: BUCKET }));
        return true;
    } catch {
        return false;
    }
}

async function init() {
    console.log('\n🔧 Initializing LocalStack S3 bucket...');
    console.log(`   Endpoint : ${LS_ENDPOINT}`);
    console.log(`   Bucket   : ${BUCKET}\n`);

    // Check if LocalStack is running
    try {
        const exists = await bucketExists();

        if (exists) {
            ok(`Bucket "${BUCKET}" already exists — skipping creation`);
        } else {
            // Create bucket
            await s3.send(new CreateBucketCommand({ Bucket: BUCKET }));
            ok(`Bucket created: ${BUCKET}`);
        }

        // Configure static website hosting
        await s3.send(new PutBucketWebsiteCommand({
            Bucket              : BUCKET,
            WebsiteConfiguration: {
                IndexDocument: { Suffix: 'index.html' },
                ErrorDocument: { Key   : 'index.html' },
            }
        }));
        ok('Static website hosting enabled');

        // Set public read policy
        await s3.send(new PutBucketPolicyCommand({
            Bucket: BUCKET,
            Policy: JSON.stringify({
                Version  : '2012-10-17',
                Statement: [{
                    Sid      : 'PublicReadGetObject',
                    Effect   : 'Allow',
                    Principal: '*',
                    Action   : 's3:GetObject',
                    Resource : `arn:aws:s3:::${BUCKET}/*`
                }]
            })
        }));
        ok('Public read policy applied');

        console.log('\n' + '═'.repeat(50));
        console.log('  ✅ LocalStack Ready!');
        console.log('═'.repeat(50));
        console.log(`  Bucket  : ${BUCKET}`);
        console.log(`  Endpoint: ${LS_ENDPOINT}`);
        console.log(`\n  Next: npm run deploy:localstack`);
        console.log('═'.repeat(50) + '\n');

    } catch (e) {
        if (e.code === 'ECONNREFUSED' || e.message?.includes('ECONNREFUSED')) {
            err('Cannot connect to LocalStack!');
            err('Make sure LocalStack is running: npm run localstack:start');
        } else {
            err(`Init failed: ${e.message}`);
            console.error(e);
        }
        process.exit(1);
    }
}

init();
