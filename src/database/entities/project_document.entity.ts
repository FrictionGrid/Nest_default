import {
  Entity, Column, PrimaryGeneratedColumn,
  ManyToOne, OneToMany, JoinColumn,
} from 'typeorm';
import { ProjectMain } from './project_main.entity';
import { DocumentType } from './document_type.entity';
import { ProjectDocumentFile } from './project_document_file.entity';
import { User } from './user.entity';

export type DocumentStatus = 'missing' | 'uploaded' | 'approved' | 'rejected';

@Entity('project_documents')
export class ProjectDocument {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  project_id: number;

  @Column()
  document_type_id: number;

  @Column({ type: 'enum', enum: ['missing', 'uploaded', 'approved', 'rejected'], default: 'missing' })
  status: DocumentStatus;

  @Column({ type: 'text', nullable: true })
  rejected_reason: string | null;

  @Column({ type: 'int', nullable: true })
  approved_by: number | null;

  @Column({ type: 'timestamp', nullable: true })
  approved_at: Date | null;

  @ManyToOne(() => ProjectMain, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'project_id' })
  project: ProjectMain;

  @ManyToOne(() => DocumentType, (dt) => dt.projectDocuments, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'document_type_id' })
  documentType: DocumentType;

  @ManyToOne(() => User, { onDelete: 'SET NULL', nullable: true })
  @JoinColumn({ name: 'approved_by' })
  approvedByUser: User | null;

  @OneToMany(() => ProjectDocumentFile, (f) => f.projectDocument, { cascade: true })
  files: ProjectDocumentFile[];
}
