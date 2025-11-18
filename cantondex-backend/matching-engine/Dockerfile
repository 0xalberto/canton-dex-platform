# Multi-stage build for Rust Matching Engine
FROM rust:latest as builder

WORKDIR /app

# Copy manifest files
COPY Cargo.toml Cargo.lock* ./

# Create dummy main to cache dependencies
RUN mkdir -p src && \
    echo "fn main() {}" > src/main.rs && \
    cargo build --release && \
    rm -rf src

# Copy source code
COPY . .

# Build the application
RUN cargo build --release

# Final stage
FROM debian:bookworm-slim

WORKDIR /app

# Install runtime dependencies
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Copy binary from builder
COPY --from=builder /app/target/release/matching-engine /usr/local/bin/matching-engine

# Create non-root user
RUN useradd -m -u 1000 appuser
USER appuser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=5s --retries=3 \
    CMD /usr/local/bin/matching-engine --health || exit 1

# Expose port
EXPOSE 50051

# Run application
ENTRYPOINT ["matching-engine"]
