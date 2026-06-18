import { Injectable } from '@nestjs/common';
import { ClassifyService } from './classify.service';
import { LogicService, BotResponse } from './logic.service';
import { ApiService } from './api.service';

@Injectable()
export class ChatService {
  constructor(
    private readonly classify: ClassifyService,
    private readonly logic: LogicService,
    private readonly api: ApiService,
  ) {}

  async respond(message: string): Promise<BotResponse> {
    const result = this.classify.classify(message);

    if (result.type === 'locked' && result.intent) {
      return this.logic.handleIntent(result.intent);
    }

    return this.api.chat(message);
  }
}
