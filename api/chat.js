// Archivo: api/chat.js
const { OpenAI } = require('openai'); 

const client = new OpenAI({
  apiKey: process.env.GROQ_API_KEY, // <--- ESTO ES LO IMPORTANTE
  baseURL: "https://api.groq.com/openai/v1" 
});

module.exports = async (req, res) => {
  try {
    const { prompt } = req.body;
    
    const completion = await client.chat.completions.create({
      model: "llama-3.3-70b-versatile",
      messages: [
        { role: "system", content: "Eres Nôema, asistente teológico breve y preciso." },
        { role: "user", content: prompt }
      ],
      max_tokens: 400
    });

    res.status(200).json({ text: completion.choices[0].message.content });
  } catch (error) {
    res.status(500).json({ error: "Error de conexión" });
  }
};
