var mongoose = require('mongoose');

var MessageSchema = new mongoose.Schema({
  time: { type: Date, default: Date.now },
  from: String,
  to: String,
  text: String,
  read: { type: Boolean, default: false },
  tone: String
});

module.exports = mongoose.model('Message', MessageSchema);//Creates 'Message' model with the schema MessageSchema
//Note : mongoose automatically linkes the 'Message' model to the 'messages' collection
//then in js we will use new Message() to create documents
