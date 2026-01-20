const { calculateAmortization } = require('./server/utils/amortization');

const principal = 5000;
const rate = 0.10;
const months = 5;
const startDate = new Date();

console.log('--- Test Run ---');
const schedule = calculateAmortization(principal, rate, months, startDate, 'monthly', 'Fixed');
const payment = schedule[0].amount;
console.log(`Principal: ${principal}`);
console.log(`Rate: ${rate}`);
console.log(`Months: ${months}`);
console.log(`First Payment Amount: ${payment}`);
console.log('----------------');
