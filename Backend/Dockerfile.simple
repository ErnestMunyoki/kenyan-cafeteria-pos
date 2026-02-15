FROM ubuntu:22.04

# Install runtime dependencies only
RUN apt-get update && apt-get install -y \
    libboost-system1.74.0 \
    libboost-thread1.74.0 \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy pre-compiled binary and data files
COPY backend .
COPY inventory.json .
COPY sales_history.json .
COPY end_of_day_report_*.txt .

# Expose port
EXPOSE 18080

# Make binary executable and run it
RUN chmod +x backend
CMD ["./backend"]
