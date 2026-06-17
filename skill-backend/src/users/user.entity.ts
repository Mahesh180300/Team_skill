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
  resumeUrl: string;

  @Column({ default: '' })
  resumeOriginalName: string;

  @OneToMany(() => Skill, (skill) => skill.user, { cascade: true, eager: true })
  skills: Skill[];

  @Column({ type: 'text', nullable: true, default: null })
  avatar: string;

  @OneToMany(() => Certification, (cert) => cert.user, { cascade: true, eager: true })
  certifications: Certification[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
