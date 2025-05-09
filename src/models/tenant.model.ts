import { Table, Column, Model, DataType, HasMany, BeforeCreate } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { encrypt } from '../utils/encryption';

@Table({
  tableName: 'tenants',
  timestamps: true,
})
export class Tenant extends Model {
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
  })
  name!: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    unique: true,
    validate: {
      is: /^[a-z0-9-]+$/i, // Only allow alphanumeric and hyphen
    },
  })
  subdomain!: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  customDomain?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive', 'suspended', 'trial']],
    },
  })
  status!: 'active' | 'inactive' | 'suspended' | 'trial';

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'basic',
    validate: {
      isIn: [['basic', 'professional', 'enterprise']],
    },
  })
  plan!: 'basic' | 'professional' | 'enterprise';

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  trialEndsAt?: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  subscriptionEndsAt?: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  encryptionKey?: string;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  settings!: {
    theme?: {
      primaryColor?: string;
      secondaryColor?: string;
      logo?: string;
    };
    features?: {
      multiLanguage?: boolean;
      documentGeneration?: boolean;
      legalResearch?: boolean;
      billing?: boolean;
      communication?: boolean;
      mobileApp?: boolean;
    };
    limits?: {
      users?: number;
      storage?: number;
      cases?: number;
      documents?: number;
    };
    defaultLanguage?: string;
    supportedLanguages?: string[];
  };

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  contactInfo!: {
    email?: string;
    phone?: string;
    address?: {
      street?: string;
      city?: string;
      state?: string;
      postalCode?: string;
      country?: string;
    };
  };

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  integrations!: {
    eCourtApi?: {
      enabled: boolean;
      apiKey?: string;
    };
    legalResearch?: {
      sccOnline?: {
        enabled: boolean;
        apiKey?: string;
      };
      manupatra?: {
        enabled: boolean;
        apiKey?: string;
      };
      indianKanoon?: {
        enabled: boolean;
        apiKey?: string;
      };
    };
    rocketChat?: {
      enabled: boolean;
      url?: string;
      adminUsername?: string;
      adminPassword?: string;
    };
    googleMeet?: {
      enabled: boolean;
      clientId?: string;
      clientSecret?: string;
    };
  };

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  metadata!: Record<string, any>;

  @BeforeCreate
  static async generateEncryptionKey(instance: Tenant) {
    if (!instance.encryptionKey) {
      instance.encryptionKey = encrypt(uuidv4(), process.env.ENCRYPTION_KEY || 'default-key');
    }
  }
}

export default Tenant;