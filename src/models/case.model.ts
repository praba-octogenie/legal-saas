import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, BeforeCreate } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Tenant } from './tenant.model';
import { Client } from './client.model';
import { User } from './user.model';

@Table({
  tableName: 'cases',
  timestamps: true,
})
export class Case extends Model {
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
    type: DataType.STRING,
    allowNull: false,
    unique: true,
  })
  caseNumber!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'pending',
    validate: {
      isIn: [['pending', 'active', 'on_hold', 'closed', 'archived']],
    },
  })
  status!: 'pending' | 'active' | 'on_hold' | 'closed' | 'archived';

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isIn: [['civil', 'criminal', 'family', 'corporate', 'tax', 'intellectual_property', 'constitutional', 'administrative', 'arbitration', 'other']],
    },
  })
  type!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  subType?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  court!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  courtBranch?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  judge?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  opposingCounsel?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  filingDate?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  nextHearingDate?: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  priority?: 'low' | 'medium' | 'high' | 'urgent';

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  tenantId!: string;

  @BelongsTo(() => Tenant)
  tenant!: Tenant;

  @ForeignKey(() => Client)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  clientId!: string;

  @BelongsTo(() => Client)
  client!: Client;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  assignedTo!: string;

  @BelongsTo(() => User)
  assignedUser!: User;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  parties!: {
    id: string;
    name: string;
    type: 'plaintiff' | 'defendant' | 'respondent' | 'petitioner' | 'appellant' | 'witness' | 'third_party' | 'other';
    role: string;
    contactInfo?: {
      email?: string;
      phone?: string;
      address?: string;
    };
    counsel?: string;
  }[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  timeline!: {
    id: string;
    date: Date;
    title: string;
    description?: string;
    type: 'filing' | 'hearing' | 'order' | 'judgment' | 'submission' | 'other';
    status: 'pending' | 'completed' | 'cancelled' | 'rescheduled';
    notes?: string;
    documents?: string[];
  }[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  team!: {
    userId: string;
    role: 'lead' | 'associate' | 'paralegal' | 'consultant' | 'admin';
    permissions: string[];
  }[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  courtDetails!: {
    courtId?: string;
    courtType?: string;
    jurisdiction?: string;
    bench?: string;
    courtRoom?: string;
    filingNumber?: string;
    cnrNumber?: string;
  };

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  fees!: {
    billingType?: 'hourly' | 'fixed' | 'contingency' | 'retainer';
    estimatedAmount?: number;
    currency?: string;
    ratePerHour?: number;
    retainerAmount?: number;
    contingencyPercentage?: number;
  };

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  metadata!: Record<string, any>;

  @BeforeCreate
  static async generateIds(instance: Case) {
    // Generate IDs for parties if they don't have one
    if (instance.parties && instance.parties.length > 0) {
      instance.parties = instance.parties.map(party => {
        if (!party.id) {
          return { ...party, id: uuidv4() };
        }
        return party;
      });
    }

    // Generate IDs for timeline events if they don't have one
    if (instance.timeline && instance.timeline.length > 0) {
      instance.timeline = instance.timeline.map(event => {
        if (!event.id) {
          return { ...event, id: uuidv4() };
        }
        return event;
      });
    }
  }
}

export default Case;