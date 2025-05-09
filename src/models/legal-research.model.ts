import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, BeforeCreate } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Tenant } from './tenant.model';
import { User } from './user.model';
import { Case } from './case.model';

@Table({
  tableName: 'legal_researches',
  timestamps: true,
})
export class LegalResearch extends Model {
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
  title!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  query?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'in_progress',
    validate: {
      isIn: [['in_progress', 'completed', 'archived']],
    },
  })
  status!: 'in_progress' | 'completed' | 'archived';

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isIn: [['case_law', 'statute', 'regulation', 'commentary', 'article', 'general', 'other']],
    },
  })
  type!: string;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: false,
    defaultValue: [],
  })
  keywords!: string[];

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: false,
    defaultValue: [],
  })
  sources!: string[];

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

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  results!: {
    id: string;
    title: string;
    source: string;
    citation?: string;
    url?: string;
    snippet?: string;
    relevanceScore?: number;
    notes?: string;
    savedAt: Date;
  }[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  history!: {
    id: string;
    timestamp: Date;
    query: string;
    source: string;
    resultsCount: number;
    userId: string;
  }[];

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  analysis?: {
    summary?: string;
    keyPoints?: string[];
    recommendations?: string[];
    generatedAt?: Date;
  };

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  filters!: {
    courts?: string[];
    dateRange?: {
      start?: Date;
      end?: Date;
    };
    jurisdiction?: string[];
    judges?: string[];
    resultType?: string[];
    customFilters?: Record<string, any>;
  };

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  metadata!: Record<string, any>;

  @BeforeCreate
  static async generateIds(instance: LegalResearch) {
    // Generate IDs for results if they don't have one
    if (instance.results && instance.results.length > 0) {
      instance.results = instance.results.map(result => {
        if (!result.id) {
          return { ...result, id: uuidv4() };
        }
        return result;
      });
    }

    // Generate IDs for history entries if they don't have one
    if (instance.history && instance.history.length > 0) {
      instance.history = instance.history.map(entry => {
        if (!entry.id) {
          return { ...entry, id: uuidv4() };
        }
        return entry;
      });
    }
  }
}

export default LegalResearch;