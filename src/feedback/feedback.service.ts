import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Feedback } from '../database/entities/feedback.entity';

@Injectable()
export class FeedbackService {
  constructor(
    @InjectRepository(Feedback)
    private readonly repo: Repository<Feedback>,
  ) {}

  async create(message: string, userId: number | null) {
    const item = this.repo.create({ message, user_id: userId });
    return this.repo.save(item);
  }

  async findAll() {
    return this.repo.find({
      relations: ['user'],
      order: { created_at: 'DESC' },
    });
  }

  async remove(id: number) {
    await this.repo.delete(id);
  }
}
