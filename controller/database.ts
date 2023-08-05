import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

mongoose.connect(process.env.DATABASE_URL || "mongodb://localhost:27017/")

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: true,
  },
  hash: {
    type: String,
    required: true,
  },
  salt: {
    type: String,
    required: true,
  },
  admin: {
    type: Boolean,
    required: false
  }
});


const messagesSchema = new mongoose.Schema(
  {
    message: {
      type: String,
      required: true
    },
    icon: {
      type: String,
      required: false
    },
    to: {
      type: String,
      required: false
    },
    readed: {
      type: [String],
      required: false
    }
  },
  {
    timestamps: true
  }
);

// const adminMessagesSchema = new mongoose.Schema({});

const User = mongoose.model('Users', userSchema);
const Messages = mongoose.model('Messages', messagesSchema);

export { User, Messages };