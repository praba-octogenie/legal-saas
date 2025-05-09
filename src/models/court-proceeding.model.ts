import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, BeforeCreate } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Tenant } from './tenant.model';
import { Case } from './case.model';
import { User } from './user.model';

@Table({
  tableName: 'court_proceedings',
  timestamps: true,
})
export class CourtProceeding extends Model {
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
    type: DataType.DATE,
    allowNull: false,
  })
  date!: Date;

  @Column({
    type: DataType.TIME,
    allowNull: true,
  })
  time?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'scheduled',
    validate: {
      isIn: [['scheduled', 'in_progress', 'completed', 'adjourned', 'cancelled']],
    },
  })
  status!: 'scheduled' | 'in_progress' | 'completed' | 'adjourned' | 'cancelled';

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isIn: [['hearing', 'trial', 'conference', 'motion', 'appeal', 'judgment', 'order', 'other']],
    },
  })
  type!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  courtRoom?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  judge?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  description?: string;

  @Column({
    type: DataType.TEXT,
    allowNull: true,
  })
  notes?: string;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  nextDate?: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  outcome?: string;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  tenantId!: string;

  @BelongsTo(() => Tenant)
  tenant!: Tenant;

  @ForeignKey(() => Case)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  caseId!: string;

  @BelongsTo(() => Case)
  case!: Case;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  createdBy!: string;

  @BelongsTo(() => User)
  creator!: User;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  attendees!: {
    id: string;
    name: string;
    role: string;
    type: 'lawyer' | 'client' | 'witness' | 'judge' | 'clerk' | 'expert' | 'other';
    present: boolean;
    notes?: string;
  }[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  documents!: {
    id: string;
    documentId: string;
    name: string;
    type: string;
    status: 'pending' | 'submitted' | 'accepted' | 'rejected';
    notes?: string;
  }[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  tasks!: {
    id: string;
    title: string;
    description?: string;
    dueDate: Date;
    assignedTo: string;
    status: 'pending' | 'in_progress' | 'completed' | 'cancelled';
    priority: 'low' | 'medium' | 'high' | 'urgent';
    completedAt?: Date;
    completedBy?: string;
    notes?: string;
  }[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: [],
  })
  timeline!: {
    id: string;
    timestamp: Date;
    title: string;
    description?: string;
    type: 'status_change' | 'note_added' | 'document_added' | 'task_added' | 'attendee_added' | 'other';
    userId: string;
  }[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  metadata!: Record<string, any>;

  @BeforeCreate
  static async generateIds(instance: CourtProceeding) {
    // Generate IDs for attendees if they don't have one
    if (instance.attendees && instance.attendees.length > 0) {
      instance.attendees = instance.attendees.map(attendee => {
        if (!attendee.id) {
          return { ...attendee, id: uuidv4() };
        }
        return attendee;
      });
    }

    // Generate IDs for documents if they don't have one
    if (instance.documents && instance.documents.length > 0) {
      instance.documents = instance.documents.map(document => {
        if (!document.id) {
          return { ...document, id: uuidv4() };
        }
        return document;
      });
    }

    // Generate IDs for tasks if they don't have one
    if (instance.tasks && instance.tasks.length > 0) {
      instance.tasks = instance.tasks.map(task => {
        if (!task.id) {
          return { ...task, id: uuidv4() };
        }
        return task;
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

export default CourtProceeding;