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
  },
  profileImage: {
    type: String,
    required: false
  }
}, {
  timestamps: true
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

const ReadedTableSchema = new mongoose.Schema({
  messageID: {
    type: Number,
    required: true
  },
  user: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    required: true
  },
  status: {
    type: Number,
    enum: [0, 1, 2],
    required: true
  },
});

const ChatMessagesSchema = new mongoose.Schema({
  user: {
    type: String,
    required: true
  },
  message: {
    type: String,
    required: false
  },
  timestamp: {
    type: Date,
    required: true
  },
  chatID: {
    type: Number,
    required: true
  },
  type: {
    type: String,
    enum: ["text", "image", "file","info"], required: true
  },
  description: {
    type: String
  },
  to: {
    type: String
  },
  readed: [ReadedTableSchema],
});

const ChatsSchema = new mongoose.Schema({
  chatID: {
    type: Number,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  image: {
    type: String
  },
  members: [{
    type: String,
    required: true
  }],
  chatText: {
    type: String,
    required: true
  },
  changed: {
    type: Date,
    required: true
  },
  lastInteraction: {
    type: Date,
    required: true
  }
});

const User = mongoose.model('Users', userSchema);
const Messages = mongoose.model('Messages', messagesSchema);
const ChatMessages = mongoose.model('Chat-Messages', ChatMessagesSchema);
const Chats = mongoose.model('Chats-All', ChatsSchema);

export { User, Messages, ChatMessages, Chats };