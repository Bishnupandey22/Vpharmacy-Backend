const mongoose = require("mongoose");

const counterSchema = new mongoose.Schema({
    name: { type: String, required: true },
    sequence_value: { type: Number, default: 99 },
});

const Counter = mongoose.model("Counter", counterSchema);

module.exports = Counter;
