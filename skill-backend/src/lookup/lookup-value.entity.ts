import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { LookupType } from './lookup-type.entity';

@Entity('lookup_values')
export class LookupValue {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => LookupType, (t) => t.values, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'typeId' })
  lookupType: LookupType;

  @Column()
  typeId: number;
}
