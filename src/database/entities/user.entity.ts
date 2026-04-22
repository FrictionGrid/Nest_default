import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum UserRole {
  ADMIN = 'admin',
  ADMINSYSTEM = 'adminsystem',
  MANAGER = 'manager',
  HEAD_ENGINEER = 'head_engineer',
  ENGINEER = 'engineer',
  SALE = 'sale',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 100, unique: true })
  username: string;

  @Column({ length: 255, unique: true })
  email: string;

  @Column({ length: 255 })
  password: string;

  @Column({ length: 150, nullable: true })
  display_name: string;

  @Column({ type: 'enum', enum: UserRole, enumName: 'user_role', default: UserRole.ENGINEER })
  role: UserRole;

  @Column({ length: 50, default: 'active' })
  status: string;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;
}
