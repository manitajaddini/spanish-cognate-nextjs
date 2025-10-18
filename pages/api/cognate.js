export default async function handler(req, res) {
  const { word } = req.query;
  if (!word) {
    res.status(400).json({ error: 'Missing word parameter' });
    return;
  }

  const removeAccents = (str) => {
    return str
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/\u00f1/gi, 'n');
  };

  const guessCognate = (input) => {
    const w = removeAccents(input.toLowerCase());
    const rules = [
      { suffix: 'aciones', replacement: 'ations' },
      { suffix: 'acion', replacement: 'ation' },
      { suffix: 'iciones', replacement: 'itions' },
      { suffix: 'icion', replacement: 'ition' },
      { suffix: 'ucion', replacement: 'ution' },
      { suffix: 'uciones', replacement: 'utions' },
      { suffix: 'cion', replacement: 'tion' },
      { suffix: 'ciones', replacement: 'tions' },
      { suffix: 'sion', replacement: 'sion' },
      { suffix: 'siones', replacement: 'sions' },
      { suffix: 'dad', replacement: 'ty' },
      { suffix: 'tad', replacement: 'tude' },
      { suffix: 'ista', replacement: 'ist' },
      { suffix: 'istas', replacement: 'ists' },
      { suffix: 'mente', replacement: 'ly' },
      { suffix: 'oso', replacement: 'ous' },
      { suffix: 'osos', replacement: 'ous' },
      { suffix: 'osa', replacement: 'ous' },
      { suffix: 'osas', replacement: 'ous' },
      { suffix: 'idad', replacement: 'ity' },
      { suffix: 'ividades', replacement: 'ivities' },
      { suffix: 'ivo', replacement: 'ive' },
      { suffix: 'ivos', replacement: 'ive' },
      { suffix: 'iva', replacement: 'ive' },
      { suffix: 'ivas', replacement: 'ive' },
      { suffix: 'encia', replacement: 'ence' },
      { suffix: 'encias', replacement: 'ences' },
      { suffix: 'ancia', replacement: 'ance' },
      { suffix: 'ancias', replacement: 'ances' },
      { suffix: 'ente', replacement: 'ent' },
      { suffix: 'entes', replacement: 'ents' },
      { suffix: 'ador', replacement: 'ator' },
      { suffix: 'adora', replacement: 'ator' },
      { suffix: 'adores', replacement: 'ators' },
      { suffix: 'adoras', replacement: 'ators' }
    ];
    for (const rule of rules) {
      if (w.endsWith(rule.suffix)) {
        const base = w.slice(0, -rule.suffix.length);
        return base + rule.replacement;
      }
    }
    if (w.endsWith('mente')) {
      const root = w.slice(0, -'mente'.length);
      return `${root}ly`;
    }
    return '';
  };

  async function queryOpenAI(input) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return '';
    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-3.5-turbo',
          messages: [
            {
              role: 'system',
              content:
                'You are an assistant that returns the English cognate for a given Spanish word. A cognate is a word in English that has a similar spelling and meaning. Respond with the single English cognate only.'
            },
            {
              role: 'user',
              content: `Spanish word: ${input}`
            }
          ],
          max_tokens: 10,
          temperature: 0
        })
      });
      if (!response.ok) return '';
      const data = await response.json();
      const text = data.choices?.[0]?.message?.content ?? '';
      return text.trim();
    } catch (err) {
      return '';
    }
  }

  let cognate = await queryOpenAI(word);
  if (!cognate) {
    cognate = guessCognate(word);
  }
  if (!cognate) {
    cognate = `No obvious cognate found for "${word}".`;
  }

  res.status(200).json({ cognate });
}
