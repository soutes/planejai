export interface AnthropicMessage {
  role: 'user' | 'assistant'
  content: string | AnthropicContent[]
}

export interface AnthropicContent {
  type: 'text' | 'image' | 'document'
  text?: string
  source?: {
    type: 'base64'
    media_type: string
    data: string
  }
}

export interface AnthropicCallInput {
  systemPrompt: string
  messages: AnthropicMessage[]
}

export interface IAnthropicRepository {
  call(input: AnthropicCallInput): Promise<string>
}
