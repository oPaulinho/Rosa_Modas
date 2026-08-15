# Stage 1: Build the application using Maven
FROM maven:3.9.6-eclipse-temurin-17-alpine AS build
WORKDIR /app

# Copy the pom.xml file to download dependencies first (this utilizes Docker cache)
COPY rosa_modas_backend/pom.xml .
RUN mvn dependency:go-offline -B

# Copy the source code and compile the application
COPY rosa_modas_backend/src ./src
RUN mvn package -DskipTests -B

# Stage 2: Create the final lightweight runtime image
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copy the compiled JAR file from the builder stage
COPY --from=build /app/target/*.jar app.jar

# Create the uploads folder to avoid file-saving issues
RUN mkdir -p /app/uploads

# Expose port 8080 (default for Spring Boot)
EXPOSE 8080

# Execute the application
ENTRYPOINT ["java", "-jar", "app.jar"]
