import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { LookupType } from './lookup-type.entity';
import { LookupValue } from './lookup-value.entity';

@Injectable()
export class LookupService {
  constructor(
    @InjectRepository(LookupType) private typeRepo: Repository<LookupType>,
    @InjectRepository(LookupValue) private valueRepo: Repository<LookupValue>,
  ) {}

  getAllTypes() {
    return this.typeRepo.find({ relations: ['values'] });
  }

  async getValuesByType(typeName: string) {
    const type = await this.typeRepo.findOne({ where: { name: typeName }, relations: ['values'] });
    if (!type) return [];
    return type.values;
  }

  async createType(name: string) {
    const existing = await this.typeRepo.findOne({ where: { name } });
    if (existing) return existing;
    return this.typeRepo.save(this.typeRepo.create({ name }));
  }

  async deleteType(id: number) {
    await this.typeRepo.delete(id);
  }

  async createValue(typeId: number, value: string) {
    const type = await this.typeRepo.findOne({ where: { id: typeId } });
    if (!type) throw new NotFoundException('Lookup type not found');
    return this.valueRepo.save(this.valueRepo.create({ value, typeId }));
  }

  async updateValue(id: number, value: string) {
    await this.valueRepo.update(id, { value });
    return this.valueRepo.findOne({ where: { id } });
  }

  async deleteValue(id: number) {
    await this.valueRepo.delete(id);
  }
}
