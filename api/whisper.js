// Archivo: api/whisper.js
const { OpenAI } = require('openai');

const client = new OpenAI({
  apiKey: process.env.GROQ_VOZ_KEY, // <--- ¡AQUÍ ESTÁ EL CAMBIO!
  baseURL: "https://api.groq.com/openai/v1"
});

module.exports = async (req, res) => {
  try {
    const { audio } = req.body;
    const buffer = Buffer.from(audio, 'base64');
    
    const transcription = await client.audio.transcriptions.create({
      file: await OpenAI.toFile(buffer, 'audio.wav'),
      model: "whisper-large-v3",
      language: "es",
    });
    
    res.status(200).json({ text: transcription.text });
  } catch (error) {
    console.error("Error en Whisper:", error);
    res.status(500).json({ error: "Error procesando el audio" });
  }
};