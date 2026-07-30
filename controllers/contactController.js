import ContactMessage from "../models/ContactMessage.js";
import asyncHandler from "../middleware/asyncHandler.js";

export const createMessage = asyncHandler(async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: "Name, email and message are required" });
  }

  const contactMessage = await ContactMessage.create({ name, email, message });
  res.status(201).json(contactMessage);
});

export const getAllMessages = asyncHandler(async (req, res) => {
  const messages = await ContactMessage.find().sort({ createdAt: -1 });
  res.json(messages);
});

export const markMessageRead = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findById(req.params.id);

  if (!message) {
    return res.status(404).json({ message: "Message not found" });
  }

  message.read = req.body.read !== undefined ? req.body.read : true;
  await message.save();
  res.json(message);
});

export const deleteMessage = asyncHandler(async (req, res) => {
  const message = await ContactMessage.findById(req.params.id);

  if (!message) {
    return res.status(404).json({ message: "Message not found" });
  }

  await message.deleteOne();
  res.json({ message: "Message deleted" });
});
