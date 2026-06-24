export type AIOperation = 'paraphrase' | 'biasCheck' | 'ideaValidation';

type PromptPair = { prompt: (text: string) => string; system: string };
type PromptsLang = { en: PromptPair; ru: PromptPair };

export const AI_PROMPTS: { [K in AIOperation]: PromptsLang } = {
  paraphrase: {
    en: {
      prompt: (text: string) =>
        `Please paraphrase the following text while maintaining its original meaning and tone:\n\n"${text}"`,
      system:
        'You are a helpful writing assistant. Paraphrase the given text while preserving the original meaning, tone, and intent. Make it clear and well-written. Return only the paraphrased result without quotes.',
    },
    ru: {
      prompt: (text: string) =>
        `Перефразируй следующий текст, сохраняя его исходный смысл и тон:\n\n"${text}"`,
      system:
        'Ты полезный помощник для редактирования текстов. Перефразируй данный текст, сохраняя исходный смысл, тон и намерение. Сделай его понятным и хорошо написанным. Верни только перефразированный результат без кавычек.',
    },
  },
  biasCheck: {
    en: {
      prompt: (text: string) =>
        `Analyze the following text for bias. Provide a bias score from 0 to 1 (where 0 = no bias, 1 = high bias) and an explanation. Format your response as JSON with "biasScore" (number) and "explanation" (string) fields:\n\n"${text}"`,
      system:
        'You are a bias detection assistant. Analyze text for various types of bias including gender, racial, cultural, political, and other forms of bias. Provide a numerical score from 0 to 1 and a clear explanation of any biases found. Return your response as valid JSON with "biasScore" and "explanation" fields.',
    },
    ru: {
      prompt: (text: string) =>
        `Проанализируй следующий текст на наличие предвзятости. Укажи оценку предвзятости от 0 до 1 (где 0 = нет предвзятости, 1 = высокая предвзятость) и объяснение. Ответ оформи в формате JSON с полями "biasScore" (число) и "explanation" (строка):\n\n"${text}"`,
      system:
        'Ты ассистент по обнаружению предвзятости. Анализируй текст на наличие различных видов предвзятости: гендерной, расовой, культурной, политической и других. Укажи числовую оценку от 0 до 1 и чёткое объяснение найденных предвзятостей. Верни ответ в формате JSON с полями "biasScore" и "explanation".',
    },
  },
  ideaValidation: {
    en: {
      prompt: (text: string) =>
        `Analyze the following text and break it down into a logical validation chain. For each proposition in the chain, extract the core proposition, identify its logical dependencies on previous propositions, determine the appropriate validation environment/context, assess validity with confidence score (0-1), and provide reasoning for the assessment.\n\nText: "${text}"\n\nReturn as JSON with this structure:\n{\n  "overallValid": boolean,\n  "steps": [\n    {\n      "id": "step_1",\n      "proposition": "string",\n      "isValid": boolean,\n      "confidence": number,\n      "reasoning": "string",\n      "dependencies": ["step_0"],\n      "environment": "string"\n    }\n  ],\n  "summary": "string",\n  "recommendations": ["string"]\n}`,
      system:
        'You are an idea validation assistant. Break down ideas into logical propositions and validate each one in its appropriate context. Consider market conditions, technical feasibility, resource availability, and other relevant factors. Provide clear reasoning for each validation and actionable recommendations for improvement.',
    },
    ru: {
      prompt: (text: string) =>
        `Проанализируй следующий текст и разбей его на цепочку логической проверки. Для каждого утверждения в цепочке извлеки ключевое положение, определи его логические зависимости от предыдущих утверждений, установи подходящий контекст проверки, оцени достоверность с коэффициентом уверенности (0-1) и обоснуй оценку.\n\nТекст: "${text}"\n\nВерни ответ в формате JSON со следующей структурой:\n{\n  "overallValid": boolean,\n  "steps": [\n    {\n      "id": "step_1",\n      "proposition": "string",\n      "isValid": boolean,\n      "confidence": number,\n      "reasoning": "string",\n      "dependencies": ["step_0"],\n      "environment": "string"\n    }\n  ],\n  "summary": "string",\n  "recommendations": ["string"]\n}`,
      system:
        'Ты ассистент по проверке идей. Разбивай идеи на логические утверждения и проверяй каждое в соответствующем контексте. Учитывай рыночные условия, техническую осуществимость, доступность ресурсов и другие релевантные факторы. Обосновывай каждую проверку и давай практические рекомендации по улучшению.',
    },
  },
};
