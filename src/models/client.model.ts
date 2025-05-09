import { Table, Column, Model, DataType, ForeignKey, BelongsTo, HasMany, BeforeCreate } from 'sequelize-typescript';
import { v4 as uuidv4 } from 'uuid';
import { Tenant } from './tenant.model';

@Table({
  tableName: 'clients',
  timestamps: true,
})
export class Client extends Model {
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
    allowNull: true,
  })
  email?: string;

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  phone?: string;

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'individual',
    validate: {
      isIn: [['individual', 'corporate', 'government', 'ngo']],
    },
  })
  type!: 'individual' | 'corporate' | 'government' | 'ngo';

  @Column({
    type: DataType.STRING,
    allowNull: false,
    defaultValue: 'active',
    validate: {
      isIn: [['active', 'inactive', 'blocked']],
    },
  })
  status!: 'active' | 'inactive' | 'blocked';

  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  category?: string;

  @ForeignKey(() => Tenant)
  @Column({
    type: DataType.UUID,
    allowNull: false,
  })
  tenantId!: string;

  @BelongsTo(() => Tenant)
  tenant!: Tenant;

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  address!: {
    street?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    country?: string;
  };

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  kycDetails!: {
    verified: boolean;
    verificationDate?: Date;
    verifiedBy?: string;
    documents: {
      type: string;
      documentId: string;
      documentUrl: string;
      uploadedAt: Date;
      status: 'pending' | 'verified' | 'rejected';
    }[];
    aadharNumber?: string;
    panNumber?: string;
    gstNumber?: string;
    companyRegistrationNumber?: string;
  };

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  contactPersons!: {
    id: string;
    name: string;
    designation?: string;
    email?: string;
    phone?: string;
    isPrimary: boolean;
  }[];

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  preferences!: {
    language?: string;
    communicationChannel?: 'email' | 'phone' | 'portal';
    notificationPreferences?: {
      email?: boolean;
      sms?: boolean;
      portal?: boolean;
    };
  };

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  portalAccess!: {
    enabled: boolean;
    username?: string;
    lastLogin?: Date;
    accessLevel?: 'full' | 'limited' | 'readonly';
  };

  @Column({
    type: DataType.JSONB,
    allowNull: false,
    defaultValue: {},
  })
  metadata!: Record<string, any>;

  @BeforeCreate
  static async generateContactPersonId(instance: Client) {
    // If contact persons exist but don't have IDs, generate them
    if (instance.contactPersons && instance.contactPersons.length > 0) {
      instance.contactPersons = instance.contactPersons.map(person => {
        if (!person.id) {
          return { ...person, id: uuidv4() };
        }
        return person;
      });
    }
  }
}

export default Client;