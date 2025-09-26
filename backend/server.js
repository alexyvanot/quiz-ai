import express from 'express';
import cors from 'cors';
import axios from 'axios';

const app = express();
app.use(cors());
app.use(express.json());

// Configuration Ollama - use host.docker.internal for Docker
const OLLAMA_BASE_URL = process.env.OLLAMA_URL || 'http://host.docker.internal:11434';

// test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend fonctionne !' });
});

// Quiz generation route
app.post('/api/quiz', async (req, res) => {
  console.log('Requête reçue:', req.body);
  try {
    const inputText = req.body.text || '';
    
    if (!inputText.trim()) {
      return res.status(400).json({ error: 'Aucun texte fourni.' });
    }

    // num questions and choices with defaults
    const numQuestions = parseInt(req.body.numQuestions) || 5;
    const numChoices = parseInt(req.body.numChoices) || 4;

    console.log(`Génération quiz: ${numQuestions} questions, ${numChoices} choix`);

    // Test Ollama connection
    try {
      console.log('Test de connexion à Ollama...');
      const testResponse = await axios.get(`${OLLAMA_BASE_URL}/api/tags`, { timeout: 5000 });
      console.log('Modèles disponibles sur Ollama:', testResponse.data.models?.map(m => m.name) || 'Aucun');
    } catch (testError) {
      console.error('Ollama n\'est pas accessible:', testError.message);
      return res.status(500).json({ 
        error: 'Ollama n\'est pas démarré ou accessible. Démarrez Ollama d\'abord.' 
      });
    }

    // Ollama call
    const prompt = `Tu dois créer un quiz UNIQUEMENT basé sur le texte ci-dessous. IGNORE tous les textes précédents.

NOUVEAU TEXTE À ANALYSER:
${inputText.substring(0, 1500)}

Crée EXACTEMENT ${numQuestions} questions QUI PORTENT UNIQUEMENT SUR CE TEXTE. 
Chaque question doit avoir EXACTEMENT ${numChoices} choix de réponse.

Format requis - tableau JSON valide:
[
  {"question":"[Question basée sur le texte]","choices":["Choix 1","Choix 2","Choix 3","Choix 4"],"answer":"[Une des 4 réponses]"}
]

RÈGLES IMPORTANTES:
- ${numQuestions} questions exactement
- ${numChoices} choix par question exactement  
- Questions basées UNIQUEMENT sur le texte ci-dessus
- La "answer" doit être identique à un des "choices"`;

    // model list to try in order (smarter model first)
    const modelsToTry = ['llama3.2:latest', 'gemma:2b'];
    let quizData = null;
    let ollamaWorked = false;

    for (const model of modelsToTry) {
      try {
        console.log(`Essai avec le modèle: ${model}`);
        
        const ollamaResponse = await axios.post(`${OLLAMA_BASE_URL}/api/generate`, {
          model,
          prompt,
          stream: false,
          format: "json", // force json
          options: {
            temperature: model === 'llama3.2:latest' ? 0.1 : 0.05, // low temp for consistency and less hallucination
            top_p: 0.8,
            num_predict: model === 'llama3.2:latest' ? 2000 : 800,
            stop: model === 'llama3.2:latest' ? [] : ["\n\n", "**", "```"],
            repeat_penalty: 1.1,  // avoid repetitions
            seed: Math.floor(Math.random() * 1000000)  // random seed to avoid memorization
          }
        }, { timeout: model === 'llama3.2:latest' ? 90000 : 45000 }); // 90 sec for llama3.2 because it's slower

        let responseText = ollamaResponse.data.response;
        console.log(`Réponse d'Ollama (${responseText.length} chars):`, responseText.substring(0, 300) + '...');
        
        // json parse
        if (typeof responseText === 'string') {
          try {
            let cleanedResponse = responseText.trim();
            
            // check if it's a valid JSON array 
            if (cleanedResponse.startsWith('[') && cleanedResponse.endsWith(']')) {
              quizData = JSON.parse(cleanedResponse);
              ollamaWorked = true;
              console.log(`✅ Quiz généré avec ${model}:`, quizData.length, 'questions');
              break;
            }
            
            // if it's a single object instead of array, we convert to array
            if (cleanedResponse.startsWith('{') && cleanedResponse.endsWith('}')) {
              const singleQuiz = JSON.parse(cleanedResponse);
              if (singleQuiz.question) {
                quizData = [singleQuiz];
                ollamaWorked = true;
                console.log(`✅ Quiz généré avec ${model} (objet unique):`, quizData.length, 'question');
                break;
              }
            }
            
            // special case: llama3.2 might generate a different format with question1, question2, etc.
            if (responseText.includes('"question1"') || responseText.includes('"question"')) {
              // Try to parse and convert the llama3.2 format
              try {
                const parsedObj = JSON.parse(cleanedResponse);
                quizData = [];
                
                // search for keys like question1, question2, etc....
                Object.keys(parsedObj).forEach(key => {
                  if (key.startsWith('question') && parsedObj[key].question) {
                    const q = parsedObj[key];
                    if (q.question && q.choices && q.answer) {
                      
                      // ensure choices is an array and has enough choices
                      let choices = Array.isArray(q.choices) ? [...q.choices] : [q.answer];

                      // Add generic choices if not enough
                      while (choices.length < numChoices) {
                        const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
                        choices.push(`Option ${letters[choices.length]}`);
                      }
                      
                      // Trim choices if too many
                      choices = choices.slice(0, numChoices);

                      // Ensure the correct answer is in the choices
                      if (!choices.includes(q.answer)) {
                        choices[0] = q.answer;  // Replace the first choice with the correct answer
                      }
                      
                      quizData.push({
                        question: q.question,
                        choices: choices,
                        answer: q.answer
                      });
                    }
                  }
                });
                
                if (quizData.length > 0) {
                  ollamaWorked = true;
                  console.log(`✅ Quiz généré avec ${model} (format spécial):`, quizData.length, 'questions');
                  break;
                }
              } catch (specialParseError) {
                console.log(`❌ Erreur parsing format spécial:`, specialParseError.message);
              }
            }

            // else try to find a JSON array in the response
            const jsonMatch = responseText.match(/\[[\s\S]*\]/);
            if (jsonMatch) {
              quizData = JSON.parse(jsonMatch[0]);
              ollamaWorked = true;
              console.log(`✅ Quiz généré avec ${model}:`, quizData.length, 'questions');
              break;
            }
            
            console.log(`❌ Réponse pas au format JSON avec ${model}`);
            console.log('Réponse complète:', responseText.substring(0, 500) + '...');
            continue;
            
          } catch (parseError) {
            console.log(`❌ Erreur parsing JSON avec ${model}:`, parseError.message);
            console.log('Réponse reçue:', responseText.substring(0, 300) + '...');
            continue;
          }
        }
      } catch (ollamaError) {
        if (ollamaError.code === 'ECONNABORTED') {
          console.log(`⏱️ Timeout avec ${model} (> 20 secondes)`);
        } else if (ollamaError.response) {
          console.log(`❌ Erreur HTTP ${ollamaError.response.status} avec ${model}:`, ollamaError.response.data);
        } else {
          console.log(`❌ Erreur réseau avec ${model}:`, ollamaError.message);
        }
        continue;
      }
    }

    if (!ollamaWorked || !quizData || quizData.length === 0) {
      console.log('❌ Aucun modèle Ollama n\'a fonctionné');
      return res.status(500).json({ 
        error: 'Impossible de générer le quiz avec Ollama. Vérifiez que vos modèles (gemma:2b, llama3.2) sont bien installés et qu\'Ollama fonctionne.' 
      });
    }

    // Validate quiz data structure
    const validQuiz = quizData.filter(q => 
      q.question && q.question.trim() !== '' && 
      q.choices && Array.isArray(q.choices) && q.choices.length >= 2 &&
      q.answer && q.answer.trim() !== ''
    );

    if (validQuiz.length === 0) {
      console.log('❌ Quiz généré mais questions vides ou invalides');
      console.log('Quiz reçu:', JSON.stringify(quizData, null, 2));
      return res.status(500).json({ 
        error: 'Le quiz généré contient des questions vides ou invalides.' 
      });
    }

    res.json({ 
      quiz: validQuiz,
      success: true,
      message: `Quiz généré avec succès : ${validQuiz.length} questions valides`
    });

  } catch (err) {
    console.error('Erreur serveur:', err);
    res.status(500).json({ error: `Erreur serveur: ${err.message}` });
  }
});

app.listen(3001, () => console.log('Backend running on http://localhost:3001'));
