import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, OneToMany } from 'typeorm';
import { Skill } from '../skills/skill.entity';
import { Certification } from '../certifications/certification.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: 'employee' })
  role: 'employee' | 'admin';

  @Column({ default: '' })
  department: string;

  @Column({ default: '' })
  jobTitle: string;

  @Column({ type: 'int', default: 0 })
  yearsOfExperience: number;

  @Column({ default: '' })
  resumeData: string;

  @Column({ default: '' })
  resumeFileName: string;

  @Column({ default: '' })
  resumeFileType: string;

  @OneToMany(() => Skill, (skill) => skill.user, { cascade: true, eager: true })
  skills: Skill[];

  @Column({ type: 'text', nullable: true, default: null })
  avatar: string;

  @OneToMany(() => Certification, (cert) => cert.user, { cascade: true, eager: true })
  certifications: Certification[];

  @Column({ type: 'varchar', nullable: true, default: null })
  resetToken: string;

  @Column({ type: 'bigint', nullable: true, default: null })
  resetTokenExpiry: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
