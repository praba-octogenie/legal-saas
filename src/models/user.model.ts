import { Table, Column, Model, DataType, ForeignKey, BelongsTo, BeforeCreate, BeforeSave } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { hashPassword } from '../utils/encryption';
import { Tenant } from './tenant.model';

@Table({
  tableName: 'users',
  timestamps: true,
  underscored: true, // This will convert camelCase to snake_case for column names
})
export class User extends Model {
  @Column({
    type: DataType.UUID,
    primaryKey: true,
    defaultValue: DataType.UUIDV4,
  })
  id!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    validate: {
      isEmail: true,
    },
  })
  email!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
  })
  password!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'first_name', // Explicitly map to snake_case column name
  })
  firstName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    field: 'last_name', // Explicitly map to snake_case column name
  })
  lastName!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'user',
    validate: {
      isIn: [['admin', 'manager', 'lawyer', 'paralegal', 'staff', 'user']],
    },
  })
  role!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive', 'suspended']],
    },
  })
  status!: 'active' | 'inactive' | 'suspended';

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.UUID,
    allowNull: true,
    field: 'tenant_id', // Explicitly map to snake_case column name
  })
  tenantId?: string;

  @BelongsTo(() => Tenant)
  tenant?: Tenant;

  @Column({
    type: DataType.ARRAY(DataType.STRING),
    allowNull: false,
    defaultValue: [],
  })
  permissions!: string[];

  @Column({
    type: DataType.DATE,
    allowNull: true,
    field: 'last_login', // Explicitly map to snake_case column name
  })
  lastLogin?: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'profile_picture', // Explicitly map to snake_case column name
  })
  profilePicture?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'phone_number', // Explicitly map to snake_case column name
  })
  phoneNumber?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  designation?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  department?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
    field: 'bar_council_number', // Explicitly map to snake_case column name
  })
  barCouncilNumber?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  preferences!: {
    language?: string;
    theme?: string;
    notifications?: {
      email?: boolean;
      sms?: boolean;
      inApp?: boolean;
    };
    timezone?: string;
  };

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  metadata!: Record<string, any>;

  @BeforeCreate
  @BeforeSave
  static async hashPasswordHook(instance: User) {
    // Only hash the password if it has been modified
    if (instance.changed('password')) {
      instance.password = await hashPassword(instance.password);
    }
  }

  // Virtual field for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}

export default User;