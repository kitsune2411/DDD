const { ZodError } = require("zod");
const AppError = require("../../core/AppError");
const Logger = require("../logging/Logger"); // Winston Logger

// Helper: Handle Zod Validation Errors
const handleZodError = (err) => {
  const errors = err.errors.map((el) => ({
    field: el.path.join("."),
    message: el.message,
  }));
  const message = `Validation Error: ${errors.map((e) => e.message).join(", ")}`;
  return new AppError(message, 400, errors);
};

// Helper: Handle JSON Syntax Error (e.g., bad JSON body)
const handleSyntaxError = () => {
  return new AppError("Invalid JSON format in request body", 400);
};

// Helper: Handle JWT Errors
const handleJWTError = () => new AppError("Invalid token. Please log in again!", 401);
const handleJWTExpiredError = () => new AppError("Your token has expired! Please log in again.", 401);

// Helper: Handle MySQL/Knex Errors (Optional but useful)
const handleDatabaseError = (err) => {
  // Code 1062 = Duplicate Entry
  if (err.code === "ER_DUP_ENTRY") {
    const match = err.sqlMessage.match(/for key '(.+?)'/);
    const field = match ? match[1] : "field";
    return new AppError(`Duplicate value for unique field: ${field}`, 409);
  }
  return new AppError("Database Error", 500);
};

// --- RESPONSE FORMATTERS ---

const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    success: false,
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack, // Show stack trace in Dev
  });
};

const sendErrorProd = (err, res) => {
  // A. Operational, trusted error: send message to client
  if (err.isOperational) {
    res.status(err.statusCode).json({
      success: false,
      status: err.status,
      message: err.message,
      details: err.details || null,
    });
  }
  // B. Programming or other unknown error: don't leak details
  else {
    // 1. Log error to console/file
    Logger.error("ERROR 💥", err);

    // 2. Send generic message
    res.status(500).json({
      success: false,
      status: "error",
      message: "Something went wrong on the server",
    });
  }
};

// --- MAIN MIDDLEWARE ---

module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || "error";

  // Log the error immediately
  Logger.error(`${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);

  if (process.env.NODE_ENV === "development") {
    sendErrorDev(err, res);
  } else {
    // In production, we transform library errors into our AppError
    let error = { ...err };
    error.message = err.message;
    error.name = err.name; // Copy name specifically

    if (error.name === "ZodError") error = handleZodError(error);
    if (error.name === "SyntaxError") error = handleSyntaxError();
    if (error.name === "JsonWebTokenError") error = handleJWTError();
    if (error.name === "TokenExpiredError") error = handleJWTExpiredError();

    // Check for MySQL Errors (usually have 'code' property)
    if (err.code && err.code.startsWith("ER_")) error = handleDatabaseError(err);

    sendErrorProd(error, res);
  }
};
