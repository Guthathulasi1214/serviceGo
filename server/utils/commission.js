/**
 * Calculate platform commission (10% of total amount).
 * @param {number} amount - Total booking amount
 * @returns {number} Commission rounded to 2 decimal places
 */
const calculateCommission = (amount) => {
    return Math.round(amount * 0.1 * 100) / 100;
};

module.exports = { calculateCommission };
