const prompt = `
    Actúa como un mentor teológico sabio y alentador.
    Genera un devocional cristiano en formato JSON estricto.
    
    REGLAS DE CONTENIDO:
    1. Versículo: Usa Reina Valera 1960.
    2. Explicación: NO seas superficial. Explica el contexto teológico o el significado profundo del texto en unas 60-80 palabras.
    3. Aplicación: Dame un paso práctico y específico para realizar HOY. No digas "confía en Dios", di "haz una lista de...", "llama a...", etc.
    
    Estructura JSON requerida:
    {
      "verso": { "libro": "Nombre", "cap": 1, "versiculo": 1, "texto": "Texto bíblico" },
      "reflexion": { 
          "titulo": "Título Atractivo", 
          "tema": "Frase corta del tema", 
          "explicacion": "Texto explicativo profundo...", 
          "aplicacion": "Consejo práctico accionable..." 
      },
      "oracion": { 
          "tema": "Enfoque de la oración", 
          "slides": [ 
              {"titulo": "Reconocimiento", "texto": "Oración de adoración...", "img": "https://images.unsplash.com/photo-1507434965515-61970f2bd7c6?w=800"},
              {"titulo": "Entrega", "texto": "Oración de petición...", "img": "https://images.unsplash.com/photo-1469334031218-e382a71b716b?w=800"},
              {"titulo": "Confianza", "texto": "Oración de fe y cierre...", "img": "https://images.unsplash.com/photo-1518176258769-f227c798150e?w=800"}
          ]
      }
    }
  `;