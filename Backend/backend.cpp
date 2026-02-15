#include "crow_all.h"
#include <fstream>
#include <map>
#include <string>
#include <vector>
#include <set>
#include <chrono>
#include <iomanip>
#include <sstream>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

struct Item {
    std::string name;
    double price;
    int stock;
    int reorderThreshold;
    std::string category;
};

struct SaleRecord {
    std::string timestamp;
    std::map<std::string, int> items;
    double total;
    std::string table;
};

std::map<std::string, Item> inventory;
std::vector<SaleRecord> salesHistory;
double dailyTotal = 0.0;
std::string currentDateString;

// Helper functions
std::string getCurrentDate();
std::string getCurrentTimestamp();
void loadInventory();
void saveInventory();
void loadSalesHistory();
void saveSalesHistory();
void checkAndResetDailyTotal();

std::string getCurrentDate() {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::localtime(&time_t), "%Y-%m-%d");
    return ss.str();
}

std::string getCurrentTimestamp() {
    auto now = std::chrono::system_clock::now();
    auto time_t = std::chrono::system_clock::to_time_t(now);
    std::stringstream ss;
    ss << std::put_time(std::localtime(&time_t), "%Y-%m-%d %H:%M:%S");
    return ss.str();
}

void loadInventory() {
    std::ifstream f("inventory.json");
    if (!f.is_open()) {
        // Create default inventory if file doesn't exist
        inventory = {
            {"Rice Plate", {"Rice Plate", 150.0, 80, 10, "main"}},
            {"Chapati", {"Chapati", 30.0, 200, 20, "main"}},
            {"Beans Stew", {"Beans Stew", 100.0, 60, 10, "main"}},
            {"Chicken Curry", {"Chicken Curry", 250.0, 40, 5, "main"}},
            {"Fruit Salad", {"Fruit Salad", 80.0, 50, 5, "dessert"}},
            {"Coffee", {"Coffee", 40.0, 150, 15, "beverage"}},
            {"Juice", {"Juice", 80.0, 100, 10, "beverage"}},
            {"Water Bottle", {"Water Bottle", 30.0, 300, 30, "beverage"}}
        };
        saveInventory();
        return;
    }
    
    try {
        json data;
        f >> data;
        for (auto& el : data.items()) {
            auto obj = el.value();
            inventory[el.key()] = {
                el.key(),
                obj["price"],
                obj["stock"],
                obj["threshold"],
                obj.value("category", "uncategorized")
            };
        }
    } catch (const std::exception& e) {
        std::cerr << "Error parsing inventory.json: " << e.what() << std::endl;
    }
}

void saveInventory() {
    json data;
    for (auto& [name, item] : inventory) {
        data[name] = {
            {"price", item.price},
            {"stock", item.stock},
            {"threshold", item.reorderThreshold},
            {"category", item.category}
        };
    }
    std::ofstream f("inventory.json");
    f << data.dump(4);
}

void loadSalesHistory() {
    std::ifstream f("sales_history.json");
    if (!f.is_open()) return;
    
    try {
        json data;
        f >> data;
        for (auto& record : data) {
            SaleRecord sale;
            sale.timestamp = record["timestamp"];
            sale.total = record["total"];
            sale.table = record.value("table", "N/A");
            
            for (auto& item : record["items"].items()) {
                sale.items[item.key()] = item.value();
            }
            salesHistory.push_back(sale);
        }
    } catch (const std::exception& e) {
        std::cerr << "Error parsing sales_history.json: " << e.what() << std::endl;
    }
}

void saveSalesHistory() {
    json data = json::array();
    for (auto& sale : salesHistory) {
        json record;
        record["timestamp"] = sale.timestamp;
        record["total"] = sale.total;
        record["table"] = sale.table;
        
        json items;
        for (auto& [name, qty] : sale.items) {
            items[name] = qty;
        }
        record["items"] = items;
        data.push_back(record);
    }
    
    std::ofstream f("sales_history.json");
    f << data.dump(4);
}

void checkAndResetDailyTotal() {
    std::string today = getCurrentDate();
    if (currentDateString != today) {
        // Save yesterday's report
        if (!currentDateString.empty()) {
            std::ofstream report("daily_reports_" + currentDateString + ".txt");
            report << "Daily Report for " << currentDateString << "\n";
            report << "=====================================\n\n";
            report << "Total Sales: Ksh " << std::fixed << std::setprecision(2) << dailyTotal << "\n\n";
            
            report << "Sales Summary:\n";
            for (auto& sale : salesHistory) {
                if (sale.timestamp.find(currentDateString) != std::string::npos) {
                    report << "Time: " << sale.timestamp << "\n";
                    report << "Table: " << sale.table << "\n";
                    report << "Total: Ksh " << std::fixed << std::setprecision(2) << sale.total << "\n";
                    report << "Items: ";
                    for (auto& [name, qty] : sale.items) {
                        report << name << " x" << qty << " ";
                    }
                    report << "\n\n";
                }
            }
            report.close();
        }
        
        // Reset for new day
        currentDateString = today;
        dailyTotal = 0.0;
    }
}

// Helper to add CORS headers
crow::response corsResponse(const std::string& body = "", int code = 200) {
    crow::response res{code, body};
    res.add_header("Access-Control-Allow-Origin", "*");
    res.add_header("Access-Control-Allow-Methods", "*");
    res.add_header("Access-Control-Allow-Headers", "*");
    res.add_header("Access-Control-Max-Age", "86400");
    res.add_header("Access-Control-Allow-Credentials", "false");
    res.add_header("Content-Type", "application/json");
    return res;
}

// Global CORS middleware function
void addCorsHeaders(crow::response& res, const std::string& origin = "") {
    res.add_header("Access-Control-Allow-Origin", "*");
    res.add_header("Access-Control-Allow-Methods", "*");
    res.add_header("Access-Control-Allow-Headers", "*");
    res.add_header("Access-Control-Max-Age", "86400");
    res.add_header("Access-Control-Allow-Credentials", "false");
}

crow::response corsResponseJson(const json& data, int code = 200) {
    return corsResponse(data.dump(), code);
}

// Error handling helper
crow::response errorResponse(const std::string& message, int code = 400) {
    json error = {{"error", message}, {"status", "error"}};
    return corsResponseJson(error, code);
}

int main() {
    crow::SimpleApp app;
    
    // Initialize data
    loadInventory();
    loadSalesHistory();
    currentDateString = getCurrentDate();

    // Debug endpoint to test deployment
    CROW_ROUTE(app, "/debug")
    ([](const crow::request& req){
        json debug = {
            {"message", "Backend is deployed and working!"},
            {"timestamp", getCurrentTimestamp()},
            {"origin", req.get_header_value("Origin")},
            {"method", req.method},
            {"version", "1.0"}
        };
        return corsResponseJson(debug);
    });

    // OPTIONS handler for /items
    CROW_ROUTE(app, "/items").methods("OPTIONS"_method)
    ([](const crow::request& req){ 
        std::string origin = req.get_header_value("Origin");
        crow::response res;
        addCorsHeaders(res, origin);
        res.code = 204;
        return res;
    });

    // GET items with enhanced information
    CROW_ROUTE(app, "/items")
    ([](){
        checkAndResetDailyTotal();
        
        json data;
        json categories = json::array();
        std::set<std::string> categorySet;
        
        for (auto& [name, item] : inventory) {
            data[name] = json::object({
                {"price", item.price},
                {"stock", item.stock},
                {"threshold", item.reorderThreshold},
                {"category", item.category},
                {"available", item.stock > 0}
            });
            categorySet.insert(item.category);
        }
        
        for (const auto& cat : categorySet) {
            categories.push_back(cat);
        }
        
        json response = {
            {"items", data},
            {"categories", categories},
            {"totalItems", inventory.size()}
        };
        
        return corsResponseJson(response);
    });

    // OPTIONS handler for /sale - MUST come before POST
    CROW_ROUTE(app, "/sale").methods("OPTIONS"_method)
    ([](const crow::request& req){
        crow::response res;
        res.code = 204;
        res.add_header("Access-Control-Allow-Origin", "*");
        res.add_header("Access-Control-Allow-Methods", "*");
        res.add_header("Access-Control-Allow-Headers", "*");
        res.add_header("Access-Control-Max-Age", "86400");
        return res;
    });

    // POST sale with enhanced validation and tracking
    CROW_ROUTE(app, "/sale").methods("POST"_method)
    ([](const crow::request& req){
        try {
            checkAndResetDailyTotal();
            
            auto body = json::parse(req.body);
            
            if (!body.contains("item") || !body.contains("qty")) {
                return errorResponse("Missing required fields: item and qty");
            }
            
            std::string itemName = body["item"];
            int qty = body["qty"];
            
            if (itemName.empty()) {
                return errorResponse("Item name cannot be empty");
            }
            
            if (qty <= 0) {
                return errorResponse("Quantity must be greater than 0");
            }
            
            if (inventory.find(itemName) == inventory.end()) {
                return errorResponse("Item not found: " + itemName);
            }
            
            if (inventory[itemName].stock < qty) {
                return errorResponse("Insufficient stock for " + itemName + ". Available: " + 
                                   std::to_string(inventory[itemName].stock));
            }
            
            // Process sale
            double saleAmount = inventory[itemName].price * qty;
            inventory[itemName].stock -= qty;
            dailyTotal += saleAmount;
            
            // Record sale
            SaleRecord record;
            record.timestamp = getCurrentTimestamp();
            record.table = body.value("table", "N/A");
            record.items[itemName] = qty;
            record.total = saleAmount;
            salesHistory.push_back(record);
            
            saveInventory();
            saveSalesHistory();
            
            json res = {
                {"status", "success"},
                {"message", "Sale processed successfully"},
                {"item", itemName},
                {"quantity", qty},
                {"amount", saleAmount},
                {"remaining", inventory[itemName].stock},
                {"timestamp", record.timestamp}
            };
            
            // Check for low stock alert
            if (inventory[itemName].stock <= inventory[itemName].reorderThreshold) {
                res["alert"] = "⚠️ Low stock alert: " + itemName + " needs reordering!";
                res["alertLevel"] = "warning";
            }
            
            if (inventory[itemName].stock == 0) {
                res["alert"] = "❌ Out of stock: " + itemName;
                res["alertLevel"] = "error";
            }
            
            return corsResponseJson(res);
            
        } catch (const json::exception& e) {
            return errorResponse("Invalid JSON format: " + std::string(e.what()));
        } catch (const std::exception& e) {
            return errorResponse("Internal server error: " + std::string(e.what()));
        }
    });

    // GET daily totals with enhanced statistics
    CROW_ROUTE(app, "/dailyTotals")
    ([](){
        checkAndResetDailyTotal();
        
        int todaySales = 0;
        double todayRevenue = 0.0;
        std::map<std::string, int> popularItems;
        
        for (auto& sale : salesHistory) {
            if (sale.timestamp.find(currentDateString) != std::string::npos) {
                todaySales++;
                todayRevenue += sale.total;
                
                for (auto& [name, qty] : sale.items) {
                    popularItems[name] += qty;
                }
            }
        }
        
        // Find most popular item
        std::string mostPopular = "None";
        int maxQty = 0;
        for (auto& [name, qty] : popularItems) {
            if (qty > maxQty) {
                maxQty = qty;
                mostPopular = name;
            }
        }
        
        json res = {
            {"dailyTotal", dailyTotal},
            {"todayRevenue", todayRevenue},
            {"todaySales", todaySales},
            {"date", currentDateString},
            {"mostPopularItem", mostPopular},
            {"mostPopularQuantity", maxQty},
            {"averageSale", todaySales > 0 ? todayRevenue / todaySales : 0.0}
        };
        
        return corsResponseJson(res);
    });

    // GET sales history
    CROW_ROUTE(app, "/salesHistory")
    ([](){
        json response = {
            {"sales", json::array()},
            {"totalSales", salesHistory.size()}
        };
        
        for (auto& sale : salesHistory) {
            json saleJson = {
                {"timestamp", sale.timestamp},
                {"total", sale.total},
                {"table", sale.table},
                {"items", json::object()}
            };
            
            for (auto& [name, qty] : sale.items) {
                saleJson["items"][name] = qty;
            }
            
            response["sales"].push_back(saleJson);
        }
        
        return corsResponseJson(response);
    });

    // GET stock report
    CROW_ROUTE(app, "/stockReport")
    ([](){
        json report = {
            {"totalItems", inventory.size()},
            {"lowStockItems", json::array()},
            {"outOfStockItems", json::array()},
            {"stockLevels", json::object()}
        };
        
        for (auto& [name, item] : inventory) {
            report["stockLevels"][name] = {
                {"stock", item.stock},
                {"threshold", item.reorderThreshold},
                {"category", item.category},
                "status", item.stock == 0 ? "out_of_stock" : 
                         item.stock <= item.reorderThreshold ? "low_stock" : "in_stock"
            };
            
            if (item.stock == 0) {
                report["outOfStockItems"].push_back(name);
            } else if (item.stock <= item.reorderThreshold) {
                report["lowStockItems"].push_back(json{
                    {"name", name},
                    {"stock", item.stock},
                    {"threshold", item.reorderThreshold}
                });
            }
        }
        
        return corsResponseJson(report);
    });

    // GET export report
    CROW_ROUTE(app, "/exportReport")
    ([](){
        try {
            checkAndResetDailyTotal();
            
            std::string filename = "end_of_day_report_" + currentDateString + ".txt";
            std::ofstream report(filename);
            
            report << "CAFETERIA POS - END OF DAY REPORT\n";
            report << "=====================================\n\n";
            report << "Date: " << currentDateString << "\n";
            report << "Generated: " << getCurrentTimestamp() << "\n\n";
            
            report << "SALES SUMMARY\n";
            report << "-------------\n";
            report << "Total Revenue: Ksh " << std::fixed << std::setprecision(2) << dailyTotal << "\n";
            
            int todaySales = 0;
            for (auto& sale : salesHistory) {
                if (sale.timestamp.find(currentDateString) != std::string::npos) {
                    todaySales++;
                }
            }
            report << "Total Transactions: " << todaySales << "\n";
            report << "Average Transaction: Ksh " << (todaySales > 0 ? dailyTotal / todaySales : 0.0) << "\n\n";
            
            report << "INVENTORY STATUS\n";
            report << "----------------\n";
            for (auto& [name, item] : inventory) {
                report << name << ": " << item.stock << " units";
                if (item.stock <= item.reorderThreshold) {
                    report << " ⚠️ LOW STOCK";
                }
                if (item.stock == 0) {
                    report << " ❌ OUT OF STOCK";
                }
                report << "\n";
            }
            
            report << "\nDETAILED SALES\n";
            report << "--------------\n";
            for (auto& sale : salesHistory) {
                if (sale.timestamp.find(currentDateString) != std::string::npos) {
                    report << "\nTime: " << sale.timestamp << "\n";
                    report << "Table: " << sale.table << "\n";
                    report << "Total: Ksh " << std::fixed << std::setprecision(2) << sale.total << "\n";
                    report << "Items: ";
                    for (auto& [name, qty] : sale.items) {
                        report << name << " x" << qty << " ";
                    }
                    report << "\n";
                }
            }
            
            report.close();
            
            json response = {
                {"status", "success"},
                {"message", "Report exported successfully"},
                {"filename", filename},
                {"path", filename}
            };
            
            return corsResponseJson(response);
            
        } catch (const std::exception& e) {
            return errorResponse("Error generating report: " + std::string(e.what()), 500);
        }
    });

    // Health check endpoint
    CROW_ROUTE(app, "/health")
    ([](){
        json status = {
            {"status", "healthy"},
            {"timestamp", getCurrentTimestamp()},
            {"uptime", "running"},
            {"version", "2.0.0"}
        };
        return corsResponseJson(status);
    });

    std::cout << "🍽️ Cafeteria POS Server Starting..." << std::endl;
    std::cout << "📊 Server running on http://127.0.0.1:18080" << std::endl;
    std::cout << "📅 Current date: " << currentDateString << std::endl;
    std::cout << "📦 Inventory loaded: " << inventory.size() << " items" << std::endl;
    
    app.port(18080).multithreaded().run();
}
