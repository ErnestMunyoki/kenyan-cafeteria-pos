FROM ubuntu:22.04

# Install dependencies
RUN apt-get update && apt-get install -y \
    g++ \
    make \
    && rm -rf /var/lib/apt/lists/*

# Set working directory
WORKDIR /app

# Copy source files
COPY . .

# Compile the backend
RUN g++ -std=c++17 -O2 -pthread backend.cpp -o backend

# Expose port
EXPOSE 18080

# Run the backend
CMD ["./backend"]
