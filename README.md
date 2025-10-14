# CRM Assessment - NestJS Application

## Description

A comprehensive Customer Relationship Management (CRM) system built with NestJS and MongoDB. This application manages customers, jobs, invoices, and payments with a modular architecture and full test coverage.

## Features

- **Modular Architecture**: Clean separation of concerns with dedicated modules
- **MongoDB Integration**: Robust data persistence with Mongoose ODM
- **RESTful APIs**: Complete CRUD operations for all entities
- **Swagger Documentation**: Interactive API documentation
- **Comprehensive Testing**: Unit tests for all services and controllers
- **Validation**: Input validation using class-validator
- **Error Handling**: Custom exception handling with proper HTTP status codes

## System Modules

### 🧑‍💼 User Module
- Manages technicians and system users
- Technician assignment for job appointments

### 👥 Customer Module
- Customer management
- Contact information and address
- Unique email and phone validation

### 🔧 Job Module
- Job creation and lifecycle management
- Status transitions (NEW → SCHEDULED → IN_PROGRESS → DONE → INVOICED → PAID)
- Appointment scheduling with technician availability checks

### 🧾 Invoice Module
- Invoice generation for completed jobs
- Automatic tax and total calculations
- Unique invoice numbering system

### 💳 Payment Module
- Payment processing for invoices
- Multiple payment methods (card, bank, cash)
- Transaction management with rollback support

## Technology Stack

- **Framework**: NestJS
- **Database**: MongoDB with Mongoose
- **API Documentation**: Swagger/OpenAPI
- **Testing**: Jest with NestJS testing utilities
- **Validation**: class-validator & class-transformer

## Installation

```bash
# Install dependencies
$ npm install

# Set up environment variables
# Create .env file with your MongoDB connection string
MONGODB_URI=mongodb+srv://username:password@nodeexpressproject.xg9wrtp.mongodb.net/projectname?retryWrites=true&w=majority

```

## Running the Application

```bash
# Development mode
$ npm run start

# Watch mode (auto-restart on changes)
$ npm run start:dev
```

## API Documentation

Once the application is running, access the Swagger documentation at:
```
http://localhost:3000/api
```

![Swagger Documentation](https://via.placeholder.com/800x400/4A90E2/FFFFFF?text=Swagger+API+Documentation)
*Interactive API documentation available at /api endpoint*

## Testing

```bash
# Run all unit tests
$ npm test

# Run tests for specific service
$ npm test -- customer.service.spec.ts

# Run tests in watch mode
$ npm test -- --watch

# Test coverage report
$ npm run test:cov

# End-to-end tests
$ npm run test:e2e
```

## Project Structure

```
src/
├── customer/           # Customer management
├── job/               # Job lifecycle management
├── invoice/           # Invoice generation
├── payment/           # Payment processing
├── user/              # User/technician management
└── shared/            # Common utilities and types
```

## Key Features

### Business Logic
- **Customer Uniqueness**: Ensures no duplicate email or phone numbers
- **Job Status Flow**: Strict status transition validation
- **Appointment Scheduling**: Technician availability checking
- **Invoice Generation**: Automatic calculations with tax support
- **Payment Validation**: Amount matching and transaction safety

### Error Handling
- Custom exceptions for business rule violations
- Proper HTTP status codes for all responses
- Detailed error messages for client feedback

### Data Validation
- Input validation using DTOs with class-validator
- MongoDB ObjectId validation
- Business rule enforcement at service level

## API Endpoints

### Customers
- `POST /customer` - Create new customer
- `GET /customer` - List customers (paginated)
- `GET /customer/:id` - Get customer by ID

### Jobs
- `POST /jobs` - Create new job
- `GET /jobs` - List jobs (filterable by status)
- `GET /jobs/:id` - Get job by ID
- `PATCH /jobs/:id/status` - Update job status
- `POST /jobs/:id/schedule-appointment` - Schedule appointment
- `POST /jobs/:jobId/invoice` - Create invoice for job

### Invoices
- `GET /invoice` - List invoices (paginated)
- `GET /invoice/:id` - Get invoice by ID
- `POST /invoice/:id/payment` - Process payment for invoice

### Payments
- `POST /payments/:invoiceId` - Create payment
- `GET /payments` - List payments (paginated)
- `GET /payments/:id` - Get payment by ID

## Testing Strategy

- **Unit Tests**: All services and controllers
- **Mocking**: Comprehensive mock setup for MongoDB models
- **Error Scenarios**: Testing all exception cases
- **Business Logic**: Validation of all business rules
- **Transaction Testing**: Proper rollback scenarios

## Development Approach

The application follows NestJS best practices with:
- Dependency injection for loose coupling
- Modular architecture for scalability
- Repository pattern for data access
- Service layer for business logic
- Controller layer for HTTP handling
- Comprehensive test coverage

## Support

For issues and questions, please check the NestJS documentation or create an issue in the project repository.

## License

This project is [MIT licensed](LICENSE).