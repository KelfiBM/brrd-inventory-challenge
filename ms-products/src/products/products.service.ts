import { Injectable } from '@nestjs/common';

@Injectable()
export class ProductsService {
  constructor() {}

  findAll() {
    return `This action returns all products`;
  }

  findOne(id: number) {
    return `This action returns a #${id} product`;
  }

  remove(id: number) {
    return `This action removes a #${id} product`;
  }
}
