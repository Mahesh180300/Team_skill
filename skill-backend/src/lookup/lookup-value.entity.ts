import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { LookupType } from './lookup-type.entity';

@Entity('lookup_values')
export class LookupValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value: string;

  @ManyToOne(() => LookupType, (t) => t.values, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'typeId' })
  lookupType: LookupType;

  @Column()
  typeId: number;
}
