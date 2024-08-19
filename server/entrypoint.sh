#!/bin/sh

# Debug environment variables
echo "S3_ENDPOINT: $S3_ENDPOINT"
echo "S3_BUCKET_NAME: $S3_BUCKET_NAME"

# Update /etc/hosts to resolve MinIO and bucket subdomain
MINIO_IP=$(getent hosts minio | awk '{ print $1 }')
if [ -n "$MINIO_IP" ]; then
  echo "$MINIO_IP myminioserver" >> /etc/hosts
  echo "$MINIO_IP $S3_BUCKET_NAME.myminioserver" >> /etc/hosts
fi

# Run PocketBase migrations
echo "Running PocketBase migrations..."
./pocketbase migrate up

# Start Litestream replication
echo "Starting Litestream replication..."
litestream replicate -config ./etc/litestream.yml &

# Start PocketBase server
echo "Starting PocketBase server..."
# TODO: remove / parametrize `--dev` before production.
./pocketbase serve --http=0.0.0.0:8080 --dev