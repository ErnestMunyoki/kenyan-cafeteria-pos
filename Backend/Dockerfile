FROM ubuntu:22.04

RUN apt-get update && apt-get install -y \
    g++ \
    make \
    libboost-all-dev \
    nlohmann-json3-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY backend.cpp .
COPY crow_all.h .
COPY inventory.json .
COPY sales_history.json .
COPY end_of_day_report_*.txt .

RUN g++ -std=c++17 -O2 -pthread backend.cpp -o backend

EXPOSE 18080

CMD ["./backend"]
