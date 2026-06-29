import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from '../users/user.entity';

@Entity('skills')
export class Skill {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column()
  proficiency: 'Beginner' | 'Intermediate' | 'Advanced';

  @Column({ type: 'int', default: 0 })
  yearsUsed: number;

  @Column({ type: 'int', default: 0 })
  monthsUsed: number;

  @ManyToOne(() => User, (user) => user.skills, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column({ nullable: true })
  skillType: string;

  @Column()
  userId: string;
}
