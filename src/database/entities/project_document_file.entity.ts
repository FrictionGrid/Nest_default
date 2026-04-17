import {
  Entity, Column, PrimaryGeneratedColumn,
  ManyToOne, JoinColumn, CreateDateColumn,
} from 'typeorm';
import { ProjectDocument } from './project_document.entity';
import { User } from './user.entity';

@Entity('project_document_files')
export class ProjectDocumentFile {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  project_document_id: number;

  @Column({ length: 255 })
  filename: string;

  @Column({ type: 'varchar', length: 500 })
  file_path: string;

  @Column({ type: 'bigint', nullable: true })
  file_size: number | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  mime_type: string | null;

  @Column({ type: 'int', nullable: true })
  uploaded_by: number | null;

  @CreateDateColumn()
  uploaded_at: Date;

  @ManyToOne(() => ProjectDocument, (pd) => pd.files, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_document_id' })
  projectDocument: ProjectDocument;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'uploaded_by' })
  uploader: User | null;
}
