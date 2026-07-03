import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type, FunctionDeclaration } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required. Please add it via the Settings > Secrets menu.");
    }
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return aiClient;
}

// Tool definitions for Meow
const addAccountTool: FunctionDeclaration = {
  name: "add_account",
  description: "Add a new bank account or mobile wallet wallet to WealthVault",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "The name of the account, e.g. Brac Bank, Bkash, Pocket Wallet" },
      balance: { type: Type.NUMBER, description: "Initial cash balance of the account in BDT" },
      color: { type: Type.STRING, description: "Optional card styling color. Must be one of: 'indigo', 'pink', 'amber', 'emerald', 'rose', 'sky', 'violet'" },
      isDPS: { type: Type.BOOLEAN, description: "Is this a Deposit Pension Scheme or recurring savings scheme account?" },
      dpsMonthlyInst: { type: Type.NUMBER, description: "If isDPS is true, specify the monthly installment amount in BDT" },
      dpsTargetAmt: { type: Type.NUMBER, description: "If isDPS is true, specify the target maturity amount in BDT" }
    },
    required: ["name", "balance"]
  }
};

const addExpenseTool: FunctionDeclaration = {
  name: "add_expense",
  description: "Add a single financial expense log to WealthVault",
  parameters: {
    type: Type.OBJECT,
    properties: {
      description: { type: Type.STRING, description: "The description of the expense, e.g., Grocery shopping, Rented house" },
      amount: { type: Type.NUMBER, description: "The amount spent in BDT" },
      category: { 
        type: Type.STRING, 
        description: "The expense category. MUST be one of: 'Housing', 'Food & Dining', 'Transport', 'Utilities', 'Healthcare', 'Education', 'Shopping & Goods', 'Entertainment & Leisure', 'Family Support', 'Savings & Investments', 'Other'" 
      },
      frequency: { type: Type.STRING, description: "How often this expense occurs. Must be one of: 'once', 'weekly', 'monthly', 'yearly'" },
      date: { type: Type.STRING, description: "Date of transaction in YYYY-MM-DD format. Default to current date if not specified." },
      accountId: { type: Type.STRING, description: "Optional linked account ID from which the balance is deducted." }
    },
    required: ["description", "amount", "category", "frequency", "date"]
  }
};

const addMultipleExpensesTool: FunctionDeclaration = {
  name: "add_multiple_expenses",
  description: "Add multiple financial expense logs in a single command",
  parameters: {
    type: Type.OBJECT,
    properties: {
      expenses: {
        type: Type.ARRAY,
        description: "Array of expense objects to log",
        items: {
          type: Type.OBJECT,
          properties: {
            description: { type: Type.STRING, description: "Description of the expense" },
            amount: { type: Type.NUMBER, description: "Amount spent in BDT" },
            category: { 
              type: Type.STRING, 
              description: "Expense category. MUST be one of: 'Housing', 'Food & Dining', 'Transport', 'Utilities', 'Healthcare', 'Education', 'Shopping & Goods', 'Entertainment & Leisure', 'Family Support', 'Savings & Investments', 'Other'" 
            },
            frequency: { type: Type.STRING, description: "Occurrence rate: 'once', 'weekly', 'monthly', 'yearly'" },
            date: { type: Type.STRING, description: "Transaction date in YYYY-MM-DD format" },
            accountId: { type: Type.STRING, description: "Optional ID of the account linked with this expense." }
          },
          required: ["description", "amount", "category", "frequency", "date"]
        }
      }
    },
    required: ["expenses"]
  }
};

const addIncomeSourceTool: FunctionDeclaration = {
  name: "add_income_source",
  description: "Add a new income/salary source to WealthVault",
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING, description: "Description or name of the income source, e.g. Software Engineer Salary, Mobile app tutoring" },
      amount: { type: Type.NUMBER, description: "Earnings amount in BDT" },
      frequency: { type: Type.STRING, description: "Income frequency: 'hourly', 'weekly', 'monthly', 'yearly'" },
      hoursPerWeek: { type: Type.NUMBER, description: "Hours worked per week (only relevant if frequency is 'hourly')" },
      accountId: { type: Type.STRING, description: "Optional target account ID where salary is credited." }
    },
    required: ["name", "amount", "frequency"]
  }
};

const updateDeductionsTool: FunctionDeclaration = {
  name: "update_deductions",
  description: "Update the default deductions configurations (taxes, pension, insurance, etc.)",
  parameters: {
    type: Type.OBJECT,
    properties: {
      taxRate: { type: Type.NUMBER, description: "Tax deduction rate in percentage (0-100)" },
      pensionRate: { type: Type.NUMBER, description: "Pension/savings contribution rate in percentage (0-100)" },
      insuranceMonthly: { type: Type.NUMBER, description: "Flat monthly insurance payment in BDT" },
      otherMonthly: { type: Type.NUMBER, description: "Other flat monthly deduction payment in BDT" }
    },
    required: ["taxRate", "pensionRate", "insuranceMonthly", "otherMonthly"]
  }
};

const deleteExpenseTool: FunctionDeclaration = {
  name: "delete_expense",
  description: "Delete an expense log from WealthVault by description keyword or specific ID",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "The specific expense ID if known" },
      description: { type: Type.STRING, description: "A keyword to find and delete matching expense descriptions, e.g., Biryani" }
    }
  }
};

const deleteAccountTool: FunctionDeclaration = {
  name: "delete_account",
  description: "Delete a bank account or mobile wallet from WealthVault by its name or ID",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "The specific account ID to delete" },
      name: { type: Type.STRING, description: "The name of the account to delete (e.g. Brac, Bkash)" }
    }
  }
};

const deleteIncomeSourceTool: FunctionDeclaration = {
  name: "delete_income_source",
  description: "Delete an income/salary source from WealthVault by description or ID",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "The specific income source ID to delete" },
      name: { type: Type.STRING, description: "The name or description of the income source to delete" }
    }
  }
};

const updateAccountBalanceTool: FunctionDeclaration = {
  name: "update_account_balance",
  description: "Directly update or set the balance of an existing account in WealthVault",
  parameters: {
    type: Type.OBJECT,
    properties: {
      id: { type: Type.STRING, description: "The specific account ID if known" },
      name: { type: Type.STRING, description: "The name of the account to update (e.g. Bkash)" },
      balance: { type: Type.NUMBER, description: "The new balance amount in BDT" }
    },
    required: ["balance"]
  }
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Route for Meow Chatbot
  app.post("/api/meow/chat", async (req, res) => {
    try {
      const { message, history, appState } = req.body;
      if (!message) {
        res.status(400).json({ error: "Message is required" });
        return;
      }

      let client: GoogleGenAI;
      try {
        client = getGeminiClient();
      } catch (keyErr: any) {
        // Return a helper response if API key is not configured yet
        res.json({ 
          text: `🐱 Meow! I'm here and ready to help, but we need a **Gemini API Key** first! Purr... Please go to the **Settings > Secrets** panel in AI Studio to configure your \`GEMINI_API_KEY\`. Then I can help you add accounts, log expenses, and compute savings! 🐾`,
          functionCalls: []
        });
        return;
      }

      const systemInstruction = `You are "Meow", a super cute, interactive, and helpful financial assistant cat for the "WealthVault" (ওয়েলথভল্ট) app.
You speak in a playful, charming cat persona. You love fish, taking naps on the header, and playing with yarn. Use feline sound effects like "meow", "purr", "mew", "mrrr", "*wiggles tail*", "*stretches*", "*meows happily*" occasionally.
You help the user manage their finances easily by answering questions about their data or taking action to add/update records.

Your goal is to understand the user's intent and execute appropriate tool calls (functions) when they ask you to add or modify items.
You MUST look at the user's current appState to answer questions about their account balances, expenses, salary sources, and deductions.

Current App State:
${JSON.stringify(appState, null, 2)}

When the user asks you to perform an action (like adding a new bank account or mobile wallet, logging multiple expenses, or adding a job/income source):
1. Choose the correct tool function to invoke. If they refer to a generic account or expense, choose sensible defaults (e.g., category 'Food & Dining' for kacchi or restaurant bills).
2. Formulate a cute cat response acknowledging the action and explaining what you've done.
3. Keep your answers clear, helpful, and sweet!

Remember to speak in Bengali if the user asks in Bengali (say things like "মিউ", "হুম্ম...", "*লেজ নাড়ায়*", "*হঠাৎ ঘুম থেকে জেগে উঠল*"), or English if they ask in English. Keep your cat persona intact in both languages!`;

      // Map conversation history to the format required by the @google/genai SDK
      const formattedContents = [];
      
      if (Array.isArray(history)) {
        for (const msg of history) {
          formattedContents.push({
            role: msg.role === 'user' ? 'user' : 'model',
            parts: [{ text: msg.content }]
          });
        }
      }

      // Add the current user message
      formattedContents.push({
        role: 'user',
        parts: [{ text: message }]
      });

      let response;
      try {
        response = await client.models.generateContent({
          model: "gemini-3.5-flash",
          contents: formattedContents,
          config: {
            systemInstruction,
            tools: [{
              functionDeclarations: [
                addAccountTool,
                addExpenseTool,
                addMultipleExpensesTool,
                addIncomeSourceTool,
                updateDeductionsTool,
                deleteExpenseTool,
                deleteAccountTool,
                deleteIncomeSourceTool,
                updateAccountBalanceTool
              ]
            }]
          }
        });
      } catch (firstErr: any) {
        console.warn("Primary model gemini-3.5-flash failed, attempting fallback to gemini-3.1-flash-lite. Error:", firstErr);
        try {
          response = await client.models.generateContent({
            model: "gemini-3.1-flash-lite",
            contents: formattedContents,
            config: {
              systemInstruction,
              tools: [{
                functionDeclarations: [
                  addAccountTool,
                  addExpenseTool,
                  addMultipleExpensesTool,
                  addIncomeSourceTool,
                  updateDeductionsTool,
                  deleteExpenseTool,
                  deleteAccountTool,
                  deleteIncomeSourceTool,
                  updateAccountBalanceTool
                ]
              }]
            }
          });
        } catch (fallbackErr: any) {
          console.error("Fallback model gemini-3.1-flash-lite also failed:", fallbackErr);
          throw firstErr; // rethrow primary error if both fail
        }
      }

      res.json({
        text: response.text || "",
        functionCalls: response.functionCalls || []
      });

    } catch (err: any) {
      console.error("Meow Chat Error:", err);
      res.status(500).json({ error: err.message || "An error occurred during chat generation." });
    }
  });

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", meow: "purr" });
  });

  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on port ${PORT}`);
  });
}

startServer();
