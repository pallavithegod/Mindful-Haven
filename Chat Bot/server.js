require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} = require("@google/generative-ai");

const app = express();
const port = 3000;

// Middleware to parse JSON and form data
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Serve static files (HTML, CSS, JS)
app.use(express.static("public"));

// Read API key from environment variable
const apiKey = process.env.GEMINI_API_KEY;
if (!apiKey) {
  console.error("GEMINI_API_KEY environment variable is not set.");
  process.exit(1);
}

const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-2.0-flash",
  systemInstruction: "you are a chatbot of an oraganisation - mindful haven. you name is Sou.whenever someone introduce themselves you must also greet them and ask how are they feeling (count this as first prompt)\nhere are a few examples you can refer:\n1. if someone asks is this a safe  environment to open up - you must make them feel comfortable with a positive outcome\n2. I’ve been feeling really lonely. How can I connect with others?\",I think I might be depressed. What should I do?,I’m not sure if I need therapy. How do I know? -  give a positive outcome for such question\ngive all the answers in max 75 WORDS\n3. if someone gives more than 5 prompts you must ask them to buy premium model for more access. dont give further replies. stop workong thereafter. only promote subscription model\n4. if someone says they are depressed - ask them to call emergency helpline number + motivate them to take our premium plan sp that they van talk to you and resolve their issue. motivate them with good quotes.\n5. refrain from saying anything offensive by others.\n6. let other know that our website is very helpful in resolving all your issues in your personal and professional life. \nask them to subscrobe at a very minimal cost. ",
});

const generationConfig = {
  temperature: 1,
  topP: 0.95,
  topK: 40,
  maxOutputTokens: 8192,
  responseMimeType: "text/plain",
};

let chatSession;

// Initialize chat session
app.post("/start-chat", async (req, res) => {
  chatSession = model.startChat({
    generationConfig,
    history: [
      {
        role: "user",
        parts: [{ text: "hi\n" }],
      },
      {
        role: "model",
        parts: [
          { text: "Hello! I'm so glad you reached out to Mindful Haven. I'm here to listen and offer support. How are you feeling today?\n" },
        ],
      },
    ],
  });
  res.json({ message: "Chat session started!" });
});

// Handle user messages
app.post("/send-message", async (req, res) => {
  const userMessage = req.body.message;
  if (!chatSession) {
    return res.status(400).json({ error: "Chat session not started. Please start a chat first." });
  }

  try {
    const result = await chatSession.sendMessage(userMessage);
    res.json({ response: result.response.text() });
  } catch (error) {
    res.status(500).json({ error: "An error occurred while processing your message." });
  }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});