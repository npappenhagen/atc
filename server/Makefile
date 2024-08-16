APP_NAME = "pocketbase-litestream"
DOCKER_IMAGE = $(APP_NAME)-image

# Build the Docker image
.PHONY: build
build:
	docker build -t $(DOCKER_IMAGE) .

# Run the Docker container locally
.PHONY: dev
dev:
	docker-compose up --build

# Set secrets on Fly.io securely
.PHONY: set-secrets
set-secrets:
	flyctl secrets set AWS_ACCESS_KEY_ID=$(AWS_ACCESS_KEY_ID) AWS_SECRET_ACCESS_KEY=$(AWS_SECRET_ACCESS_KEY) S3_BUCKET_NAME=$(S3_BUCKET_NAME)

# Deploy to Fly.io
.PHONY: deploy
deploy: build
	flyctl deploy --image $(DOCKER_IMAGE)