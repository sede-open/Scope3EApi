import { Repository } from 'typeorm';
import { ControllerFunctionAsync } from '../types';
import { CategoryEntity } from '../../entities/Category';
import { Category } from '../../types';

export class CategoryController {
  constructor(
    private categoryRepositoryRepository: Repository<CategoryEntity>
  ) {}

  findAll: ControllerFunctionAsync<undefined, Category[]> = async () => {
    return this.categoryRepositoryRepository.find({
      order: { order: 'ASC' },
    });
  };
}
