import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common'
import { CreateCategoryDto } from '../dto/create-category.dto'
import { UpdateCategoryDto } from '../dto/update-category.dto'
import { CategoryMapper } from '../mapper/category-mapper'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Category } from '../entities/category.entity'

@Injectable()
export class CategoryService {
  private logger = new Logger('CategoryService')

  constructor(
    private readonly categoryMapper: CategoryMapper,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {
  }

  async findAll(): Promise<Category[]> {
    this.logger.log('Buscando todas las categorias...')
    return await this.categoryRepository.find()
  }

  async findOne(id: string): Promise<Category> {
    this.logger.log(`Find one categoria by id:${id}`)
    const category = await this.categoryRepository.findOneBy({ id })
    if (!category) {
      throw new NotFoundException(`Categoria con id ${id} no encontrada`)
    }
    return category
  }

  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    this.logger.log('Categoria creada')
    const category = this.categoryMapper.toEntity(createCategoryDto)
    const categoryCreated = await this.categoryExists(category.name)
    return await this.categoryRepository.save(categoryCreated)
  }

  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    this.logger.log(`Actualizando categoria con id: ${id}`)
    const category = this.categoryMapper.toEntity(updateCategoryDto)
    const categoryUpdated = await this.categoryExists(category.name)
    if (!categoryUpdated) {
      return await this.categoryRepository.save({
        ...category,
        id,
      })
    }
  }

  async remove(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({ id })
    if (!category) {
      throw new NotFoundException(`Categoria con id ${id} no encontrada`)
    } else {
      return await this.categoryRepository.remove(category)
    }
  }

  async changeIsActive(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOneBy({ id })
    if (!category) {
      throw new NotFoundException(`Categoria con id ${id} no encontrada`)
    } else {
      return await this.categoryRepository.save({
        ...category,
        isActive: false,
      })
    }
  }

  async categoryExists(name: string): Promise<Category> {
    const category = await this.categoryRepository
      .createQueryBuilder('category')
      .where('LOWER(name) = LOWER(:name)', { name })
      .getOne()
    if (category) {
      if (category.isActive === true) {
        throw new BadRequestException(`Categoria con nombre ${name} ya existe`)
      } else if (category.isActive === false) {
        category.isActive = true
      }
      return await this.categoryRepository.save(category)
    }
  }
}