import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany } from 'sequelize-typescript';
import { Tenant } from './tenant.model';
import { User } from './user.model';
import { Client } from './client.model';
import { Case } from './case.model';

// Define interfaces to avoid circular dependencies
interface IConversation {
  id: string;
  messages?: IMessage[];
}

interface IMessage {
  id: string;
  conversation?: IConversation;
  conversationId?: string;
}

@Table({
  tableName: 'notifications',
  timestamps: true,
})
export class Notification extends Model {
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
    allowNull: false,
  })
  content!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    validate: {
      isIn: [['info', 'success', 'warning', 'error']],
    },
  })
  type!: 'info' | 'success' | 'warning' | 'error';

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'unread',
    validate: {
      isIn: [['unread', 'read', 'archived']],
    },
  })
  status!: 'unread' | 'read' | 'archived';

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  link?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  action?: string;

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
  userId!: string;

  @BelongsTo(() => User)
  user!: User;

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
    defaultValue: {},
  })
  metadata!: Record<string, any>;
}

@Table({
  tableName: 'conversations',
  timestamps: true,
})
export class Conversation extends Model implements IConversation {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  title?: string;

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
    defaultValue: 'direct',
    validate: {
      isIn: [['direct', 'group', 'case', 'client']],
    },
  })
  type!: 'direct' | 'group' | 'case' | 'client';

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
    type: DataType.ARRAY(DataType.UUID),
    allowNull: false,
    defaultValue: [],
  })
  participants!: string[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  metadata!: Record<string, any>;

  // Define the messages relationship
  @HasMany(() => Message)
  messages?: Message[];
}

@Table({
  tableName: 'messages',
  timestamps: true,
})
export class Message extends Model implements IMessage {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @Column({
    type: DataType.TEXT,
    allowNull: false,
  })
  content!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'text',
    validate: {
      isIn: [['text', 'html', 'markdown']],
    },
  })
  contentType!: 'text' | 'html' | 'markdown';

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'chat',
    validate: {
      isIn: [['chat', 'email', 'sms', 'notification']],
    },
  })
  messageType!: 'chat' | 'email' | 'sms' | 'notification';

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'sent',
    validate: {
      isIn: [['draft', 'sent', 'delivered', 'read', 'failed']],
    },
  })
  status!: 'draft' | 'sent' | 'delivered' | 'read' | 'failed';

  @Column({
    type: DataType.BOOLEAN,
    allowNull: false,
    defaultValue: false,
  })
  isSystemMessage!: boolean;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: true,
  })
  attachments?: string[];

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
  senderId!: string;

  @BelongsTo(() => User)
  sender!: User;

  @ForeignKey(() => User)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  recipientId?: string;

  @BelongsTo(() => User)
  recipient?: User;

  @ForeignKey(() => Client)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  clientId?: string;

  @BelongsTo(() => Client)
  client?: Client;

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
    defaultValue: {},
  })
  metadata!: Record<string, any>;

  @ForeignKey(() => Conversation)
  @Column({
    type: DataType.UUID,
    allowNull: true,
  })
  conversationId?: string;

  @BelongsTo(() => Conversation)
  conversation?: Conversation;
}

export default { Message, Conversation, Notification };