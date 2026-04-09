import { Injectable } from '@nestjs/common';
import { CreateDetailProjectDto } from './dto/create-detail_project.dto';
import { UpdateDetailProjectDto } from './dto/update-detail_project.dto';

@Injectable()
export class DetailProjectService {
  create(createDetailProjectDto: CreateDetailProjectDto) {
    return 'This action adds a new detailProject';
  }

  findAll() {
    return `This action returns all detailProject`;
  }

  findOne(id: number) {
    return `This action returns a #${id} detailProject`;
  }

  update(id: number, updateDetailProjectDto: UpdateDetailProjectDto) {
    return `This action updates a #${id} detailProject`;
  }

  remove(id: number) {
    return `This action removes a #${id} detailProject`;
  }
}
