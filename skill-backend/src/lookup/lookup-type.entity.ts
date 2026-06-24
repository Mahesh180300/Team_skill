import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { LookupValue } from './lookup-value.entity';

@Entity('lookup_types')
export class LookupType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  name: string;

  @OneToMany(() => LookupValue, (v) => v.lookupType, { cascade: true })
  values: LookupValue[];
}
