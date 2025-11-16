# Build stage
FROM rust:1.74-slim as builder

WORKDIR /app

# Install build dependencies
RUN apt-get update && apt-get install -y \
    pkg-config \
    libssl-dev \
    && rm -rf /var/lib/apt/lists/*

# Copy Cargo files
COPY matching-engine/Cargo.toml Cargo.lock ./

# Copy source code
COPY matching-engine/src ./src

# Build the application
RUN cargo build --release

# Runtime stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y \
    ca-certificates \
    libssl3 \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user
RUN useradd -m -u 1000 cantondex

# Copy binary from builder
COPY --from=builder /app/target/release/matching-engine /app/matching-engine
COPY --chown=cantondex:cantondex matching-engine/config /app/config

USER cantondex

# Expose port
EXPOSE 50051

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD grpcurl -plaintext localhost:50051 health.v1.Health/Check || exit 1

# Run application
CMD ["/app/matching-engine"]
