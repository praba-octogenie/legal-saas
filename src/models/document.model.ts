import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, BeforeCreate } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Tenant } from './tenant.model';
import { User } from './user.model';
import { Case } from './case.model';
import { Client } from './client.model';

@Table({
  tableName: 'documents',
  timestamps: true,
})
export class Document extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  fileName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  fileType!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  filePath!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: false,
  })
  fileSize!: number;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'archived', 'deleted']],
    },
  })
  status!: 'active' | 'archived' | 'deleted';

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isIn: [['pleading', 'evidence', 'correspondence', 'contract', 'judgment', 'order', 'notice', 'affidavit', 'template', 'other']],
    },
  })
  documentType!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  version?: string;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isTemplate!: boolean;

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isPublic!: boolean;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  textContent?: string;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  tenantId!: string;

  @BelongsTo(() => Tenant)
  tenant!: Tenant;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  createdBy!: string;

  @BelongsTo(() => User)
  creator!: User;

  @ForeignKey(() => Case)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  caseId?: string;

  @BelongsTo(() => Case)
  case?: Case;

  @ForeignKey(() => Client)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  clientId?: string;

  @BelongsTo(() => Client)
  client?: Client;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  tags!: string[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  versions!: {
    id: string;
    version: string;
    fileName: string;
    filePath: string;
    fileSize: number;
    createdAt: Date;
    createdBy: string;
    notes?: string;
  }[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  accessControl!: {
    userId: string;
    permissions: ('read' | 'write' | 'delete' | 'share')[];
  }[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  metadata!: {
    language?: string;
    court?: string;
    jurisdiction?: string;
    signatories?: string[];
    expiryDate?: Date;
    keywords?: string[];
    customFields?: Record<string, any>;
  };

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  history!: {
    id: string;
    action: 'created' | 'updated' | 'viewed' | 'shared' | 'downloaded' | 'deleted' | 'restored';
    timestamp: Date;
    userId: string;
    details?: string;
  }[];

  @BeforeCreate
  static async generateIds(instance: Document) {
    // Generate IDs for versions if they don't have one
    if (instance.versions && instance.versions.length > 0) {
      instance.versions = instance.versions.map(version => {
        if (!version.id) {
          return { ...version, id: uuidv4() };
        }
        return version;
      });
    }

    // Generate IDs for history events if they don't have one
    if (instance.history && instance.history.length > 0) {
      instance.history = instance.history.map(event => {
        if (!event.id) {
          return { ...event, id: uuidv4() };
        }
        return event;
      });
    }
  }
}

export default Document;