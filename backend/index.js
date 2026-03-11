require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const mongoose = require('mongoose');
const cors = require('cors')
const cron = require('node-cron');
const { processDueRecurring } = require('./src/recurring/recurring');


//middleware
app.use(express.json());
app.use(cors(
  {
    origin: ['http://localhost:5173', 'http://localhost:5174'],
    credentials: true
  }
))


// app.get('/', (req, res) => {
//   res.send('Hello World!')
// })


//routes 
const userRoutes = require('./src/users/user.route')
const transactionRoutes = require('./src/transactions/transaction.route')
const walletRoutes = require('./src/wallet/wallet.route')
const recurringRoutes = require('./src/recurring/recurring.route')
const analyticsRoutes = require('./src/analytics/analytics.route')
const budgetRoutes = require('./src/budgets/budget.route')
const goalRoutes = require('./src/goals/goal.route')
const debtRoutes = require('./src/debts/debt.route')
const calendarRoutes = require('./src/calendar/calendar.route')
const splitRoutes = require('./src/splits/split.route')

app.use("/api/users", userRoutes)
app.use("/api/transactions", transactionRoutes)
app.use("/api/wallet", walletRoutes)
app.use("/api/recurring", recurringRoutes)
app.use("/api/analytics", analyticsRoutes)
app.use("/api/budgets", budgetRoutes)
app.use("/api/goals", goalRoutes)
app.use("/api/debts", debtRoutes)
app.use("/api/calendar", calendarRoutes)
app.use("/api/splits", splitRoutes)

async function main() {
  await mongoose.connect(process.env.DB_URL);

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

main().then(() => {
  console.log("Mongodb connected successfully");

  // ─── Recurring Transactions Cron Scheduler ───
  // Runs every hour at minute 0 to process all due recurring transactions.
  // Change to '* * * * *' (every minute) for demo/testing purposes.
  const cronSchedule = process.env.RECURRING_CRON || '0 * * * *';
  cron.schedule(cronSchedule, async () => {
    console.log('[Cron] Running recurring transactions processor...');
    try {
      const results = await processDueRecurring();
      const succeeded = results.filter(r => r.success).length;
      const failed = results.filter(r => !r.success).length;
      console.log(`[Cron] Done — ${succeeded} succeeded, ${failed} failed out of ${results.length} total`);
    } catch (error) {
      console.error('[Cron] Error processing recurring transactions:', error);
    }
  });
  console.log(`[Cron] Recurring transaction scheduler started (schedule: ${cronSchedule})`);
}).catch(err => console.log(err));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
/// step by step of using mongo  ;
// 1 .setup mongoose
//2.setup schema
//3. setup model
//3. setup route
