const User = require('./users.model');
const Wallet = require('../wallet/wallet.model');

const registerUser = async (req, res) => {
  try {
    const firebaseUid = req.user.uid; 
    const name = req.user.name; 
    const email = req.user.email; 

    if (!firebaseUid || !name || !email) {
      return res.status(400).json({ 
        message: 'All fields are required: firebaseUid, name, email' 
      });
    }

    const existingUser = await User.findOne({ firebaseUid });
    if (existingUser) {
      return res.status(400).json({ 
        message: 'User already exists' 
      });
    }

    const newUser = new User({ firebaseUid, name, email });
    await newUser.save();

    // Create wallet for the new user with Firebase UID
    const newWallet = new Wallet({
      userId: firebaseUid,  // Using Firebase UID
      currentBalance: 0,
      referenceBudget: 0,
      totalIncome: 0,
      totalExpense: 0
    });
    await newWallet.save();

    res.status(201).json({ 
      message: 'User registered successfully', 
      user: newUser,
      wallet: newWallet
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ 
      message: 'Error registering user', 
      error: error.message 
    });
  }
};

module.exports = { registerUser };