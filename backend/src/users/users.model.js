
const mongoose = require('mongoose');

/*
User {
  firebaseUid,
  name,
  email
}
 */

const userSchema = new mongoose.Schema({
  firebaseUid : {
    type : String,
    required: true, 
    
  },
  name : {
    type : String, 
    required : true, 
  },
  email : {
    type : String, 
    required : true, 
  },  
});
const user = mongoose.model('user', userSchema);

module.exports = user;