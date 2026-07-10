import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn } from 'typeorm';

@Entity('chat_messages')
export class ChatMessage {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  senderId: string;

  @Column()
  receiverId: string;

  @Column('text')
  content: string;

  @Column({ default: false })
  isRead: boolean;

  @Column({ default: false })
  deletedBySender: boolean;

  @Column({ default: false })
  deletedByReceiver: boolean;

  @CreateDateColumn()
  createdAt: Date;
}
