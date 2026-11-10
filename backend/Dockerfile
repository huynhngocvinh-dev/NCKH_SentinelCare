# 1. Dùng OpenJDK image phù hợp với phiên bản Java của dự án
FROM eclipse-temurin:17-jdk-alpine

# 2. Tạo thư mục làm việc bên trong container
WORKDIR /app

# 3. Copy file .jar đã build ở Bước 1 vào container
COPY target/*.jar app.jar

# 4. Mở cổng mà Spring Boot đang chạy
EXPOSE 8080

# 5. Lệnh thực thi để khởi chạy ứng dụng khi container bắt đầu
ENTRYPOINT ["java", "-jar", "app.jar"]