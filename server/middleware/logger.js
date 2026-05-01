/**
 * Custom Request Logger Middleware
 * Logs: timestamp, method, URL, status code, and response time
 * Color-coded output for quick visual scanning
 */

const logger = (req, res, next) => {
    const start = Date.now();

    // Capture the original end method
    const originalEnd = res.end;

    res.end = function (...args) {
        const duration = Date.now() - start;
        const timestamp = new Date().toISOString();
        const status = res.statusCode;

        // Color codes for terminal output
        const colors = {
            green: '\x1b[32m',
            yellow: '\x1b[33m',
            red: '\x1b[31m',
            cyan: '\x1b[36m',
            reset: '\x1b[0m',
            dim: '\x1b[2m',
        };

        // Pick color based on status code
        let statusColor = colors.green;
        if (status >= 400) statusColor = colors.yellow;
        if (status >= 500) statusColor = colors.red;

        console.log(
            `${colors.dim}[${timestamp}]${colors.reset} ` +
            `${colors.cyan}${req.method}${colors.reset} ` +
            `${req.originalUrl} ` +
            `${statusColor}${status}${colors.reset} ` +
            `${colors.dim}${duration}ms${colors.reset}`
        );

        originalEnd.apply(res, args);
    };

    next();
};

module.exports = logger;
