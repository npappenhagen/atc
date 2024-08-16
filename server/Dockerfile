# Stage 1: Build PocketBase
FROM golang:1.22.5-alpine as builder

WORKDIR /pb

COPY go.mod ./
COPY go.sum ./
RUN go mod download

COPY ./ ./

RUN GOOS=linux go build -o /pb/pocketbase

# Stage 2: Final Image with Litestream
FROM alpine:3.20

WORKDIR /pb

RUN apk add --no-cache curl \
    && curl -LO https://github.com/benbjohnson/litestream/releases/download/v0.3.13/litestream-v0.3.13-linux-amd64.tar.gz \
    && tar -xzf litestream-v0.3.13-linux-amd64.tar.gz \
    && mv litestream /usr/local/bin/ \
    && rm litestream-v0.3.13-linux-amd64.tar.gz \
    && apk del curl

COPY --from=builder /pb/pocketbase ./pocketbase
COPY ./entrypoint.sh ./entrypoint.sh
COPY ./etc/litestream.yml ./etc/litestream.yml

RUN chmod +x entrypoint.sh

EXPOSE 8080

CMD ["./entrypoint.sh"]