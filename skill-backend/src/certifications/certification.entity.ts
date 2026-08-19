import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('certifications')
export class Certification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ default: '' })
  issuer: string;

  @Column({ type: 'int', nullable: true })
  year: number;

  @Column({ type: 'date', nullable: true })
  issuedOn: string;

  @Column({ type: 'date', nullable: true })
  expiryDate: string;

  @ManyToOne(() => User, (user) => user.certifications, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  userId: string;

  @Column({ nullable: true })
  fileName: string;

  @Column({ nullable: true })
  fileType: string;

  @Column({ type: 'text', nullable: true })
  fileData: string;

  @Column({ type: 'text', nullable: true })
  fileUrl: string;

  @Column({ type: 'varchar', nullable: true })
  filePublicId: string;
}
