/**
 * ========================================
 * MONEY_BAG BACKEND WORKFLOW DOCUMENTATION
 * ========================================
 * 
 * This document outlines the complete backend architecture and workflow
 * of the MONEY_BAG personal finance management application.
 * 
 * Last Updated: February 2026
 */

/* ========================================
 * 1. TECHNOLOGY STACK
 * ========================================
 * 
 * Core Technologies:
 * - Node.js with Express.js - Backend framework
 * - MongoDB with Mongoose - Database and ODM
 * - Firebase Admin SDK - Authentication
 * - Google Gemini AI - Natural language processing for transactions
 * 
 * Key Dependencies:
 * - express: Web server framework
 * - mongoose: MongoDB object modeling
 * - firebase-admin: User authentication and token verification
 * - @google/generative-ai: Gemini AI integration for smart transaction parsing
 * - multer: File upload handling (receipt images)
 * - pdfkit: PDF generation for reports
 * - json2csv: CSV export functionality
 * - cors: Cross-origin resource sharing
 * - dotenv: Environment variable management
 */

/* ========================================
 * 2. APPLICATION ARCHITECTURE
 * ========================================
 * 
 * Entry Point: index.js
 * - Initializes Express server
 * - Configures middleware (CORS, JSON parsing)
 * - Establishes MongoDB connection
 * - Registers all route handlers
 * - Listens on port 5000 (or environment PORT)
 * 
 * Project Structure:
 * 
 * backend/
 * ├── index.js                    # Main server entry point
 * ├── workflow.js                 # This documentation file
 * ├── package.json               # Dependencies and scripts
 * ├── middleware/
 * │   └── authMiddleware.js      # Firebase authentication verification
 * └── src/
 *     ├── users/                 # User management module
 *     ├── transactions/          # Transaction operations (core feature)
 *     ├── wallet/                # Wallet/balance management
 *     ├── budgets/              # Budget planning and tracking
 *     ├── goals/                # Financial goal setting
 *     ├── debts/                # Debt tracking
 *     ├── recurring/            # Recurring transactions
 *     ├── analytics/            # Reports, exports, and analytics
 *     └── utils/                # Helper utilities
 *         ├── geminiParser.js   # AI transaction parsing
 *         └── walletHelper.js   # Wallet operations helper
 */

/* ========================================
 * 3. AUTHENTICATION FLOW
 * ========================================
 * 
 * Authentication Provider: Firebase Authentication
 * 
 * Flow:
 * 1. Frontend authenticates users via Firebase Client SDK
 * 2. Firebase returns an ID token to the frontend
 * 3. Frontend includes token in Authorization header: "Bearer <token>"
 * 4. Backend middleware (verifyFirebaseToken) validates the token
 * 5. Firebase Admin SDK verifies token authenticity
 * 6. Decoded user info (uid, email, name) attached to req.user
 * 7. Protected routes can access authenticated user data
 * 
 * Middleware Implementation:
 * - Location: middleware/authMiddleware.js
 * - Exports: verifyFirebaseToken
 * - Applied to: All route modules (except public endpoints)
 * - Token Extraction: From "Authorization: Bearer <token>" header
 * - User Context: Attaches { uid, email, name } to request object
 * 
 * Protected Routes:
 * - All /api/users/* routes
 * - All /api/transactions/* routes
 * - All /api/wallet/* routes
 * - All /api/budgets/* routes
 * - All /api/goals/* routes
 * - All /api/debts/* routes
 * - All /api/recurring/* routes
 * - All /api/analytics/* routes
 */

/* ========================================
 * 4. DATABASE ARCHITECTURE
 * ========================================
 * 
 * Database: MongoDB
 * ODM: Mongoose
 * Connection: Established in index.js using MONGO_URI from .env
 * 
 * Data Models:
 * 
 * 1. User Model (users.model.js)
 *    - Stores user profile information
 *    - Links to Firebase UID
 *    - Fields: uid, email, name, createdAt
 * 
 * 2. Transaction Model (transaction.model.js)
 *    - Records all financial transactions
 *    - Fields: userId, type (ADD/SPEND), category, amount, message, createdAt
 *    - Types: ADD (income) or SPEND (expense)
 *    - Categories: food, transport, bills, shopping, entertainment, health, education, other
 * 
 * 3. Wallet Model (wallet.model.js)
 *    - Maintains user's current balance and totals
 *    - Fields: userId, currentBalance, totalIncome, totalExpense
 *    - Updated automatically with each transaction
 * 
 * 4. Budget Model (budget.model.js)
 *    - Budget planning and tracking
 *    - Fields: userId, category, limit, spent, period, isActive
 *    - Supports monthly/weekly budgets per category
 * 
 * 5. Goal Model (goal.model.js)
 *    - Financial goal tracking
 *    - Fields: userId, name, targetAmount, currentAmount, deadline, isCompleted
 * 
 * 6. Debt Model (debt.model.js)
 *    - Debt/loan tracking
 *    - Fields: userId, name, totalAmount, paidAmount, dueDate, status
 * 
 * 7. Recurring Model (recurring.model.js)
 *    - Recurring transactions (subscriptions, bills)
 *    - Fields: userId, name, amount, frequency, nextDate, isActive
 */

/* ========================================
 * 5. CORE MODULE WORKFLOWS
 * ========================================
 */

/* -------------------------------------
 * 5.1 USER MANAGEMENT MODULE
 * ------------------------------------- 
 * Routes: /api/users/*
 * Files: src/users/
 * 
 * Endpoints:
 * - POST /api/users/register
 *   Purpose: Register new user in MongoDB after Firebase auth
 *   Flow:
 *     1. User authenticates with Firebase on frontend
 *     2. Frontend calls /register with Firebase token
 *     3. Token verified via authMiddleware
 *     4. User document created in MongoDB with uid, email, name
 *     5. Returns success with user data
 */

/* -------------------------------------
 * 5.2 TRANSACTION MODULE (Core Feature)
 * ------------------------------------- 
 * Routes: /api/transactions/*
 * Files: src/transactions/
 * 
 * This is the heart of the application. Supports multiple ways to create transactions:
 * 
 * A. Manual Transaction Creation
 *    POST /api/transactions/create
 *    - User provides: type, category, amount, message
 *    - Transaction saved to database
 *    - Wallet balance updated automatically
 * 
 * B. AI-Powered Transaction Parsing (Key Innovation)
 *    POST /api/transactions/parse-ai
 *    Flow:
 *      1. User inputs natural language (e.g., "Spent $50 on pizza at Dominos")
 *      2. Backend sends text to Google Gemini AI
 *      3. Gemini extracts structured data:
 *         - amount: 50
 *         - description: "Pizza at Dominos"
 *         - category: "food"
 *         - type: "expense"
 *      4. Transaction created automatically
 *      5. Wallet balance updated
 *      6. Returns formatted response with emoji
 *    
 *    Supported Phrases:
 *    - "Spent 50 bucks on pizza"
 *    - "Received 1000 salary"
 *    - "Paid 30 for Uber to airport"
 *    - "Got 200 from freelance work"
 * 
 * C. Receipt Image Parsing (Advanced AI Feature)
 *    POST /api/transactions/parse-receipt
 *    - Uses multer for image upload (10MB limit)
 *    - Accepts: jpeg, jpg, png, gif, webp
 *    - Flow:
 *      1. Image uploaded as multipart/form-data
 *      2. Image converted to base64
 *      3. Sent to Gemini Vision AI
 *      4. AI extracts:
 *         - Merchant name
 *         - Items purchased
 *         - Total amount
 *         - Date/time
 *      5. Transaction auto-created
 *      6. Wallet updated
 * 
 * D. Transaction Retrieval
 *    GET /api/transactions
 *    - Returns all transactions for authenticated user
 *    - Sorted by date (newest first)
 *    - Includes wallet balance info
 * 
 * E. Transaction Management
 *    DELETE /api/transactions/clear
 *    - Removes all transactions for user
 *    - Resets wallet to zero
 */

/* -------------------------------------
 * 5.3 WALLET MODULE
 * ------------------------------------- 
 * Routes: /api/wallet/*
 * Files: src/wallet/
 * 
 * Maintains real-time financial balance for users.
 * 
 * Endpoints:
 * 
 * - GET /api/wallet
 *   Returns: currentBalance, totalIncome, totalExpense
 * 
 * - POST /api/wallet/add (Legacy - use transactions instead)
 *   Adds money to wallet
 * 
 * - POST /api/wallet/spend (Legacy - use transactions instead)
 *   Deducts money from wallet
 * 
 * - POST /api/wallet/reset
 *   Resets wallet to zero
 * 
 * Wallet Update Logic:
 * - Automatically updated on every transaction
 * - ADD transaction: currentBalance += amount, totalIncome += amount
 * - SPEND transaction: currentBalance -= amount, totalExpense += amount
 * - Ensures data consistency across the app
 */

/* -------------------------------------
 * 5.4 BUDGET MODULE
 * ------------------------------------- 
 * Routes: /api/budgets/*
 * Files: src/budgets/
 * 
 * Helps users set spending limits per category.
 * 
 * Endpoints:
 * 
 * - POST /api/budgets
 *   Create budget: category, limit, period (monthly/weekly)
 * 
 * - GET /api/budgets
 *   List all budgets for user
 * 
 * - PUT /api/budgets/:id
 *   Update budget limit or period
 * 
 * - DELETE /api/budgets/:id
 *   Remove budget
 * 
 * - PATCH /api/budgets/:id/toggle
 *   Activate/deactivate budget
 * 
 * - GET /api/budgets/status
 *   Returns spending vs. budget for each category
 *   Calculates: spent amount, remaining amount, percentage used
 * 
 * - GET /api/budgets/analytics
 *   Budget performance analytics
 *   Shows over-budget warnings
 * 
 * Features:
 * - Category-based budgeting (food, transport, bills, etc.)
 * - Period support (monthly, weekly, yearly)
 * - Real-time spending tracking
 * - Over-budget alerts
 */

/* -------------------------------------
 * 5.5 FINANCIAL GOALS MODULE
 * ------------------------------------- 
 * Routes: /api/goals/*
 * Files: src/goals/
 * 
 * Helps users set and track savings goals.
 * 
 * Endpoints:
 * 
 * - POST /api/goals
 *   Create goal: name, targetAmount, currentAmount, deadline
 * 
 * - GET /api/goals
 *   List all goals with progress
 * 
 * - PUT /api/goals/:id
 *   Update goal details or add progress
 * 
 * - DELETE /api/goals/:id
 *   Remove goal
 * 
 * - PATCH /api/goals/:id/complete
 *   Mark goal as completed
 * 
 * Features:
 * - Target amount tracking
 * - Progress percentage calculation
 * - Deadline monitoring
 * - Completion status
 */

/* -------------------------------------
 * 5.6 DEBT TRACKING MODULE
 * ------------------------------------- 
 * Routes: /api/debts/*
 * Files: src/debts/
 * 
 * Tracks loans and debts owed or lent.
 * 
 * Endpoints:
 * 
 * - POST /api/debts
 *   Create debt: name, totalAmount, paidAmount, dueDate
 * 
 * - GET /api/debts
 *   List all debts with remaining balance
 * 
 * - PUT /api/debts/:id
 *   Update payment progress
 * 
 * - DELETE /api/debts/:id
 *   Remove debt record
 * 
 * - PATCH /api/debts/:id/pay
 *   Record partial payment
 * 
 * Features:
 * - Total debt calculation
 * - Payment tracking
 * - Due date reminders
 * - Status: pending, partial, paid
 */

/* -------------------------------------
 * 5.7 RECURRING TRANSACTIONS MODULE
 * ------------------------------------- 
 * Routes: /api/recurring/*
 * Files: src/recurring/
 * 
 * Manages subscriptions and recurring bills.
 * 
 * Endpoints:
 * 
 * - POST /api/recurring
 *   Create recurring transaction: name, amount, frequency, nextDate
 * 
 * - GET /api/recurring
 *   List all recurring items
 * 
 * - PUT /api/recurring/:id
 *   Update recurring transaction details
 * 
 * - DELETE /api/recurring/:id
 *   Remove recurring transaction
 * 
 * - PATCH /api/recurring/:id/toggle
 *   Activate/deactivate recurring item
 * 
 * Features:
 * - Frequency options: daily, weekly, monthly, yearly
 * - Next due date calculation
 * - Auto-renewal tracking
 * - Total monthly subscription cost
 */

/* -------------------------------------
 * 5.8 ANALYTICS & REPORTING MODULE
 * ------------------------------------- 
 * Routes: /api/analytics/*
 * Files: src/analytics/
 * 
 * Provides insights and export capabilities.
 * 
 * Endpoints:
 * 
 * - GET /api/analytics
 *   Returns comprehensive analytics:
 *   - Total income vs. expenses
 *   - Category-wise breakdown
 *   - Monthly trends
 *   - Top spending categories
 *   - Average transaction amounts
 * 
 * - GET /api/analytics/export/csv
 *   Exports all transactions as CSV file
 *   Uses json2csv library
 *   Returns downloadable file
 * 
 * - GET /api/analytics/export/pdf
 *   Generates PDF report of transactions
 *   Uses pdfkit library
 *   Includes summary and detailed list
 * 
 * - GET /api/analytics/heatmap
 *   Returns spending patterns by day/hour
 *   Used for visual heatmap on frontend
 * 
 * Features:
 * - Date range filtering
 * - Category filtering
 * - Multiple export formats
 * - Visual data preparation
 */

/* ========================================
 * 6. AI INTEGRATION (Gemini AI)
 * ========================================
 * 
 * File: src/utils/geminiParser.js
 * Model: gemini-2.5-flash
 * 
 * The application leverages Google's Gemini AI for two main purposes:
 * 
 * A. Natural Language Transaction Parsing
 *    Function: parseTransactionText(text)
 *    
 *    Purpose: Convert human language to structured transaction data
 *    
 *    Prompt Engineering:
 *    - Instructs AI to return strict JSON format
 *    - Specifies exact fields: amount, description, category, type
 *    - Provides category constraints (food, transport, etc.)
 *    - Includes context clues for type detection
 *    - Gives examples for few-shot learning
 *    
 *    Input Examples:
 *    - "Spent 50 bucks on pizza at Dominos"
 *    - "Got 1000 salary today"
 *    - "Paid electricity bill 150"
 *    
 *    Output Format:
 *    {
 *      amount: number,
 *      description: string,
 *      category: string | null,
 *      type: "expense" | "income"
 *    }
 *    
 *    Error Handling:
 *    - Validates AI response format
 *    - Checks for required fields
 *    - Falls back to manual parsing if AI fails
 *    - Logs errors for debugging
 * 
 * B. Receipt Image Parsing (OCR + AI)
 *    Function: parseReceiptImage(imageBuffer)
 *    
 *    Purpose: Extract transaction data from receipt photos
 *    
 *    Process:
 *    1. Convert image buffer to base64
 *    2. Send to Gemini Vision model
 *    3. AI performs OCR and data extraction
 *    4. Returns structured transaction data
 *    
 *    Extractable Data:
 *    - Merchant/store name
 *    - Purchase items
 *    - Individual item prices
 *    - Total amount
 *    - Date and time
 *    - Payment method
 *    
 *    Supported Formats:
 *    - JPEG, PNG, GIF, WebP
 *    - Max size: 10MB
 * 
 * C. Fancy Message Generation
 *    Function: fancyMessage(transactionData)
 *    
 *    Purpose: Generate friendly confirmation messages
 *    
 *    Features:
 *    - Adds emoji based on transaction type/category
 *    - Creates encouraging messages for savings
 *    - Friendly warnings for large expenses
 *    - Contextual responses
 *    
 *    Example Output:
 *    "🍕 Logged $50 on Pizza at Dominos! Enjoy your meal!"
 *    "💰 Great! Added $1000 from Salary payment to your wallet!"
 */

/* ========================================
 * 7. DATA FLOW EXAMPLES
 * ========================================
 */

/* -------------------------------------
 * Example 1: AI Transaction Creation
 * ------------------------------------- 
 * 
 * User Action: Types "Spent $75 on dinner at Olive Garden"
 * 
 * Step-by-Step Flow:
 * 
 * 1. Frontend Request:
 *    POST /api/transactions/parse-ai
 *    Headers: { Authorization: "Bearer <firebase-token>" }
 *    Body: { text: "Spent $75 on dinner at Olive Garden" }
 * 
 * 2. Authentication:
 *    - authMiddleware intercepts request
 *    - Verifies Firebase token
 *    - Extracts user: { uid, email, name }
 *    - Attaches to req.user
 * 
 * 3. AI Processing:
 *    - parseTransactionText() called with input text
 *    - Gemini AI analyzes the text
 *    - Returns:
 *      {
 *        amount: 75,
 *        description: "Dinner at Olive Garden",
 *        category: "food",
 *        type: "expense"
 *      }
 * 
 * 4. Transaction Creation:
 *    - New Transaction document created:
 *      {
 *        userId: req.user.uid,
 *        type: "SPEND",
 *        category: "food",
 *        amount: 75,
 *        message: "Dinner at Olive Garden",
 *        createdAt: new Date()
 *      }
 *    - Saved to MongoDB
 * 
 * 5. Wallet Update:
 *    - Fetch user's wallet
 *    - Update: currentBalance -= 75
 *    - Update: totalExpense += 75
 *    - Save wallet
 * 
 * 6. Response Generation:
 *    - fancyMessage() generates friendly response
 *    - Returns:
 *      {
 *        success: true,
 *        message: "🍽️ Logged $75 on Dinner at Olive Garden!",
 *        transaction: {...},
 *        wallet: { currentBalance, totalIncome, totalExpense }
 *      }
 * 
 * 7. Frontend Update:
 *    - Receives response
 *    - Updates UI with new transaction
 *    - Updates wallet balance display
 *    - Shows success message
 */

/* -------------------------------------
 * Example 2: Budget Status Check
 * ------------------------------------- 
 * 
 * User Action: Views budget page
 * 
 * Step-by-Step Flow:
 * 
 * 1. Frontend Request:
 *    GET /api/budgets/status
 *    Headers: { Authorization: "Bearer <firebase-token>" }
 * 
 * 2. Authentication:
 *    - Token verified
 *    - User identified: uid
 * 
 * 3. Data Aggregation:
 *    - Fetch all active budgets for user
 *    - For each budget category:
 *      a. Query transactions in current period (e.g., this month)
 *      b. Sum SPEND transactions for that category
 *      c. Calculate: remaining = budget.limit - spent
 *      d. Calculate: percentage = (spent / limit) * 100
 * 
 * 4. Status Determination:
 *    - if percentage < 70: "safe"
 *    - if 70 <= percentage < 90: "warning"
 *    - if percentage >= 90: "danger"
 *    - if percentage >= 100: "exceeded"
 * 
 * 5. Response:
 *    {
 *      budgets: [
 *        {
 *          category: "food",
 *          limit: 500,
 *          spent: 375,
 *          remaining: 125,
 *          percentage: 75,
 *          status: "warning"
 *        },
 *        // ... other categories
 *      ]
 *    }
 * 
 * 6. Frontend Display:
 *    - Shows progress bars per category
 *    - Color-codes based on status
 *    - Alerts user if over budget
 */

/* -------------------------------------
 * Example 3: Analytics Export (PDF)
 * ------------------------------------- 
 * 
 * User Action: Clicks "Export as PDF"
 * 
 * Step-by-Step Flow:
 * 
 * 1. Frontend Request:
 *    GET /api/analytics/export/pdf
 *    Headers: { Authorization: "Bearer <firebase-token>" }
 *    Query: ?startDate=2026-01-01&endDate=2026-01-31
 * 
 * 2. Authentication & Authorization:
 *    - Token verified
 *    - User identified
 * 
 * 3. Data Collection:
 *    - Fetch transactions in date range
 *    - Calculate totals and statistics
 *    - Group by category
 * 
 * 4. PDF Generation (using pdfkit):
 *    - Create new PDF document
 *    - Add header: "Financial Report - January 2026"
 *    - Add summary section:
 *      * Total Income
 *      * Total Expenses
 *      * Net Balance
 *    - Add category breakdown chart
 *    - Add detailed transaction table
 *    - Add footer with generation date
 * 
 * 5. Response:
 *    - Set headers: Content-Type: application/pdf
 *    - Set filename: transactions-jan-2026.pdf
 *    - Stream PDF buffer to response
 * 
 * 6. Frontend Handling:
 *    - Browser receives PDF
 *    - Triggers download
 *    - User can save or print
 */

/* ========================================
 * 8. ERROR HANDLING STRATEGY
 * ========================================
 * 
 * The backend implements comprehensive error handling:
 * 
 * A. Authentication Errors:
 *    - 401 Unauthorized: Missing or invalid token
 *    - 403 Forbidden: Token valid but insufficient permissions
 * 
 * B. Validation Errors:
 *    - 400 Bad Request: Missing required fields
 *    - 400 Bad Request: Invalid data format
 *    - 400 Bad Request: Business rule violation (e.g., insufficient balance)
 * 
 * C. Resource Errors:
 *    - 404 Not Found: Requested resource doesn't exist
 *    - 409 Conflict: Duplicate resource
 * 
 * D. Server Errors:
 *    - 500 Internal Server Error: Unexpected errors
 *    - Logged to console for debugging
 *    - Generic message sent to client (security)
 * 
 * E. AI Errors:
 *    - Gemini API failures handled gracefully
 *    - Fallback to manual input if AI unavailable
 *    - Clear error messages to user
 * 
 * F. Database Errors:
 *    - Connection failures logged
 *    - Retry logic for transient errors
 *    - Transaction rollback where applicable
 */

/* ========================================
 * 9. SECURITY MEASURES
 * ========================================
 * 
 * A. Authentication:
 *    - Firebase token verification on every request
 *    - No password storage (handled by Firebase)
 *    - Token expiration enforced
 * 
 * B. Authorization:
 *    - Users can only access their own data
 *    - userId from authenticated token used for queries
 *    - No cross-user data access possible
 * 
 * C. Input Validation:
 *    - All inputs sanitized
 *    - Type checking on amounts
 *    - Category whitelisting
 *    - File upload restrictions (type, size)
 * 
 * D. CORS Configuration:
 *    - Only allowed origins: localhost:5173, localhost:5174
 *    - Credentials enabled for secure cookie handling
 * 
 * E. Environment Variables:
 *    - Sensitive data in .env file
 *    - API keys never exposed in code
 *    - Database credentials secured
 * 
 * F. Rate Limiting:
 *    - (Recommended for production)
 *    - Prevent API abuse
 *    - Protect against DDoS
 */

/* ========================================
 * 10. PERFORMANCE OPTIMIZATIONS
 * ========================================
 * 
 * A. Database Indexing:
 *    - userId indexed in all models for fast queries
 *    - createdAt indexed for date-based queries
 *    - Category indexed for analytics
 * 
 * B. Query Optimization:
 *    - Lean queries where full documents not needed
 *    - Projection to fetch only required fields
 *    - Aggregation pipelines for analytics
 * 
 * C. Caching Strategy:
 *    - Wallet balance cached in separate model
 *    - Reduces need to aggregate transactions
 *    - Invalidated on each transaction
 * 
 * D. Pagination:
 *    - (Recommended for large transaction lists)
 *    - Limit and skip parameters
 *    - Cursor-based pagination for efficiency
 * 
 * E. Image Processing:
 *    - Memory storage for uploaded images
 *    - Immediate processing and cleanup
 *    - No disk I/O bottleneck
 */

/* ========================================
 * 11. ENVIRONMENT CONFIGURATION
 * ========================================
 * 
 * Required .env Variables:
 * 
 * # Database
 * DB_URL=mongodb://localhost:27017/moneybag
 * # or MongoDB Atlas connection string
 * 
 * # Server
 * PORT=5000
 * 
 * # Firebase
 * FIREBASE_PROJECT_ID=your-project-id
 * FIREBASE_PRIVATE_KEY=your-private-key
 * FIREBASE_CLIENT_EMAIL=your-client-email
 * 
 * # Google AI
 * GEMINI_API_KEY=your-gemini-api-key
 * 
 * # Environment
 * NODE_ENV=development
 */

/* ========================================
 * 12. API ENDPOINT SUMMARY
 * ========================================
 * 
 * Base URL: http://localhost:5000/api
 * 
 * Authentication: All routes require Firebase token in header
 * Header Format: Authorization: Bearer <firebase-id-token>
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │ USER ROUTES                                              │
 * ├─────────────────────────────────────────────────────────┤
 * │ POST   /users/register       Register new user          │
 * └─────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │ TRANSACTION ROUTES                                       │
 * ├─────────────────────────────────────────────────────────┤
 * │ POST   /transactions/create       Manual transaction    │
 * │ POST   /transactions/parse-ai     AI text parsing       │
 * │ POST   /transactions/parse-receipt AI receipt OCR       │
 * │ GET    /transactions              Get all transactions  │
 * │ DELETE /transactions/clear        Clear all             │
 * └─────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │ WALLET ROUTES                                            │
 * ├─────────────────────────────────────────────────────────┤
 * │ GET    /wallet                    Get wallet info       │
 * │ POST   /wallet/add                Add money             │
 * │ POST   /wallet/spend              Spend money           │
 * │ POST   /wallet/reset              Reset wallet          │
 * └─────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │ BUDGET ROUTES                                            │
 * ├─────────────────────────────────────────────────────────┤
 * │ POST   /budgets                   Create budget         │
 * │ GET    /budgets                   List budgets          │
 * │ PUT    /budgets/:id               Update budget         │
 * │ DELETE /budgets/:id               Delete budget         │
 * │ PATCH  /budgets/:id/toggle        Toggle active         │
 * │ GET    /budgets/status            Budget vs spending    │
 * │ GET    /budgets/analytics         Budget analytics      │
 * └─────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │ GOAL ROUTES                                              │
 * ├─────────────────────────────────────────────────────────┤
 * │ POST   /goals                     Create goal           │
 * │ GET    /goals                     List goals            │
 * │ PUT    /goals/:id                 Update goal           │
 * │ DELETE /goals/:id                 Delete goal           │
 * │ PATCH  /goals/:id/complete        Mark complete         │
 * └─────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │ DEBT ROUTES                                              │
 * ├─────────────────────────────────────────────────────────┤
 * │ POST   /debts                     Create debt           │
 * │ GET    /debts                     List debts            │
 * │ PUT    /debts/:id                 Update debt           │
 * │ DELETE /debts/:id                 Delete debt           │
 * │ PATCH  /debts/:id/pay             Record payment        │
 * └─────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │ RECURRING ROUTES                                         │
 * ├─────────────────────────────────────────────────────────┤
 * │ POST   /recurring                 Create recurring      │
 * │ GET    /recurring                 List recurring        │
 * │ PUT    /recurring/:id             Update recurring      │
 * │ DELETE /recurring/:id             Delete recurring      │
 * │ PATCH  /recurring/:id/toggle      Toggle active         │
 * └─────────────────────────────────────────────────────────┘
 * 
 * ┌─────────────────────────────────────────────────────────┐
 * │ ANALYTICS ROUTES                                         │
 * ├─────────────────────────────────────────────────────────┤
 * │ GET    /analytics                 Get analytics         │
 * │ GET    /analytics/export/csv      Export CSV            │
 * │ GET    /analytics/export/pdf      Export PDF            │
 * │ GET    /analytics/heatmap         Spending heatmap      │
 * └─────────────────────────────────────────────────────────┘
 */

/* ========================================
 * 13. DEVELOPMENT & DEPLOYMENT
 * ========================================
 * 
 * Development Setup:
 * 1. Clone repository
 * 2. cd backend
 * 3. npm install
 * 4. Create .env file with required variables
 * 5. Setup MongoDB (local or Atlas)
 * 6. Setup Firebase project
 * 7. Get Gemini API key from Google AI Studio
 * 8. npm run start:dev (uses nodemon for hot reload)
 * 
 * Production Deployment:
 * 1. Set NODE_ENV=production
 * 2. Use production MongoDB cluster
 * 3. Configure production Firebase credentials
 * 4. Set appropriate CORS origins
 * 5. Enable rate limiting
 * 6. Setup logging (Winston, Morgan)
 * 7. Use PM2 or Docker for process management
 * 8. npm start
 * 
 * Testing:
 * - Manual testing with Postman/Thunder Client
 * - Frontend integration testing
 * - (Recommended: Add Jest/Mocha unit tests)
 */

/* ========================================
 * 14. FUTURE ENHANCEMENTS
 * ========================================
 * 
 * Potential Features:
 * - Real-time notifications (Socket.io)
 * - Automated recurring transaction creation (Cron jobs)
 * - Bank account integration (Plaid API)
 * - Multi-currency support
 * - Collaborative budgets (family/shared accounts)
 * - Investment tracking
 * - Tax calculation and reporting
 * - Bill payment reminders
 * - Spending insights and recommendations (more AI)
 * - Mobile app API extensions
 * - GraphQL API option
 * - Microservices architecture for scale
 */

/* ========================================
 * 15. SUPPORT & MAINTENANCE
 * ========================================
 * 
 * Monitoring:
 * - Log all errors to file or service
 * - Monitor API response times
 * - Track AI API usage and costs
 * - Database performance monitoring
 * 
 * Backup Strategy:
 * - Automated MongoDB backups
 * - User data export functionality
 * - Disaster recovery plan
 * 
 * Updates:
 * - Keep dependencies updated
 * - Monitor for security vulnerabilities
 * - Stay updated with Firebase SDK changes
 * - Test Gemini AI model updates
 * 
 * Documentation:
 * - Keep API documentation updated
 * - Document new features
 * - Maintain changelog
 * - Update this workflow document
 */

/**
 * ========================================
 * END OF WORKFLOW DOCUMENTATION
 * ========================================
 * 
 * This document provides a comprehensive overview of the MONEY_BAG
 * backend architecture, workflows, and implementation details.
 * 
 * For specific implementation details, refer to individual module files.
 * For API usage examples, refer to the frontend integration code.
 * 
 * Last Updated: February 9, 2026
 * Maintained by: Development Team
 * ========================================
 */

module.exports = {
  // This file is primarily for documentation
  // Export constants or configurations if needed in the future
  
  API_VERSION: '1.0',
  SUPPORTED_CATEGORIES: [
    'food',
    'transport', 
    'bills',
    'shopping',
    'entertainment',
    'health',
    'education',
    'other'
  ],
  TRANSACTION_TYPES: {
    INCOME: 'ADD',
    EXPENSE: 'SPEND'
  }
};
