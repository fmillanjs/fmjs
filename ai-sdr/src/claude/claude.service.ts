import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Anthropic from '@anthropic-ai/sdk';
import { zodOutputFormat } from '@anthropic-ai/sdk/helpers/zod';
import { ZodType, infer as ZodInfer } from 'zod';

@Injectable()
export class ClaudeService {
  private readonly client: Anthropic;
  private readonly model = 'claude-sonnet-4-6';

  constructor(private readonly config: ConfigService) {
    this.client = new Anthropic({
      apiKey: this.config.get<string>('ANTHROPIC_API_KEY'),
    });
  }

  async structuredOutput<T extends ZodType>(
    schema: T,
    systemPrompt: string,
    userMessage: string,
  ): Promise<ZodInfer<T>> {
    const response = await this.client.messages.parse({
      model: this.model,
      max_tokens: 1024,
      temperature: 0,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
      output_config: { format: zodOutputFormat(schema) },
    });
    return response.parsed_output as ZodInfer<T>;
  }

  async *streamText(
    systemPrompt: string,
    userMessage: string,
  ): AsyncGenerator<string> {
    const stream = this.client.messages.stream({
      model: this.model,
      max_tokens: 2048,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    });
    for await (const event of stream) {
      if (
        event.type === 'content_block_delta' &&
        event.delta.type === 'text_delta'
      ) {
        yield event.delta.text;
      }
    }
  }
}
