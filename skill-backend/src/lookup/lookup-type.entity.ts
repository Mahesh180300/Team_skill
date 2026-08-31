import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { LookupValue } from './lookup-value.entity';

@Entity('lookup_types')
export class LookupType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @OneToMany(() => LookupValue, (v) => v.lookupType, { cascade: true })
  values: LookupValue[];
}
