import { Entity, Column, PrimaryGeneratedColumn, OneToMany } from 'typeorm';
import { ProjectDocument } from './project_document.entity';

@Entity('document_types')
export class DocumentType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 255 })
  name: string;

  @Column({ default: true })
  is_required: boolean;

  @Column({ default: 0 })
  sort_order: number;

  @OneToMany(() => ProjectDocument, (pd) => pd.documentType)
  projectDocuments: ProjectDocument[];
}
