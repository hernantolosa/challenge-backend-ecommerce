import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, Unique } from 'typeorm';

@Entity({ name: 'categories' })
@Unique('UQ_categories_name', ['name'])
export class CategoryOrmEntity {
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_categories' })
  id!: string;

  @Column({ type: 'varchar', length: 100 })
  name!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
