import { Injectable } from '@nestjs/common';
import { CreateIncomingProjectDto } from './dto/create-incoming_project.dto';
import { UpdateIncomingProjectDto } from './dto/update-incoming_project.dto';

@Injectable()
export class IncomingProjectService {
  create(createIncomingProjectDto: CreateIncomingProjectDto) {
    return 'This action adds a new incomingProject';
  }

  findAll() {
    return `This action returns all incomingProject`;
  }

  findOne(id: number) {
    return `This action returns a #${id} incomingProject`;
  }

  update(id: number, updateIncomingProjectDto: UpdateIncomingProjectDto) {
    return `This action updates a #${id} incomingProject`;
  }

  remove(id: number) {
    return `This action removes a #${id} incomingProject`;
  }
}
