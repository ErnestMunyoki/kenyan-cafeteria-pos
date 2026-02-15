FROM ubuntu:22.04

# Install build and runtime dependencies
RUN apt-get update && apt-get install -y \
    g++ \
    make \
    libboost-all-dev \
    nlohmann-json3-dev \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy source files
COPY backend.cpp .
COPY crow_all.h .
COPY inventory.json .
COPY sales_history.json .
COPY end_of_day_report_*.txt .

# Compile backend in container
RUN g++ -std=c++17 -O2 -pthread backend.cpp -o backend

# Expose port
EXPOSE 18080

# Run the backend
CMD ["./backend"]
