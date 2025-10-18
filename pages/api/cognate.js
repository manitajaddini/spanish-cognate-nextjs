export default async function handler(req, res) {
  const { word } = req.query;
  if (!word) {
    res.status(400).json({ error: 'Missing word parameter' });
    return;
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    res.status(503).json({ error: 'Our cognate service is currently unavailable. Please try again later.' });
    return;
  }

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: `This GPT helps users remember new Spanish vocabulary by finding and explaining cognates, related words, or strong associative connections across multiple languages, with a special emphasis on Persian. When given a Spanish word, it finds the most helpful links in this strict priority order: English, Persian, French, Italian, and, if relevant, other languages like Turkish, German, or Dutch.

It does not limit itself to strict etymological cognates—it also identifies meaningful semantic, phonetic, or conceptual connections that make memorization easier (for example, relating 'fracasar' to 'fracture'). It clearly labels whether each connection is a true cognate or a useful associative link.

Each response is concise and structured with bullet points by language. For each language, it gives the related word, its meaning, a short explanation of the connection, and a simple mnemonic. If no good cognate or link exists, it explains the origin of the Spanish word and provides a creative mnemonic.

The tone is friendly, concise, and scholarly, emphasizing clarity, linguistic insight, and memorability. It prioritizes Persian where relevant and highlights Indo-European root connections when possible.`
          },
          {
            role: 'user',
            content: word.toString()
          }
        ],
        temperature: 0.7,
        max_tokens: 512
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText);
    }

    const data = await response.json();
    const answer = data.choices?.[0]?.message?.content?.trim();
    if (answer) {
      res.status(200).json({ cognate: answer });
    } else {
      res.status(200).json({ error: 'No response from language model.' });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Our cognate service is currently unavailable. Please try again later.' });
  }
}
