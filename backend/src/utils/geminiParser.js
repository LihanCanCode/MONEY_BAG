const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini AI with API key from environment variables
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// Log to verify API key is loaded (remove in production)
console.log('Gemini API Key loaded:', process.env.GEMINI_API_KEY ? 'Yes' : 'No');

/**
 * Parse natural language text into structured transaction data using Gemini AI
 * @param {string} text - Natural language description of the transaction
 * @returns {Promise<Object>} Structured transaction data
 * @example
 * parseTransactionText("Spent 50 bucks on pizza at Dominos")
 * // Returns: { amount: 50, description: "Pizza at Dominos", category: "food", type: "expense" }
 */
const parseTransactionText = async (text) => {
  try {
    // Get Gemini model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    const prompt = `
Extract transaction details from this text: "${text}"

Return ONLY a valid JSON object (no markdown, no explanation) with these exact fields:
- amount: (number) The numerical value of money. Extract only the number, no currency symbols.
- description: (string) A complete description combining all details from the text including what, where, merchant name, and any other context. Make it readable and informative.
- category: (string) ONLY for expenses. Must be ONE of these exact lowercase values: "food", "transport", "bills", "shopping", "entertainment", "health", "education", "other". Return null for income.
- type: (string) Either "expense" or "income". Determine from context.

Context clues for type:
- Words like "spent", "paid", "bought", "purchased", "bill" = expense
- Words like "received", "earned", "got paid", "salary", "income", "add", "deposit" = income
- If unclear, assume expense

Important for description field:
- For expenses: Include item/service + merchant/location if mentioned (e.g., "Pizza at Dominos", "Uber ride to airport", "Electricity bill")
- For income: Include source and context (e.g., "Salary payment", "Freelance work payment", "Gift from friend")
- Combine all relevant information into one readable sentence

Examples:
Input: "Spent 50 bucks on pizza at Dominos"
Output: {"amount": 50, "description": "Pizza at Dominos", "category": "food", "type": "expense"}

Input: "Received 1000 salary"
Output: {"amount": 1000, "description": "Salary payment", "category": null, "type": "income"}

Input: "Paid 30 for uber ride to the airport"
Output: {"amount": 30, "description": "Uber ride to the airport", "category": "transport", "type": "expense"}

Input: "100 electricity bill this month"
Output: {"amount": 100, "description": "Electricity bill this month", "category": "bills", "type": "expense"}

Input: "Add 500"
Output: {"amount": 500, "description": "Money added", "category": null, "type": "income"}

Input: "Got 200 from freelance work"
Output: {"amount": 200, "description": "Freelance work payment", "category": null, "type": "income"}

If you cannot determine a value, use these defaults:
- amount: null
- description: "Transaction"
- category: "other" (for expenses) or null (for income)
- type: "expense"

Return ONLY valid JSON, no explanations.
    `;

    const result = await model.generateContent(prompt);
    const responseText = result.response.text();

    // Clean up response - remove markdown code blocks if present
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Parse the JSON response
    const parsedData = JSON.parse(jsonText.trim());

    // Validate and return fields matching the form structure
    return {
      amount: parsedData.amount || null,
      description: parsedData.description || "Transaction",
      category: parsedData.category || (parsedData.type === "income" ? null : "other"),
      type: parsedData.type || "expense"
    };
  } catch (error) {
    console.error("Error parsing transaction text with Gemini:", error);
    throw new Error(`Failed to parse transaction: ${error.message}`);
  }
};

/**
 * Parse receipt image into structured transaction data using Gemini AI Vision
 * @param {Buffer} imageBuffer - Image buffer from multer upload
 * @param {string} mimeType - MIME type of the image (e.g., 'image/jpeg')
 * @returns {Promise<Object>} Structured transaction data
 * @example
 * parseReceiptImage(buffer, 'image/jpeg')
 * // Returns: { amount: 50.99, description: "Groceries at Walmart", category: "food", type: "expense", merchant: "Walmart", date: "2026-01-25" }
 */
const parseReceiptImage = async (imageBuffer, mimeType) => {
  try {
    // Get Gemini vision model
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash"
    });

    // Convert buffer to base64
    const base64Image = imageBuffer.toString('base64');

    const prompt = `
Analyze this receipt image and extract the transaction details.

Return ONLY a valid JSON object (no markdown, no explanation) with these exact fields:
- amount: (number) The TOTAL amount paid. Extract only the number, no currency symbols. Look for "Total", "Amount Due", or the final amount.
- merchant: (string) The store/restaurant/business name at the top of the receipt.
- date: (string) Transaction date in YYYY-MM-DD format. If year is not visible, use current year 2026.
- items: (array of strings) List of items/services purchased. Keep it concise, max 5 items.
- tax: (number) Tax amount if visible, otherwise null.
- description: (string) A concise summary like "[merchant] purchase" or "Groceries at [merchant]" or "[items] at [merchant]".
- category: (string) Must be ONE of these exact lowercase values: "food", "transport", "bills", "shopping", "entertainment", "health", "education", "other". Determine based on merchant type and items.
- type: (string) Always "expense" for receipts.

Category guidelines:
- "food" = Restaurants, fast food, grocery stores, cafes, food delivery
- "transport" = Gas stations, uber, lyft, parking, public transport
- "bills" = Utilities, phone, internet, insurance
- "shopping" = Retail stores, clothing, electronics, general merchandise
- "entertainment" = Movies, concerts, games, subscriptions
- "health" = Pharmacies, hospitals, medical services, gym
- "other" = Everything else

If the image is unclear or not a receipt:
- Set all fields to null except type: "expense" and description: "Unable to read receipt"

Important:
- Focus on the TOTAL/FINAL amount, not subtotals
- If multiple amounts, choose the largest (usually the total)
- Description should be natural and readable

Return ONLY valid JSON, no explanations.
    `;

    const result = await model.generateContent([
      prompt,
      {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      }
    ]);

    const responseText = result.response.text();
    console.log('Gemini Vision Response:', responseText);

    // Clean up response - remove markdown code blocks if present
    let jsonText = responseText.trim();
    if (jsonText.startsWith('```json')) {
      jsonText = jsonText.replace(/```json\n?/g, '').replace(/```\n?/g, '');
    } else if (jsonText.startsWith('```')) {
      jsonText = jsonText.replace(/```\n?/g, '');
    }

    // Parse the JSON response
    const parsedData = JSON.parse(jsonText.trim());

    // Validate and return fields matching the transaction format
    return {
      amount: parsedData.amount || null,
      description: parsedData.description || "Receipt scanned",
      category: parsedData.category || "other",
      type: "expense", // Receipts are always expenses
      merchant: parsedData.merchant || null,
      date: parsedData.date || null,
      items: parsedData.items || [],
      tax: parsedData.tax || null
    };
  } catch (error) {
    console.error("Error parsing receipt image with Gemini:", error);
    throw new Error(`Failed to parse receipt: ${error.message}`);
  }
};


const fancyMessage = async (amount, category) => {
  const model = genAI.getGenerativeModel({
    model: "gemini-2.5-flash",
    generationConfig: { temperature: 0.8 } // Higher temperature for more "fancy" variety
  });

  const prompt = `
    Context: A user just made a transaction of ${amount} taka in the category "${category}".
    Task: Write a single, short, witty sentence (under 15 words) that puts this small amount into a long-term perspective.
    Style: Witty, slightly sarcastic, but surprisingly insightful.
    Example: "If you saved this daily for 10 years, you'd be choosing between a car and a small island."
    Return ONLY the sentence.
  `;

  const result = await model.generateContent(prompt);
  return result.response.text();
}

/**
 * Generate a dramatic message for debt-related actions using Gemini AI
 * @param {string} action - The action type (create_owed, create_owe, add, subtract, resolve)
 * @param {string} personName - Name of the person involved
 * @param {number} amount - The amount of money involved
 * @param {string} dramaLabel - The drama label of the person
 * @returns {Promise<string>} A dramatic message
 */
const generateDramaticMessage = async (action, personName, amount, dramaLabel) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.9 }
    });

    const dramaContext = {
      trustworthy: "a reliable ally",
      suspicious: "a shifty character",
      always_late: "a notorious procrastinator",
      doubtful: "someone of questionable reliability",
      sworn_enemy: "your sworn nemesis",
      best_friend: "your trusted companion",
      family: "your beloved family member",
      colleague: "your fellow warrior of the workplace"
    };

    const actionDescriptions = {
      create_owed: `You just lent ৳${amount} to ${personName} (${dramaContext[dramaLabel] || 'an acquaintance'})`,
      create_owe: `You just borrowed ৳${amount} from ${personName} (${dramaContext[dramaLabel] || 'an acquaintance'})`,
      add: `The debt with ${personName} just increased by ৳${amount}`,
      subtract: `${personName} just paid back ৳${amount} of their debt`,
      resolve: `The debt with ${personName} has been fully resolved`
    };

    const prompt = `
Context: ${actionDescriptions[action] || 'A debt transaction occurred'}
Person's drama label: ${dramaLabel}

Task: Write a single dramatic, theatrical announcement (1-2 sentences, under 25 words) about this debt event.
Style: Over-the-top dramatic, like a medieval herald announcing news, or a soap opera narrator.
Include relevant emojis.

Examples of the style we want:
- "The sacred coins have changed hands! A bond of debt now ties your fates together! 📜⚔️"
- "BETRAYAL APPROACHES! Your sworn enemy dares to ask for more gold! 😈💰"
- "The prophecy unfolds! The debt shrinks like shadows at dawn! ✨🌅"

Return ONLY the dramatic message, nothing else.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Error generating dramatic message:", error);
    throw error;
  }
};

/**
 * Generate a dramatic message for split bill actions using Gemini AI
 * @param {string} action - create, settle_one, settle_all
 * @param {string} title - The split title
 * @param {number} amount - The relevant amount
 * @param {number} participantCount - Number of participants
 * @param {string} names - Participant name(s)
 * @returns {Promise<string>} A dramatic message
 */
const generateSplitMessage = async (action, title, amount, participantCount, names) => {
  try {
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-flash",
      generationConfig: { temperature: 0.9 }
    });

    const actionDescriptions = {
      create: `A bill of ৳${amount} for "${title}" has been split among ${participantCount} people (${names}). The creator paid the full bill upfront.`,
      settle_one: `${names} just paid back their share of ৳${amount} for "${title}".`,
      settle_all: `The LAST person (${names}) just paid their share! The split "${title}" is now FULLY SETTLED — everyone has paid!`,
      treat: `The user has TREATED ${names} by covering their ৳${amount} share of "${title}"! No payment expected — pure generosity!`
    };

    const prompt = `
Context: ${actionDescriptions[action] || 'A split bill event occurred'}

Task: Write a single dramatic, theatrical announcement (1-2 sentences, under 30 words) about this split bill event.
Style: Over-the-top dramatic, like a medieval herald or soap opera narrator. Fun and humorous.
Include relevant emojis (food/money themed).

Examples of style:
- "The sacred bill has been DIVIDED! 4 souls now bound by a ৳120 pizza covenant! May they honor their debts! 🍕⚔️💰"
- "MIRACLE! Against all odds, Rahul has returned $30! Faith in humanity: RESTORED! 🎉💸"
- "THE GREAT DEBT IS CLEARED! All have paid their share! Tonight we feast as FREE souls! 🏆🎭🍽️"

Return ONLY the dramatic message, nothing else.
    `;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
  } catch (error) {
    console.error("Error generating split message:", error);
    throw error;
  }
};

module.exports = { parseTransactionText, parseReceiptImage, fancyMessage, generateDramaticMessage, generateSplitMessage };
