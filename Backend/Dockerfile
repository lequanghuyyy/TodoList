# Stage 1: Build stage
FROM maven:3.9-eclipse-temurin-21 AS build
WORKDIR /app

# Copy pom.xml first to download dependencies and utilize Docker layer caching
COPY pom.xml .
RUN mvn dependency:go-offline

# Copy the rest of the source code
COPY src/ ./src/

# Package the application without running tests (tests are assumed to run in CI)
RUN mvn clean package -DskipTests

# Stage 2: Runtime stage
FROM eclipse-temurin:21-jre-alpine
WORKDIR /app

# Install curl for HEALTHCHECK since Alpine doesn't have it by default
RUN apk add --no-cache curl

# Create a non-root user and group.
RUN addgroup -S spring && adduser -S spring -G spring

# Copy the built artifact from the build stage. 
# We copy it as app.jar to the working directory.
COPY --from=build /app/target/todoapp-*.jar app.jar

# Change ownership of the jar file to the non-root user
RUN chown spring:spring app.jar

# Switch to the non-root user
USER spring:spring

EXPOSE 8080

# Configure HEALTHCHECK to check the Spring Boot Actuator health endpoint
HEALTHCHECK --interval=30s --timeout=3s --start-period=30s --retries=3 \
  CMD curl -f http://localhost:8080/actuator/health || exit 1

# Define the entrypoint to start the Spring Boot application
ENTRYPOINT ["java", "-jar", "app.jar"]
