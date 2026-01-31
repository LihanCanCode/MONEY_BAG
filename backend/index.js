require('dotenv').config()
const express = require('express')
const app = express()
const port = process.env.PORT || 5000
const mongoose = require('mongoose');
const cors = require('cors')


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
//routes 
const userRoutes = require('./src/users/user.route')
const transactionRoutes = require('./src/transactions/transaction.route')
const walletRoutes = require('./src/wallet/wallet.route')
const recurringRoutes = require('./src/recurring/recurring.route')
const analyticsRoutes = require('./src/analytics/analytics.route')

app.use("/api/users", userRoutes)
app.use("/api/transactions", transactionRoutes)
app.use("/api/wallet", walletRoutes)
app.use("/api/recurring", recurringRoutes)
app.use("/api/analytics", analyticsRoutes)

async function main() {
  await mongoose.connect(process.env.DB_URL);

  // use `await mongoose.connect('mongodb://user:password@127.0.0.1:27017/test');` if your database has auth enabled
}

main().then(() => console.log("Mongodb connected successfully")).catch(err => console.log(err));

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})
/// step by step of using mongo  ;
// 1 .setup mongoose
//2.setup schema
//3. setup model
//3. setup route
