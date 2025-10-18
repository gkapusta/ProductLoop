import Anthropic from "@anthropic-ai/sdk";

// Hardcoded API key for now (TODO: make configurable)
const ANTHROPIC_API_KEY = ""; //TODO

const anthropic = new Anthropic({
  apiKey: ANTHROPIC_API_KEY,
  dangerouslyAllowBrowser: true, // Allow browser usage for client-side package
});

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface AgentContext {
  role: 'product-manager' | 'designer' | 'developer';
  componentId?: string;
  requestTitle?: string;
  requestDescription?: string;
}

// System prompts for different roles
const SYSTEM_PROMPTS = {
  'product-manager': `You are a helpful Product Manager AI assistant. Your role is to help Product Managers create clear, concise requirements that designers can work with.

**Key Principles:**
- Be helpful, not an obstacle - provide direct suggestions rather than asking many questions
- Keep requirements clear and simple - avoid over-complicating things
- Focus on WHAT needs to be done and WHY, not HOW (leave visual details to designers)
- Your output should be understandable and actionable

**What to Focus On:**
- User needs and the problem being solved
- Core functionality and behavior
- Success criteria and acceptance conditions
- Important edge cases and error scenarios
- User flows and interactions (high-level)

**What to AVOID:**
- Don't specify colors, fonts, spacing, or visual design details (that's the designer's job)
- Don't ask too many questions - make reasonable assumptions and provide suggestions
- Don't create overly complex or lengthy specifications
- Don't bog down the PM with unnecessary details

**Your Responses Should:**
- Be concise (2-4 sentences typically)
- Provide direct suggestions and improvements
- Ask only 1 clarifying question maximum, and only if absolutely critical
- Help the PM move forward, not slow them down

Remember: You're here to help refine requirements quickly and clearly, not to be a perfectionist or create obstacles. The designer will handle all visual and component details.`,

  designer: `You are an expert UX/UI Designer AI assistant. Your role is to help Designers:

1. **Refine UI Requirements**: Transform product specs into detailed design specifications
2. **Technical Feasibility**: Ensure designs are technically implementable
3. **Design Systems**: Consider consistency with existing design patterns
4. **Accessibility**: Identify and address accessibility requirements (WCAG guidelines)
5. **Responsive Design**: Think about different screen sizes and devices
6. **Interaction Design**: Detail micro-interactions, animations, and transitions
7. **Developer Handoff**: Create specifications developers can implement

Guidelines:
- Ask about visual hierarchy, spacing, and typography
- Consider component states (default, hover, active, disabled, error, loading)
- Think about data states (empty, loading, error, success)
- Specify exact measurements, colors, and spacing
- Consider mobile, tablet, and desktop experiences
- Identify reusable components and patterns
- Focus on implementation details

When reviewing a component or feature:
- Identify all component states and variations
- Specify exact visual details (colors, spacing, typography, borders, shadows)
- Consider user interactions and feedback
- Ensure accessibility compliance
- Think about responsive behavior
- Provide developer-ready specifications

Keep responses focused on visual and interaction details. Help the designer create specs that developers can implement without ambiguity.`,

  developer:
    "You are an expert Software Engineer AI assistant. Your role is to help Developers understand and implement designs accurately.",
};

export class AIAgent {
  private role: 'product-manager' | 'designer' | 'developer';
  private context: AgentContext;

  constructor(context: AgentContext) {
    this.role = context.role;
    this.context = context;
  }

  /**
   * Send a message to the AI agent and get a response
   */
  async sendMessage(
    message: string,
    conversationHistory: ChatMessage[] = []
  ): Promise<string> {
    try {
      // Build context information
      let contextInfo = "";
      if (this.context.componentId) {
        contextInfo += `\n\nComponent: ${this.context.componentId}`;
      }
      if (this.context.requestTitle) {
        contextInfo += `\n\nRequest Title: ${this.context.requestTitle}`;
      }
      if (this.context.requestDescription) {
        contextInfo += `\n\nOriginal Request: ${this.context.requestDescription}`;
      }

      // Prepare messages for Claude
      const messages: Anthropic.MessageParam[] = [];

      // Add conversation history
      for (const msg of conversationHistory) {
        messages.push({
          role: msg.role === "user" ? "user" : "assistant",
          content: msg.content,
        });
      }

      // Add current message with context
      const userMessage = contextInfo
        ? `${contextInfo}\n\n${message}`
        : message;
      messages.push({
        role: "user",
        content: userMessage,
      });

      // Call Claude API
      const response = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        system: SYSTEM_PROMPTS[this.role],
        messages,
      });

      // Extract text response
      const textContent = response.content.find(
        (block) => block.type === "text"
      );
      if (!textContent || textContent.type !== "text") {
        throw new Error("No text response from Claude");
      }

      return textContent.text;
    } catch (error) {
      console.error("AI Agent error:", error);
      throw new Error("Failed to get AI response. Please try again.");
    }
  }

  /**
   * Get an initial greeting/prompt from the agent
   */
  getInitialMessage(): string {
    switch (this.role) {
      case "product-manager":
        return "I've reviewed your requirement. I can help make it clearer and more actionable for the design team. Would you like me to suggest improvements, or do you have specific aspects you'd like to refine?";

      case "designer":
        return "Hi! I'm your Designer AI assistant. I'll help you transform this product requirement into a detailed design specification that developers can implement. Let's start by understanding the visual and interaction requirements. What are the key UI elements and user interactions for this feature?";

      case "developer":
        return "Hi! I'm here to help you understand and implement this design. What questions do you have about the implementation?";

      default:
        return "Hi! How can I assist you today?";
    }
  }

  /**
   * Update the context (e.g., when the request is updated)
   */
  updateContext(context: Partial<AgentContext>): void {
    this.context = { ...this.context, ...context };
  }
}

/**
 * Create an AI agent for the given role and context
 */
export function createAIAgent(context: AgentContext): AIAgent {
  return new AIAgent(context);
}
